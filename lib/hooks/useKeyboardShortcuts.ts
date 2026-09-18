import { useEffect, useRef } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrlOrCmd?: boolean;
  alt?: boolean;
  shift?: boolean;
  handler: () => void;
  description: string;
}

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLInputElement ||
  target instanceof HTMLTextAreaElement ||
  target instanceof HTMLSelectElement ||
  (target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.closest('[contenteditable="true"]') !== null));

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (isTypingTarget(event.target) && !event.ctrlKey && !event.metaKey) {
        return;
      }

      const shortcut = shortcutsRef.current.find((entry) => {
        const matchesKey = event.key.toLowerCase() === entry.key.toLowerCase();

        const matchesCtrlOrCmd = entry.ctrlOrCmd
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey;

        const matchesAlt = entry.alt ? event.altKey : !event.altKey;

        const matchesShift = entry.shift ? event.shiftKey : true;

        return matchesKey && matchesCtrlOrCmd && matchesAlt && matchesShift;
      });

      if (!shortcut) return;

      event.preventDefault();
      shortcut.handler();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);
}
