import { test, expect, vi, afterEach, describe } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MainContent } from "../main-content";

// Mock the heavy child components so the test focuses purely on the
// Preview/Code toggle wiring in MainContent.
vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div>ChatInterface</div>,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div>HeaderActions</div>,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame">PreviewFrame</div>,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor">CodeEditor</div>,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree">FileTree</div>,
}));

afterEach(() => {
  cleanup();
});

// NOTE on the activation event:
// Radix `TabsTrigger` switches tabs on `mousedown` (with the primary button),
// NOT on a bare synthetic `click`. `fireEvent.click` never dispatches
// `mousedown`, and `userEvent.click` is flaky under jsdom because it relies on
// focus / pointer-capture APIs jsdom doesn't fully implement. Driving the
// `mousedown` the component actually listens for makes these tests
// deterministic.
function clickTab(name: "Preview" | "Code") {
  fireEvent.mouseDown(screen.getByRole("tab", { name }));
}

describe("MainContent Preview/Code toggle", () => {
  test("defaults to the preview view", () => {
    render(<MainContent />);

    expect(screen.getByTestId("preview-frame")).toBeTruthy();
    expect(screen.queryByTestId("code-editor")).toBeNull();
  });

  test("clicking Code switches to the code view", () => {
    render(<MainContent />);

    clickTab("Code");

    expect(screen.getByTestId("code-editor")).toBeTruthy();
    expect(screen.getByTestId("file-tree")).toBeTruthy();
    expect(screen.queryByTestId("preview-frame")).toBeNull();
  });

  test("clicking Preview switches back to the preview view", () => {
    render(<MainContent />);

    clickTab("Code");
    expect(screen.getByTestId("code-editor")).toBeTruthy();

    clickTab("Preview");
    expect(screen.getByTestId("preview-frame")).toBeTruthy();
    expect(screen.queryByTestId("code-editor")).toBeNull();
  });

  test("toggling back and forth repeatedly keeps working", () => {
    render(<MainContent />);

    for (let i = 0; i < 3; i++) {
      clickTab("Code");
      expect(screen.getByTestId("code-editor")).toBeTruthy();
      expect(screen.queryByTestId("preview-frame")).toBeNull();

      clickTab("Preview");
      expect(screen.getByTestId("preview-frame")).toBeTruthy();
      expect(screen.queryByTestId("code-editor")).toBeNull();
    }
  });
});
