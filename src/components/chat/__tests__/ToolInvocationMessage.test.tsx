import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import type { ToolInvocation } from "ai";
import {
  ToolInvocationMessage,
  getToolInvocationLabel,
} from "../ToolInvocationMessage";

afterEach(() => {
  cleanup();
});

function makeInvocation(
  overrides: Partial<ToolInvocation> & { args?: any }
): ToolInvocation {
  return {
    toolCallId: "call_1",
    toolName: "str_replace_editor",
    state: "result",
    args: {},
    result: "Success",
    ...overrides,
  } as ToolInvocation;
}

test("str_replace_editor create renders 'Creating {file}'", () => {
  render(
    <ToolInvocationMessage
      toolInvocation={makeInvocation({
        args: { command: "create", path: "/App.jsx" },
      })}
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("str_replace_editor str_replace renders 'Editing {file}'", () => {
  render(
    <ToolInvocationMessage
      toolInvocation={makeInvocation({
        args: { command: "str_replace", path: "/components/Card.jsx" },
      })}
    />
  );
  expect(screen.getByText("Editing Card.jsx")).toBeDefined();
});

test("str_replace_editor insert renders 'Editing {file}'", () => {
  render(
    <ToolInvocationMessage
      toolInvocation={makeInvocation({
        args: { command: "insert", path: "/utils.ts" },
      })}
    />
  );
  expect(screen.getByText("Editing utils.ts")).toBeDefined();
});

test("str_replace_editor view renders 'Viewing {file}'", () => {
  render(
    <ToolInvocationMessage
      toolInvocation={makeInvocation({
        args: { command: "view", path: "/App.jsx" },
      })}
    />
  );
  expect(screen.getByText("Viewing App.jsx")).toBeDefined();
});

test("file_manager delete renders 'Deleting {file}'", () => {
  render(
    <ToolInvocationMessage
      toolInvocation={makeInvocation({
        toolName: "file_manager",
        args: { command: "delete", path: "/old/Thing.jsx" },
      })}
    />
  );
  expect(screen.getByText("Deleting Thing.jsx")).toBeDefined();
});

test("file_manager rename renders 'Renaming {old} to {new}'", () => {
  render(
    <ToolInvocationMessage
      toolInvocation={makeInvocation({
        toolName: "file_manager",
        args: {
          command: "rename",
          path: "/components/Old.jsx",
          new_path: "/components/New.jsx",
        },
      })}
    />
  );
  expect(screen.getByText("Renaming Old.jsx to New.jsx")).toBeDefined();
});

test("extracts the basename from a nested path", () => {
  expect(
    getToolInvocationLabel(
      makeInvocation({
        args: { command: "create", path: "/components/ui/Card.jsx" },
      })
    )
  ).toBe("Creating Card.jsx");
});

test("completed state shows the green dot and no spinner", () => {
  const { container } = render(
    <ToolInvocationMessage
      toolInvocation={makeInvocation({
        args: { command: "create", path: "/App.jsx" },
        state: "result",
        result: "Success",
      })}
    />
  );
  expect(container.querySelector(".bg-emerald-500")).not.toBeNull();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("in-progress state shows the spinner and no green dot", () => {
  const { container } = render(
    <ToolInvocationMessage
      toolInvocation={makeInvocation({
        args: { command: "create", path: "/App.jsx" },
        state: "call",
        result: undefined,
      })}
    />
  );
  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("falls back to the tool name for unknown tools", () => {
  render(
    <ToolInvocationMessage
      toolInvocation={makeInvocation({
        toolName: "some_other_tool",
        args: { command: "create", path: "/App.jsx" },
      })}
    />
  );
  expect(screen.getByText("some_other_tool")).toBeDefined();
});

test("falls back to the tool name when args are empty (streaming)", () => {
  render(
    <ToolInvocationMessage
      toolInvocation={makeInvocation({
        toolName: "str_replace_editor",
        args: {},
        state: "call",
        result: undefined,
      })}
    />
  );
  expect(screen.getByText("str_replace_editor")).toBeDefined();
});

test("uses a generic label when command is known but path is missing", () => {
  expect(
    getToolInvocationLabel(
      makeInvocation({ args: { command: "create" } })
    )
  ).toBe("Creating file");
});
