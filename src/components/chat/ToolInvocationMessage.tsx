"use client";

import { Loader2 } from "lucide-react";
import type { ToolInvocation } from "ai";

interface ToolInvocationMessageProps {
  toolInvocation: ToolInvocation;
}

function getFileName(path?: string): string {
  if (!path) return "";
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] || path;
}

export function getToolInvocationLabel(toolInvocation: ToolInvocation): string {
  const { toolName } = toolInvocation;
  const args = (toolInvocation.args ?? {}) as {
    command?: string;
    path?: string;
    new_path?: string;
  };
  const fileName = getFileName(args.path);

  if (toolName === "str_replace_editor") {
    switch (args.command) {
      case "create":
        return fileName ? `Creating ${fileName}` : "Creating file";
      case "str_replace":
      case "insert":
        return fileName ? `Editing ${fileName}` : "Editing file";
      case "view":
        return fileName ? `Viewing ${fileName}` : "Viewing file";
      case "undo_edit":
        return fileName ? `Undoing changes to ${fileName}` : "Undoing changes";
    }
  }

  if (toolName === "file_manager") {
    switch (args.command) {
      case "rename": {
        const newName = getFileName(args.new_path);
        return fileName && newName
          ? `Renaming ${fileName} to ${newName}`
          : "Renaming file";
      }
      case "delete":
        return fileName ? `Deleting ${fileName}` : "Deleting file";
    }
  }

  return toolName;
}

export function ToolInvocationMessage({
  toolInvocation,
}: ToolInvocationMessageProps) {
  const isComplete =
    toolInvocation.state === "result" && toolInvocation.result;
  const label = getToolInvocationLabel(toolInvocation);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isComplete ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
