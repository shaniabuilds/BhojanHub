"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

export function ConditionalFooter() {
  const pathname = usePathname();

  if (pathname === "/features/billing-pos" || pathname === "/login") {
    return null;
  }

  return <Footer />;
}
