"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const navigationShortcuts: Record<string, string> = {
  Digit1: "/features/billing-pos",
  Digit2: "/features/inventory-management",
  Digit3: "/features/online-ordering",
  Digit4: "/features/table-management",
  Digit5: "/features/reporting-analytics",
  Digit6: "/features/crm",
  KeyH: "/",
};

export function GlobalKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts while typing
      const target = event.target as HTMLElement | null;

      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (
        !event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      ) {
        return;
      }

      const href = navigationShortcuts[event.code];
      if (!href || event.repeat) return;

      event.preventDefault();
      router.push(href);
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [router]);

  return null;
}
