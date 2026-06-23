// @vitest-environment node
//
// auth.ts is server-only. Run in node (not the default jsdom) so jose's
// `instanceof Uint8Array` key check sees the same realm that TextEncoder
// produces — under jsdom the realms differ and signing throws.
import { test, expect, vi, beforeEach } from "vitest";

// `auth.ts` is server-only and writes cookies via next/headers. Mock both:
// - server-only would throw when imported outside a real server runtime
// - next/headers gives us a controllable, in-memory cookie store so we can
//   inspect what createSession() writes.
// jose itself is NOT mocked — we exercise real JWT signing.
const { mockCookieStore } = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    mockCookieStore: {
      store,
      get: vi.fn((name: string) =>
        store.has(name) ? { name, value: store.get(name) } : undefined
      ),
      set: vi.fn((name: string, value: string) => {
        store.set(name, value);
      }),
      delete: vi.fn((name: string) => {
        store.delete(name);
      }),
    },
  };
});

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => mockCookieStore),
}));

import { createSession, getSession } from "../auth";

const COOKIE_NAME = "auth-token";

beforeEach(() => {
  mockCookieStore.store.clear();
  vi.clearAllMocks();
  delete process.env.NODE_ENV;
});

test("createSession sets a signed auth-token cookie with secure options", async () => {
  await createSession("user-123", "test@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledTimes(1);
  const [name, token, options] = mockCookieStore.set.mock.calls[0];

  expect(name).toBe(COOKIE_NAME);
  expect(typeof token).toBe("string");
  // A JWT has three dot-separated segments.
  expect((token as string).split(".")).toHaveLength(3);

  expect(options).toMatchObject({
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  expect(options.expires).toBeInstanceOf(Date);
  expect((options.expires as Date).getTime()).toBeGreaterThan(Date.now());
});

test("createSession marks the cookie secure only in production", async () => {
  process.env.NODE_ENV = "production";
  await createSession("user-1", "prod@example.com");
  expect(mockCookieStore.set.mock.calls[0][2].secure).toBe(true);

  vi.clearAllMocks();
  process.env.NODE_ENV = "development";
  await createSession("user-1", "dev@example.com");
  expect(mockCookieStore.set.mock.calls[0][2].secure).toBe(false);
});

test("getSession returns null when no cookie is set", async () => {
  expect(await getSession()).toBeNull();
});

test("getSession round-trips the payload written by createSession", async () => {
  await createSession("user-123", "test@example.com");

  const session = await getSession();
  expect(session).not.toBeNull();
  expect(session!.userId).toBe("user-123");
  expect(session!.email).toBe("test@example.com");
  expect(session!.expiresAt).toBeDefined();
});

test("getSession returns null for a malformed token", async () => {
  mockCookieStore.store.set(COOKIE_NAME, "not-a-valid-jwt");
  expect(await getSession()).toBeNull();
});

test("getSession returns null for a token signed with a different secret", async () => {
  // Token built by jose with a key other than the module's JWT_SECRET.
  const { SignJWT } = await import("jose");
  const wrongKey = new TextEncoder().encode("some-other-secret");
  const token = await new SignJWT({ userId: "x", email: "x@example.com" })
    .setProtectedHeader({ alg: "HS256" })
    .sign(wrongKey);

  mockCookieStore.store.set(COOKIE_NAME, token);
  expect(await getSession()).toBeNull();
});
