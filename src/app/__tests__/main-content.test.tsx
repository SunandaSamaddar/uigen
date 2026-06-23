import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MainContent } from "@/app/main-content";

// Mock the leaf components so we only exercise the Preview/Code toggle wiring.
vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div>ChatInterface</div>,
}));
vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree">FileTree</div>,
}));
vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor">CodeEditor</div>,
}));
vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame">PreviewFrame</div>,
}));
vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div>HeaderActions</div>,
}));

afterEach(() => {
  cleanup();
});

describe("MainContent Preview/Code toggle", () => {
  test("defaults to the preview view", () => {
    render(<MainContent />);

    expect(screen.getByTestId("preview-frame")).toBeTruthy();
    expect(screen.queryByTestId("code-editor")).toBeNull();
  });

  test("clicking Code switches to the code view", async () => {
    const user = userEvent.setup();
    render(<MainContent />);

    await user.click(screen.getByRole("tab", { name: "Code" }));

    expect(screen.getByTestId("code-editor")).toBeTruthy();
    expect(screen.getByTestId("file-tree")).toBeTruthy();
    expect(screen.queryByTestId("preview-frame")).toBeNull();
  });

  test("clicking Preview switches back to the preview view", async () => {
    const user = userEvent.setup();
    render(<MainContent />);

    await user.click(screen.getByRole("tab", { name: "Code" }));
    expect(screen.getByTestId("code-editor")).toBeTruthy();

    await user.click(screen.getByRole("tab", { name: "Preview" }));

    expect(screen.getByTestId("preview-frame")).toBeTruthy();
    expect(screen.queryByTestId("code-editor")).toBeNull();
  });

  test("toggling back and forth repeatedly keeps working", async () => {
    const user = userEvent.setup();
    render(<MainContent />);

    for (let i = 0; i < 3; i++) {
      await user.click(screen.getByRole("tab", { name: "Code" }));
      expect(screen.getByTestId("code-editor")).toBeTruthy();
      expect(screen.queryByTestId("preview-frame")).toBeNull();

      await user.click(screen.getByRole("tab", { name: "Preview" }));
      expect(screen.getByTestId("preview-frame")).toBeTruthy();
      expect(screen.queryByTestId("code-editor")).toBeNull();
    }
  });
});
