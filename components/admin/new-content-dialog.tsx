"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import {
  CalendarIcon,
  CloseIcon,
  ComposeIcon,
  EditHistoryIcon,
  LibraryIcon,
} from "@/components/icons";

interface NewContentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (kind: "post" | "note" | "now" | "book") => void;
}

const options: {
  kind: "post" | "note" | "now" | "book";
  title: string;
  description: string;
  icon: ReactNode;
}[] = [
  {
    kind: "post",
    title: "Essay",
    description: "A long-form piece with sections and references.",
    icon: <ComposeIcon className="h-4 w-4" />,
  },
  {
    kind: "note",
    title: "Note",
    description: "A short observation, published as a scribble.",
    icon: <EditHistoryIcon className="h-4 w-4" />,
  },
  {
    kind: "now",
    title: "Now",
    description: "Add an entry to your current status timeline.",
    icon: <CalendarIcon className="h-4 w-4" />,
  },
  {
    kind: "book",
    title: "Book",
    description: "Add a title to your reading library.",
    icon: <LibraryIcon className="h-4 w-4" />,
  },
];

export function NewContentDialog({
  isOpen,
  onClose,
  onSelect,
}: NewContentDialogProps) {
  const firstRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    firstRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[115] flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-content-title"
        className="w-full max-w-md rounded-2xl border border-tinted/30 bg-night-soft p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="new-content-title"
              className="text-lg font-semibold text-paper"
            >
              Create something
            </h2>
            <p className="mt-1 text-xs text-gray-mid">
              Pick a format. You can change the details before publishing.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close create menu"
            className="rounded-full p-1.5 text-gray-mid transition-colors hover:bg-post-card hover:text-paper"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid gap-1.5">
          {options.map((option, index) => (
            <button
              key={option.kind}
              ref={index === 0 ? firstRef : undefined}
              type="button"
              onClick={() => onSelect(option.kind)}
              className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition-colors hover:border-tinted/30 hover:bg-post-card focus-visible:border-tinted/30 focus-visible:bg-post-card focus-visible:outline-none"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-tinted/30 bg-night text-gray-mid">
                {option.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-paper">
                  {option.title}
                </span>
                <span className="block text-xs text-gray-mid">
                  {option.description}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
