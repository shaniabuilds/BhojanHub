
import type { Metadata } from "next";
import { Cormorant_Garamond, Poppins } from "next/font/google";
// import { ConditionalFooter } from "@/components/ConditionalFooter";
import { ConditionalNavbar } from "@/components/ConditionalNavbar";
import "./globals.css";
import { GlobalKeyboardShortcuts } from "@/components/shared/GlobalKeyboardShortcuts";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BhojanHub - Modern Restaurant Management Platform",
  description:
    "A premium restaurant SaaS platform for reservations, POS billing, inventory, and culinary operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${poppins.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-cream-50 font-sans text-secondary-900 antialiased">
        <ConditionalNavbar />

        <main className="w-full flex-1">
          <GlobalKeyboardShortcuts />
          {children}
        </main>

        {/* <ConditionalFooter /> */}
      </body>
    </html>
  );
}
