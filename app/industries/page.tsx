import {
  UtensilsCrossed,
  Truck,
  Wine,
  Coffee,
  Building2,
  IceCream,
  Cookie,
  Beer,
  Pizza,
  Store,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui";

const industries = [
  {
    icon: Wine,
    name: "Fine Dine",
    description:
      "Elevate the guest experience with precision service pacing and thoughtful operations.",
    points: [
      "Course-by-course kitchen sequencing",
      "VIP guest CRM & dietary logs",
    ],
  },
  {
    icon: UtensilsCrossed,
    name: "QSR",
    description:
      "Built for speed, consistency, and high order volume during the busiest hours.",
    points: [
      "Lightning-fast billing",
      "Kitchen Display System for rapid fire times",
    ],
  },
  {
    icon: Coffee,
    name: "Café",
    description:
      "Keep the counter moving while creating memorable experiences for regular guests.",
    points: ["Quick-order templates", "Loyalty punch-card rewards"],
  },
  {
    icon: Store,
    name: "Food Court",
    description:
      "Manage multiple counters through one streamlined operational system.",
    points: [
      "Multi-counter order routing",
      "Shared table & token number system",
    ],
  },
  {
    icon: Truck,
    name: "Cloud Kitchen",
    description:
      "Manage multiple delivery brands from one centralized dashboard.",
    points: ["Aggregator sync across platforms", "Multi-brand menu management"],
  },
  {
    icon: IceCream,
    name: "Ice Cream & Desserts",
    description:
      "Fast billing and simple operations for high-turnover, small-ticket orders.",
    points: ["Quick-scan menu shortcuts", "Seasonal flavor inventory tracking"],
  },
  {
    icon: Cookie,
    name: "Bakery",
    description:
      "Track perishables and manage pre-orders without slowing down your team.",
    points: [
      "Expiry-based inventory alerts",
      "Pre-order & advance booking support",
    ],
  },
  {
    icon: Beer,
    name: "Bar & Brewery",
    description:
      "Handle high-volume beverage service with flexible tabs and billing.",
    points: [
      "Running tab & split-bill support",
      "Age verification & compliance logs",
    ],
  },
  {
    icon: Pizza,
    name: "Pizzeria",
    description:
      "Simplify custom orders and delivery coordination during every rush.",
    points: ["Custom topping & size builder", "Delivery time-slot management"],
  },
  {
    icon: Building2,
    name: "Large Chain",
    description:
      "Standardize operations and gain visibility across every location you operate.",
    points: [
      "Centralized multi-location reporting",
      "Franchise-level performance benchmarking",
    ],
  },
];

export default function IndustriesPage() {
  return (
    <main className="bg-[#F3E9DC] text-[#2B211F]">
      {/*  TAILORED HOSPITALITY  */}
      <section className="relative overflow-hidden bg-[#3A1A16] text-[#F3E9DC]">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[#C93E2B]/[0.07] blur-3xl" />

        <div className="pointer-events-none absolute bottom-0 left-[-140px] h-[420px] w-[420px] rounded-full bg-white/[0.025] blur-3xl" />

        <div className="relative mx-auto max-w-[1440px] px-6 pb-32 pt-24 sm:px-8 lg:px-12 lg:pb-40 lg:pt-30 2xl:px-16">
          <div className="mx-auto max-w-5xl text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-[#C93E2B]" />

              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-[#F98D7C]">
                Tailored Hospitality
              </p>

              <span className="h-px w-8 bg-[#C93E2B]" />
            </div>

            {/* Heading */}
            <h1 className="mt-7 font-display text-[4rem] leading-[0.86] tracking-[-0.045em] sm:text-6xl lg:text-[6.4rem]">
              Built for every
              <br />
              <span className="whitespace-nowrap text-[#C9B7A8]">
                kind of hospitality.
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl font-sans text-sm leading-7 text-[#F3E9DC]/60 sm:text-base">
              From intimate tasting counters to fast-moving QSRs and
              multi-location restaurant groups, the platform adapts to the way
              your operation actually works.
            </p>

            <div className="mt-7 flex items-center justify-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C93E2B]" />

              <span className="font-sans text-[9px] font-medium uppercase tracking-[0.2em] text-[#C9B7A8]/65">
                One system · different concepts
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* INDUSTRIES INTRO  */}
      <section className="relative bg-[#F3E9DC] px-6 py-28 sm:px-8 pb-36 lg:px-12 lg:py-36 2xl:px-16">
        <div className="relative mx-auto max-w-[1440px]">
          <div className="mx-auto max-w-4xl text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-[#C93E2B]" />

              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C93E2B]">
                Designed around your concept
              </p>

              <span className="h-px w-8 bg-[#C93E2B]" />
            </div>

            <h2 className="mt-6 font-display text-5xl leading-[0.88] tracking-[-0.04em] text-[#3A1A16] sm:text-6xl lg:text-[5.5rem]">
              Your concept is
              <br />
              <span className="text-[#7A3026]">the starting point.</span>
            </h2>

            <p className="mx-auto mt-7 max-w-2xl font-sans text-sm leading-7 text-[#5E514C] sm:text-base">
              Every hospitality business has a different pace, team structure,
              and guest experience. Choose the setup that feels closest to yours
              — then make it your own.
            </p>
          </div>
        </div>
      </section>

      {/*  INDUSTRY CARDS */}

      <section className="bg-[#F3E9DC] px-6 pb-56 sm:px-8 lg:px-12 lg:pb-84 2xl:px-16">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {industries.map((industry, index) => {
            const Icon = industry.icon;

            return (
              <div
                key={industry.name}
                className={`group relative flex min-h-[370px] flex-col overflow-hidden rounded-[30px] border border-[#3A1A16]/[0.09] bg-[#FFFCF9] px-7 py-8 shadow-[0_16px_45px_rgba(58,26,22,0.045)] transition-all duration-500 hover:-translate-y-2 hover:border-[#C93E2B]/20 hover:bg-[#FFFDFB] hover:shadow-[0_28px_65px_rgba(58,26,22,0.11)] sm:px-8 sm:py-9 ${
                  index === 0 ? "lg:col-span-2" : ""
                }`}
              >
                <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[#C93E2B]/[0.035] opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

                <div className="pointer-events-none absolute right-7 top-3 select-none font-display text-[105px] leading-none tracking-[-0.06em] text-[#3A1A16]/[0.035] transition-all duration-500 group-hover:text-[#C93E2B]/[0.06]">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="relative flex items-start justify-between">
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-[18px] border border-[#3A1A16]/10 bg-[#F3E9DC] text-[#8D5B3F] shadow-[0_8px_20px_rgba(58,26,22,0.04)] transition-all duration-500 group-hover:border-[#C93E2B]/20 group-hover:bg-[#C93E2B] group-hover:text-white group-hover:shadow-[0_10px_25px_rgba(201,62,43,0.18)]">
                    <Icon size={21} strokeWidth={1.5} />
                  </div>

                  <span className="pt-2 font-sans text-[8px] font-semibold uppercase tracking-[0.22em] text-[#8D756C]/70">
                    Concept {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="relative mt-8">
                  <h3 className="font-display text-[2.1rem] leading-[0.92] tracking-[-0.025em] text-[#3A1A16] transition-colors duration-300 group-hover:text-[#7A3026]">
                    {industry.name}
                  </h3>

                  <p className="mt-4 max-w-xl font-sans text-[13px] leading-6 text-[#665650]">
                    {industry.description}
                  </p>
                </div>

                {/* Capabilities */}
                <div className="relative mt-auto pt-7">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="h-px w-7 bg-[#C93E2B]/70" />

                    <p className="font-sans text-[8px] font-semibold uppercase tracking-[0.24em] text-[#8D756C]">
                      Key capabilities
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {industry.points.map((point) => (
                      <div
                        key={point}
                        className="flex items-center gap-3 rounded-xl border border-[#3A1A16]/[0.055] bg-[#F8F1EA]/55 px-3.5 py-3 transition-all duration-300 group-hover:border-[#C93E2B]/10 group-hover:bg-[#F8F1EA]"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#C93E2B]/[0.08]">
                          <CheckCircle2
                            size={12}
                            strokeWidth={1.8}
                            className="text-[#C93E2B]"
                          />
                        </span>

                        <span className="font-sans text-[11px] leading-4 text-[#5E514C]">
                          {point}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom accent */}
                <div className="absolute bottom-0 left-8 right-8 h-[2px] origin-left scale-x-0 bg-[#C93E2B] transition-transform duration-500 group-hover:scale-x-100" />
              </div>
            );
          })}
        </div>
      </section>

      {/*  CTA */}

      <section className="relative bg-[#F3E9DC] px-6 pb-24 pt-56 sm:px-8 lg:px-12 lg:pb-32 lg:pt-64 2xl:px-16">
        <div className="absolute inset-x-0 bottom-0 z-20 translate-y-10 sm:translate-y-12 lg:translate-y-16 px-6 sm:px-8 lg:px-12 2xl:px-16">
          <div className="relative mx-auto max-w-[1180px]">
            <div className="pointer-events-none absolute -inset-5 rounded-[44px] bg-[#C93E2B]/[0.05] blur-2xl" />

            <div className="relative overflow-hidden rounded-[38px] border border-[#3A1A16]/10 bg-[#FFFCF9] px-7 py-14 text-center shadow-[0_35px_90px_rgba(43,33,31,0.14)] sm:px-12 sm:py-16 lg:px-20 lg:py-20">
              <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#3A1A16]/[0.04] blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#C93E2B]/[0.035] blur-3xl" />

              <div className="relative mx-auto max-w-3xl">
                <div className="flex items-center justify-center gap-3">
                  <span className="h-px w-7 bg-[#C93E2B]" />
                  <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.24em] text-[#C93E2B]">
                    Private hospitality consultation
                  </p>
                  <span className="h-px w-7 bg-[#C93E2B]" />
                </div>

                <h2 className="mt-6 font-display text-5xl leading-[0.88] tracking-[-0.04em] text-[#3A1A16] sm:text-6xl lg:text-[5.8rem]">
                  Your concept.
                  <br />
                  <span className="text-[#7A3026]">Your way.</span>
                </h2>

                <p className="mx-auto mt-6 max-w-xl font-sans text-sm leading-7 text-[#5E514C]">
                  Not sure which setup is right for your operation? Talk to our
                  team and we&apos;ll help you shape the right workflow.
                </p>

                <button className="group mt-9 inline-flex min-w-[280px] items-center justify-center gap-4 rounded-full bg-[#C93E2B] px-10 py-4 font-sans text-xs font-semibold uppercase tracking-[0.1em] text-white shadow-[0_14px_35px_rgba(201,62,43,0.18)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#AF3021] hover:shadow-[0_18px_40px_rgba(201,62,43,0.28)]">
                  <span>Contact Sales</span>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <ArrowRight
                      size={15}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </span>
                </button>

                <div className="mt-8 flex items-center justify-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C93E2B]" />
                  <span className="font-sans text-[9px] font-medium uppercase tracking-[0.18em] text-[#786A64]">
                    Built around your operation
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
