"use client";

import { useState } from "react";
import {
  ArrowRight,
  Calendar,
  Flame,
  LayoutGrid,
  TrendingUp,
  Users,
  Utensils,
} from "lucide-react";

export default function HomePage() {
  const [demoSubmitted, setDemoSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    restaurant: "",
    email: "",
    concept: "Fine Dining & Tasting Menu",
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.email && formData.name) {
      setDemoSubmitted(true);
    }
  };

  const features = [
    {
      number: "01",
      icon: Calendar,
      title: "Smart Reservations",
      text: "Algorithmic turn pacing prevents the kitchen from receiving 10 tables simultaneously at 7:30 PM.",
    },
    {
      number: "02",
      icon: Flame,
      title: "Kitchen Display (KDS)",
      text: "Automatic fire times for entrées once starters are cleared. Synchronize hot stations in real-time.",
    },
    {
      number: "03",
      icon: LayoutGrid,
      title: "Dynamic Floor Plans",
      text: "Visual seat timers, guest course indicators, and server station load balancing at a glance.",
    },
    {
      number: "04",
      icon: Users,
      title: "Guest CRM & Sommelier",
      text: "Guest dietary restrictions flagged instantly across tickets. Cellar bottle pairing recommendations.",
    },
    {
      number: "05",
      icon: TrendingUp,
      title: "Margin & Menu Matrix",
      text: "Evaluate real-time plate costs, gross margins, and item popularity to optimize seasonal menus.",
    },
    {
      number: "06",
      icon: Utensils,
      title: "Custom POS Integrations",
      text: "Native two-way synchronization with Toast, Micros Symphony, Clover, and Square.",
    },
  ];

  return (
    <div className="w-full overflow-x-hidden">
      {/* =====================================================
          01 — HERO / BURGUNDY
      ====================================================== */}
      <section className="relative bg-[#3A1A16] text-white">
        <div className="mx-auto flex min-h-[560px] max-w-[1440px] items-center justify-center px-5 py-20 sm:min-h-[620px] sm:px-8 sm:py-24 lg:px-12 lg:py-28 2xl:px-16">
          <div className="relative z-10 flex w-full max-w-[1050px] flex-col items-center text-center">
            {/* Eyebrow */}
            <div className="mb-7 flex w-full max-w-full items-center justify-center gap-3 sm:mb-8 sm:gap-4">
              <span className="h-px w-6 shrink-0 bg-[#C93E2B] sm:w-10" />

              <p className="font-sans text-[8px] font-semibold uppercase tracking-[0.2em] text-[#F3E9DC]/70 sm:text-[10px] sm:tracking-[0.3em]">
                Fine dining &amp; modern hospitality
              </p>

              <span className="h-px w-6 shrink-0 bg-[#C93E2B] sm:w-10" />
            </div>

            {/* Hero heading */}
            <h1 className="max-w-[1050px] font-display text-[3.35rem] font-medium leading-[0.9] tracking-[-0.045em] text-white xs:text-[3.7rem] sm:text-[5.6rem] lg:text-[6.4rem] xl:text-[6.9rem]">
              The intelligent OS for
              <br />
              <span className="text-[#F3E9DC]">ambitious kitchens.</span>
            </h1>

            {/* Hero description */}
            <p className="mt-8 max-w-2xl px-2 font-sans text-sm leading-6 text-[#D8CBBE] sm:mt-10 sm:px-0 sm:text-base sm:leading-7">
              Streamline table reservations, harmonize front-of-house
              hospitality, and optimize kitchen pace with a platform crafted for
              culinary excellence.
            </p>

            {/* CTA */}
            <div className="mt-9 flex w-full justify-center sm:mt-10">
              <a
                href="#features"
                className="inline-flex min-h-12 items-center justify-center border border-white/20 px-6 py-3.5 font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-white transition hover:border-white/50 sm:px-7 sm:py-4 sm:text-xs"
              >
                Explore features
              </a>
            </div>
          </div>
        </div>

        {/* =====================================================
            ONE SYSTEM — FLOATING OVERLAP CARD
        ====================================================== */}
        <div className="relative z-30 mx-auto -mb-20 w-full max-w-[1240px] px-4 sm:-mb-28 sm:px-6 md:-mb-32 md:px-8">
          <div className="relative overflow-hidden rounded-[28px] border border-[#3A1A16]/10 bg-[#FFFCF9] px-6 py-10 text-[#2B211F] shadow-[0_35px_90px_rgba(43,33,31,0.18),0_8px_25px_rgba(43,33,31,0.08)] sm:rounded-[34px] sm:px-10 sm:py-14 lg:rounded-[40px] lg:px-16 lg:py-20">
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#C93E2B]/[0.06] blur-3xl" />

            <div className="relative grid gap-10 sm:gap-12 lg:grid-cols-[0.62fr_1.38fr] lg:gap-20">
              {/* Left */}
              <div className="lg:pt-2">
                <div className="flex items-center gap-3">
                  <span className="h-px w-7 shrink-0 bg-[#C93E2B] sm:w-10" />

                  <p className="font-sans text-[8px] font-semibold uppercase tracking-[0.24em] text-[#C93E2B] sm:text-[10px] sm:tracking-[0.3em]">
                    One system
                  </p>
                </div>

                <p className="mt-6 max-w-sm font-display text-[2rem] leading-[0.95] tracking-[-0.02em] text-[#3A1A16] sm:mt-7 sm:text-4xl lg:text-[2.8rem]">
                  Engineered specifically for high-tempo dining rooms.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-10">
                  <span className="h-px w-10 bg-[#3A1A16]/20 sm:w-14" />

                  <span className="font-sans text-[8px] uppercase tracking-[0.18em] text-[#786A64] sm:text-[9px] sm:tracking-[0.22em]">
                    Built around your service
                  </span>
                </div>
              </div>

              {/* Right */}
              <div>
                <h2 className="max-w-5xl font-display text-[2.9rem] font-medium leading-[0.88] tracking-[-0.045em] text-[#2B211F] sm:text-5xl md:text-6xl lg:text-[5.4rem]">
                  Less time managing.
                  <br />
                  <span className="text-[#7A3026]">More time serving.</span>
                </h2>

                <div className="mt-8 border-t border-[#3A1A16]/12 pt-6 sm:mt-10 sm:pt-8">
                  <p className="max-w-2xl font-sans text-xs leading-6 text-[#5E514C] sm:text-sm sm:leading-7 md:text-base">
                    Every tool is calibrated to eliminate communication
                    bottlenecks between the kitchen brigade and dining room
                    floor — no scattered tools, no unnecessary complexity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          02 — PLATFORM FEATURES / CREAM
      ====================================================== */}
      <section
        id="features"
        className="relative bg-[#F3E9DC] pt-36 text-[#2B211F] sm:pt-44 md:pt-52 lg:pt-56"
      >
        <div className="mx-auto max-w-[1440px] px-5 pb-20 sm:px-8 sm:pb-24 lg:px-12 lg:pb-32 2xl:px-16">
          {/* Section heading */}
          <div className="mb-14 grid gap-10 sm:mb-16 md:mb-20 lg:grid-cols-[1fr_0.42fr] lg:items-end">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-7 shrink-0 bg-[#C93E2B] sm:w-8" />

                <p className="font-sans text-[8px] font-semibold uppercase tracking-[0.22em] text-[#3A1A16] sm:text-[10px] sm:tracking-[0.28em]">
                  Platform capabilities
                </p>
              </div>

              <h2 className="mt-6 max-w-4xl font-display text-[3.25rem] font-medium leading-[0.84] tracking-[-0.045em] text-[#3A1A16] sm:mt-7 sm:text-6xl lg:text-[6rem]">
                Every moving part,
                <br />
                <span className="text-[#6F3028]">beautifully connected.</span>
              </h2>
            </div>

            <div className="lg:pb-2">
              <p className="max-w-sm font-sans text-sm leading-6 text-[#5E514C] sm:leading-7">
                Native two-way sync with Toast, Micros Symphony, Clover, and
                Square — built for modern restaurant operations.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-7">
                <span className="h-px w-8 bg-[#3A1A16]/20 sm:w-10" />

                <span className="font-sans text-[8px] uppercase tracking-[0.18em] text-[#786A64] sm:text-[9px] sm:tracking-[0.2em]">
                  One connected platform
                </span>
              </div>
            </div>
          </div>

          {/* =====================================================
              FEATURE LIST
          ====================================================== */}
          <div className="border-t border-[#3A1A16]/20">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.number}
                  style={{ pointerEvents: "none" }}
                  className="relative grid gap-5 border-b border-[#3A1A16]/20 py-7 sm:grid-cols-[50px_52px_1fr] sm:gap-6 sm:py-8 md:grid-cols-[60px_58px_0.9fr_1fr] md:items-center md:gap-7 lg:grid-cols-[70px_64px_0.9fr_1fr] lg:gap-8 lg:py-10"
                >
                  {/* Number */}
                  <span className="font-sans text-[9px] font-medium tracking-[0.18em] text-[#C93E2B] sm:text-[10px] sm:tracking-[0.2em]">
                    {feature.number}
                  </span>

                  {/* Icon */}
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#3A1A16]/15">
                    <Icon
                      size={19}
                      strokeWidth={1.3}
                      className="text-[#3A1A16]"
                    />
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-[2rem] leading-none tracking-[-0.02em] text-[#3A1A16] sm:text-4xl lg:text-[2.6rem]">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="max-w-md font-sans text-xs leading-6 text-[#5E514C] sm:text-sm">
                    {feature.text}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Bottom label */}
          <div className="mt-8 flex items-center justify-between gap-4 sm:mt-10">
            <span className="font-sans text-[8px] uppercase tracking-[0.18em] text-[#786A64] sm:text-[9px] sm:tracking-[0.22em]">
              Designed for service
            </span>

            <span className="h-px w-12 shrink-0 bg-[#3A1A16]/15 sm:w-20 md:w-32" />
          </div>
        </div>
      </section>
    </div>
  );
}
