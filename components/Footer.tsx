
"use client";

import React from "react";
import Link from "next/link";
import {
  Utensils,
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  Youtube,
} from "lucide-react";

interface FooterLink {
  label: string;
  href: string;
}

const productLinks: FooterLink[] = [
  { label: "Billing & POS", href: "/features/billing-pos" },
  { label: "Inventory Management", href: "/features/inventory-management" },
  { label: "Online Ordering", href: "/features/online-ordering" },
  { label: "Table Management", href: "/features/table-management" },
  { label: "Reporting & Analytics", href: "/features/reporting-analytics" },
  { label: "CRM", href: "/features/crm" },
];

const resourceLinks: FooterLink[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Orders", href: "/orders" },
  { label: "Kitchen", href: "/kitchen" },
  { label: "Menu Management", href: "/menu" },
  { label: "Customers", href: "/customers" },
  { label: "Settings", href: "/settings" },
];

const legalLinks: FooterLink[] = [
  { label: "Privacy Policy", href: "#privacy" },
  { label: "Terms of Service", href: "#terms" },
];

const socialLinks = [
  {
    name: "Twitter / X",
    href: "https://twitter.com",
    icon: Twitter,
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com",
    icon: Linkedin,
  },
  {
    name: "Instagram",
    href: "https://instagram.com",
    icon: Instagram,
  },
  {
    name: "Facebook",
    href: "https://facebook.com",
    icon: Facebook,
  },
  {
    name: "YouTube",
    href: "https://youtube.com",
    icon: Youtube,
  },
];

export function Footer() {
  return (
    <footer className="relative bg-[#3A1A16] text-white">
      <div className="mx-auto max-w-7xl px-6 pb-10 pt-16 lg:px-10 lg:pt-20">
        {/* Footer Top */}
        <div className="grid gap-12 border-b border-white/10 pb-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="max-w-sm">
            <Link
              href="/"
              className="group inline-flex items-center gap-3"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F3E9DC]/15 bg-[#F3E9DC]/5 text-[#F3E9DC] transition group-hover:border-[#C93E2B] group-hover:bg-[#C93E2B]">
                <Utensils size={18} />
              </span>

              <span className="font-display text-3xl font-semibold tracking-tight text-[#F3E9DC]">
                Bhojan<span className="text-[#C93E2B]">Hub</span>
              </span>
            </Link>

            <p className="mt-5 max-w-xs font-sans text-sm leading-6 text-[#F3E9DC]/55">
              A unified restaurant management platform built to simplify
              daily operations and help modern restaurants run better.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C93E2B]">
              Product
            </h4>

            <ul className="mt-5 space-y-3">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-sans text-sm text-[#F3E9DC]/60 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C93E2B]">
              Platform
            </h4>

            <ul className="mt-5 space-y-3">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-sans text-sm text-[#F3E9DC]/60 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C93E2B]">
              Legal
            </h4>

            <ul className="mt-5 space-y-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-sans text-sm text-[#F3E9DC]/60 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="flex flex-col items-center justify-between gap-6 pt-8 sm:flex-row">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <p className="font-sans text-xs leading-5 text-[#F3E9DC]/45">
              &copy; {new Date().getFullYear()} BhojanHub. All rights reserved.
            </p>

            <p className="font-sans text-[10px] text-[#F3E9DC]/30">
              Restaurant management, simplified.
            </p>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-2">
            {socialLinks.map((item) => {
              const Icon = item.icon;

              return (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.name}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#F3E9DC]/15 text-[#F3E9DC]/55 transition-all hover:border-[#C93E2B] hover:bg-[#C93E2B] hover:text-white"
                >
                  <Icon size={15} />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
