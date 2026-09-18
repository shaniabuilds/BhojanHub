
"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface Shortcut {
  key: string;
  description: string;
}

interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: Shortcut[];
}

export function ShortcutsHelpModal({
  isOpen,
  onClose,
  shortcuts,
}: ShortcutsHelpModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      className="fixed inset-0 z-[60] grid place-items-center bg-[#21100d]/45 p-4 backdrop-blur-[3px]"
    >
      <button
        type="button"
        aria-label="Close keyboard shortcuts"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />

      <section className="relative max-h-[85vh] w-full max-w-md overflow-hidden rounded-2xl border border-[#3A1A16]/10 bg-[#FFFCF9] p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#C93E2B]">
              Keyboard shortcuts
            </p>

            <h2
              id="shortcuts-title"
              className="mt-1 font-display text-2xl text-[#3A1A16]"
            >
              Work a little faster
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
            className="rounded-lg p-1.5 text-[#665650] transition hover:bg-[#F3E9DC] hover:text-[#3A1A16]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 max-h-[58vh] overflow-y-auto pr-1">
          <ul className="space-y-2">
            {shortcuts.map((shortcut) => (
              <li
                key={`${shortcut.key}-${shortcut.description}`}
                className="flex items-center justify-between gap-4 rounded-xl bg-[#F3E9DC]/55 px-3.5 py-3 text-sm text-[#665650]"
              >
                <span>{shortcut.description}</span>

                <kbd className="shrink-0 rounded-md border border-[#3A1A16]/15 bg-white px-2 py-1 font-mono text-xs font-semibold text-[#3A1A16]">
                  {shortcut.key}
                </kbd>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-4 text-xs text-[#88756E]">
          Press Esc to close.
        </p>
      </section>
    </div>
  );
}
