

"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Utensils,
  Menu,
  X,
  ChevronDown,
  Calendar,
  Flame,
  LayoutGrid,
  Users,
  BarChart3,
  ArrowRight,
  Sparkles,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface FeatureItem {
  name: string;
  description: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

const featuresList: FeatureItem[] = [
  {
    name: "Billing & POS",
    description: "One-tap billing, multi-payment support & offline mode",
    href: "/features/billing-pos",
    icon: BarChart3,
    badge: "Popular",
  },
  {
    name: "Inventory Management",
    description: "Real-time stock tracking, low-stock alerts & vendor logs",
    href: "/features/inventory-management",
    icon: LayoutGrid,
  },
  {
    name: "Online Ordering",
    description: "Branded ordering page, aggregator sync & menu auto-sync",
    href: "/features/online-ordering",
    icon: Flame,
  },
  {
    name: "Table Management",
    description: "Live floor plans, smart reservations & waitlist management",
    href: "/features/table-management",
    icon: Calendar,
  },
  {
    name: "Reporting & Analytics",
    description: "Sales dashboards, menu engineering & staff performance",
    href: "/features/reporting-analytics",
    icon: Users,
  },
  {
    name: "CRM",
    description: "Guest profiles, loyalty programs & automated campaigns",
    href: "/features/crm",
    icon: Sparkles,
  },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresDropdownOpen, setFeaturesDropdownOpen] = useState(false);
  const [mobileFeaturesExpanded, setMobileFeaturesExpanded] =
    useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setFeaturesDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        setFeaturesDropdownOpen(false);
        setMobileFeaturesExpanded(false);
      }
    }

    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileFeaturesExpanded(false);
  };

  const scrollToDemo = () => {
    const el = document.getElementById("demo-section");

    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  };

  return (
    <>
      {/* =====================================================
          NAVBAR
      ===================================================== */}
      <header className="sticky top-0 z-40 border-b border-[#3A1A16]/10 bg-[#F3E9DC]/95 backdrop-blur-md">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex min-h-[68px] w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-10"
        >
          {/* =================================================
              LOGO
          ================================================= */}
          <Link
            href="/"
            onClick={closeMobileMenu}
            className="group flex min-w-0 shrink-0 items-center gap-2 sm:gap-3"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#3A1A16]/15 bg-[#3A1A16]/5 text-[#3A1A16] transition group-hover:border-[#C93E2B] group-hover:bg-[#C93E2B] group-hover:text-white sm:h-10 sm:w-10">
              <Utensils size={17} className="sm:hidden" />
              <Utensils size={19} className="hidden sm:block" />
            </span>

            <span className="font-display text-2xl font-semibold tracking-tight text-[#3A1A16] sm:text-3xl">
              Bhojan<span className="text-[#C93E2B]">Hub</span>
            </span>
          </Link>

          {/* =================================================
              DESKTOP NAVIGATION
          ================================================= */}
          <div className="hidden items-center gap-1 lg:flex">
            <Link
              href="/"
              className="px-4 py-2 font-sans text-sm font-medium text-[#3A1A16]/70 transition hover:text-[#3A1A16]"
            >
              Home
            </Link>

            {/* Features Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() =>
                  setFeaturesDropdownOpen((prev) => !prev)
                }
                onMouseEnter={() => setFeaturesDropdownOpen(true)}
                aria-expanded={featuresDropdownOpen}
                aria-haspopup="true"
                className={`inline-flex items-center gap-1.5 px-4 py-2 font-sans text-sm font-medium transition ${
                  featuresDropdownOpen
                    ? "text-[#3A1A16]"
                    : "text-[#3A1A16]/70 hover:text-[#3A1A16]"
                }`}
              >
                Features

                <ChevronDown
                  size={15}
                  className={`transition-transform duration-200 ${
                    featuresDropdownOpen
                      ? "rotate-180 text-[#C93E2B]"
                      : "text-[#3A1A16]/45"
                  }`}
                />
              </button>

              {featuresDropdownOpen && (
                <div
                  onMouseLeave={() => setFeaturesDropdownOpen(false)}
                  className="absolute left-1/2 top-full z-50 mt-3 w-[min(520px,calc(100vw-32px))] -translate-x-1/2 rounded-2xl border border-[#3A1A16]/10 bg-[#FDFBF7] p-4 shadow-[0_20px_60px_rgba(58,26,22,0.14)]"
                >
                  {/* Dropdown Header */}
                  <div className="mb-3 flex items-center justify-between gap-3 border-b border-[#3A1A16]/10 px-2 pb-3">
                    <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[#3A1A16]/45">
                      Platform Modules
                    </span>

                    <span className="flex shrink-0 items-center gap-1.5 font-sans text-[10px] font-semibold uppercase tracking-wider text-[#C93E2B]">
                      <Sparkles size={12} />
                      AI Powered
                    </span>
                  </div>

                  {/* Feature Items */}
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {featuresList.map((item) => {
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() =>
                            setFeaturesDropdownOpen(false)
                          }
                          className="group flex items-start gap-3 rounded-xl p-3 transition hover:bg-[#F3E9DC]"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#3A1A16]/10 bg-[#F3E9DC] text-[#3A1A16] transition group-hover:border-[#C93E2B] group-hover:bg-[#C93E2B] group-hover:text-white">
                            <Icon size={17} />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-sans text-xs font-semibold text-[#3A1A16] transition group-hover:text-[#C93E2B]">
                                {item.name}
                              </span>

                              {item.badge && (
                                <Badge
                                  variant="primary"
                                  size="sm"
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </div>

                            <p className="mt-1 line-clamp-2 font-sans text-[10px] leading-4 text-[#3A1A16]/50">
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Dropdown Bottom */}
                  <div className="mt-3 flex flex-col gap-3 rounded-xl border border-[#3A1A16]/10 bg-[#3A1A16]/[0.035] p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-sans text-xs font-semibold text-[#3A1A16]">
                        Explore all 24+ culinary modules
                      </p>

                      <p className="mt-0.5 font-sans text-[10px] text-[#3A1A16]/45">
                        Built for modern restaurant operations.
                      </p>
                    </div>

                    <Link
                      href="#features"
                      onClick={() =>
                        setFeaturesDropdownOpen(false)
                      }
                      className="flex shrink-0 items-center gap-1 font-sans text-xs font-semibold text-[#C93E2B] transition hover:text-[#3A1A16]"
                    >
                      View All
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* =================================================
              MOBILE ACTIONS
          ================================================= */}
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <Button
              variant="primary"
              size="sm"
              onClick={scrollToDemo}
              className="hidden h-9 bg-[#C93E2B] px-3 text-xs sm:inline-flex"
            >
              Free Demo
            </Button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open mobile menu"
              aria-expanded={mobileMenuOpen}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#3A1A16]/15 bg-[#F3E9DC] text-[#3A1A16] transition hover:border-[#C93E2B] hover:text-[#C93E2B] sm:h-10 sm:w-10"
            >
              <Menu size={20} />
            </button>
          </div>

          {/* =================================================
              DESKTOP LOGOUT
          ================================================= */}
          <button
            type="button"
            onClick={() => void logout()}
            className="hidden items-center gap-1.5 rounded-lg border border-[#3A1A16]/15 px-3 py-2 text-xs font-semibold text-[#3A1A16]/70 transition hover:border-[#C93E2B]/40 hover:text-[#C93E2B] lg:inline-flex"
          >
            <LogOut size={14} />
            Log out
          </button>
        </nav>
      </header>

      {/* =====================================================
          MOBILE DRAWER
      ===================================================== */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation drawer"
        >
          {/* Backdrop */}
          <button
            type="button"
            onClick={closeMobileMenu}
            aria-label="Close mobile menu"
            className="fixed inset-0 h-full w-full cursor-default bg-[#3A1A16]/50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <aside className="fixed inset-y-0 right-0 z-50 flex h-full w-[min(100%,390px)] flex-col overflow-hidden bg-[#F3E9DC] shadow-2xl">
            {/* Drawer Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-[#3A1A16]/10 px-4 py-4 sm:px-6 sm:py-5">
              <Link
                href="/"
                onClick={closeMobileMenu}
                className="flex min-w-0 items-center gap-2.5 sm:gap-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3A1A16] text-[#F3E9DC]">
                  <Utensils size={17} />
                </span>

                <span className="font-display text-2xl font-semibold text-[#3A1A16]">
                  Bhojan<span className="text-[#C93E2B]">Hub</span>
                </span>
              </Link>

              <button
                type="button"
                onClick={closeMobileMenu}
                aria-label="Close navigation menu"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#3A1A16]/55 transition hover:bg-[#3A1A16]/5 hover:text-[#3A1A16]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-7">
              <nav className="space-y-1">
                {/* Home */}
                <Link
                  href="/"
                  onClick={closeMobileMenu}
                  className="block border-b border-[#3A1A16]/10 px-2 py-4 font-sans text-base font-medium text-[#3A1A16]/80 transition hover:text-[#C93E2B]"
                >
                  Home
                </Link>

                {/* Features */}
                <div className="border-b border-[#3A1A16]/10">
                  <button
                    type="button"
                    onClick={() =>
                      setMobileFeaturesExpanded((prev) => !prev)
                    }
                    className="flex w-full items-center justify-between px-2 py-4 font-sans text-base font-medium text-[#3A1A16]/80 transition hover:text-[#C93E2B]"
                    aria-expanded={mobileFeaturesExpanded}
                  >
                    Features

                    <ChevronDown
                      size={18}
                      className={`transition-transform duration-200 ${
                        mobileFeaturesExpanded
                          ? "rotate-180 text-[#C93E2B]"
                          : "text-[#3A1A16]/45"
                      }`}
                    />
                  </button>

                  {mobileFeaturesExpanded && (
                    <div className="mb-3 ml-2 border-l-2 border-[#C93E2B]/40 pl-3 sm:pl-4">
                      {featuresList.map((item) => {
                        const Icon = item.icon;

                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={closeMobileMenu}
                            className="flex items-start gap-3 py-3 font-sans text-sm text-[#3A1A16]/60 transition hover:text-[#C93E2B]"
                          >
                            <Icon
                              size={15}
                              className="mt-0.5 shrink-0 text-[#C93E2B]"
                            />

                            <span className="min-w-0">
                              {item.name}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </nav>

              {/* Support */}
              <div className="mt-7 rounded-xl border border-[#3A1A16]/10 bg-[#FDFBF7] p-4 sm:mt-8 sm:p-5">
                <Badge variant="success" size="sm" withDot>
                  Online Support
                </Badge>

                <p className="mt-3 font-sans text-xs leading-5 text-[#3A1A16]/50">
                  24/7 restaurant operations support.
                </p>

                <div className="mt-3 font-sans text-xs font-medium leading-5 text-[#3A1A16]/70">
                  Support available through the platform.
                </div>
              </div>
            </div>

            {/* Mobile CTA */}
            <div className="shrink-0 border-t border-[#3A1A16]/10 bg-[#FDFBF7] p-4 sm:p-6">
              <Button
                variant="primary"
                size="lg"
                className="h-11 w-full justify-center bg-[#C93E2B] hover:bg-[#b33625]"
                onClick={() => {
                  closeMobileMenu();
                  void logout();
                }}
              >
                Log out
                <LogOut size={17} className="ml-1" />
              </Button>

              <p className="mt-3 text-center font-sans text-[9px] leading-4 text-[#3A1A16]/40 sm:text-[10px]">
                No credit card required • 14-day full platform access
              </p>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}