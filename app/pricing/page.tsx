"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";

const plans = [
  {
    name: "Basic",
    price: "$149",
    period: "/ month",
    description: "Perfect for single-location restaurants getting started.",
    features: [
      "Up to 25 tables",
      "Web reservation widget",
      "Basic billing & POS",
      "SMS guest confirmations",
      "Email support",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$299",
    period: "/ month",
    description:
      "Full-featured plan for growing restaurants and multi-shift operations.",
    features: [
      "Unlimited tables",
      "Advanced table management",
      "Kitchen Display System (KDS)",
      "Inventory management",
      "Guest CRM & loyalty",
      "24/7 priority support",
    ],
    cta: "Start 14-Day Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Contact Us",
    period: "",
    description: "Custom solutions for multi-location restaurant groups.",
    features: [
      "Everything in Pro",
      "Multi-venue management",
      "Custom reporting & analytics",
      "Dedicated account manager",
      "Custom API & webhook access",
      "SLA-backed uptime guarantee",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const faqs = [
  {
    question: "Is there a free trial available?",
    answer:
      "Yes, the Pro plan comes with a 14-day free trial with full access to all features. No credit card required to start.",
  },
  {
    question: "Can I switch plans later?",
    answer:
      "Absolutely. You can upgrade or downgrade your plan at any time from your account settings. Changes take effect on your next billing cycle.",
  },
  {
    question: "Do you offer discounts for annual billing?",
    answer:
      "Yes, we offer a 15% discount when you choose annual billing on the Basic and Pro plans. Contact sales for Enterprise annual pricing.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards, debit cards, UPI, and net banking for domestic customers, and international cards for global clients.",
  },
  {
    question: "Is there a setup fee?",
    answer:
      "No, there are no hidden setup fees for Basic and Pro plans. Enterprise plans may include a one-time onboarding fee depending on the scope of customization required.",
  },
  {
    question: "What kind of support is included?",
    answer:
      "All plans include email support. Pro and Enterprise plans include 24/7 priority support with dedicated response-time guarantees.",
  },
];

function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="border-t border-[#3A1A16]/15">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;

          return (
            <div
              key={faq.question}
              onMouseEnter={() => setOpenIndex(index)}
              onMouseLeave={() => setOpenIndex(null)}
              className={`group border-b border-[#3A1A16]/15 transition-all duration-500 ${
                isOpen ? "bg-[#F8F0E7]" : "bg-transparent"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center gap-5 px-5 py-6 text-left sm:px-7 sm:py-7 lg:px-8"
                aria-expanded={isOpen}
              >
                {/* Number */}
                <span
                  className={`hidden w-10 shrink-0 font-serif text-sm transition-colors duration-300 sm:block ${
                    isOpen ? "text-[#C93E2B]" : "text-[#8D756C]"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                {/* Question */}
                <span
                  className={`flex-1 font-serif text-[19px] font-medium leading-snug transition-colors duration-300 sm:text-[21px] lg:text-[23px] ${
                    isOpen
                      ? "text-[#C93E2B]"
                      : "text-[#3A1A16] group-hover:text-[#C93E2B]"
                  }`}
                >
                  {faq.question}
                </span>

                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center transition-all duration-500 ${
                    isOpen
                      ? "text-[#C93E2B]"
                      : "text-[#6E5E58] group-hover:translate-x-1 group-hover:text-[#C93E2B]"
                  }`}
                >
                  <ArrowRight
                    size={21}
                    strokeWidth={1.4}
                    className={`transition-transform duration-500 ${
                      isOpen ? "rotate-90" : ""
                    }`}
                  />
                </span>
              </button>

              {/* Answer */}
              <div
                className={`grid transition-all duration-500 ease-out ${
                  isOpen
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="pb-7 pl-5 pr-16 sm:pl-[76px] sm:pr-20 lg:pb-8">
                    <p className="max-w-3xl font-sans text-[14px] leading-7 text-[#665650] sm:text-[15px]">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <main className="bg-[#F3E9DC] text-[#2B211F]">
      {/* TRANSPARENT INVESTMENT */}
      <section className="relative overflow-hidden bg-[#3A1A16] text-[#F3E9DC]">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[#C93E2B]/[0.07] blur-3xl" />

        <div className="pointer-events-none absolute bottom-0 left-[-120px] h-[400px] w-[400px] rounded-full bg-white/[0.025] blur-3xl" />

        <div className="relative mx-auto max-w-[1440px] px-6 pb-32 pt-24 sm:px-8 lg:px-12 lg:pb-40 lg:pt-30 2xl:px-16">
          <div className="mx-auto max-w-5xl text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-[#C93E2B]" />

              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-[#F98D7C]">
                Transparent investment
              </p>

              <span className="h-px w-8 bg-[#C93E2B]" />
            </div>

            <h1 className="mt-7 font-display text-[4rem] leading-[0.86] tracking-[-0.045em] sm:text-6xl lg:text-[6.4rem]">
              Simple pricing,
              <br />
              <span className="whitespace-nowrap text-[#C9B7A8]">
                tailored to your operation.
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl font-sans text-sm leading-7 text-[#F3E9DC]/60 sm:text-base">
              Every plan includes real-time sync and the tools your hospitality
              team needs to run a better service.
            </p>

            <div className="mt-7 flex items-center justify-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C93E2B]" />

              <span className="font-sans text-[9px] font-medium uppercase tracking-[0.2em] text-[#C9B7A8]/65">
                Choose a plan that grows with you
              </span>
            </div>
          </div>

          {/* PRICING CARDS */}
          <div className="mt-36 grid grid-cols-1 gap-7 lg:grid-cols-3 lg:items-stretch lg:gap-8">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`group relative flex h-full flex-col overflow-hidden rounded-[34px] p-7 transition-all duration-500 sm:p-9 ${
                  plan.highlighted
                    ? "bg-[#F8EFE5] text-[#3A1A16] shadow-[0_35px_90px_rgba(20,8,5,0.32),0_12px_30px_rgba(20,8,5,0.16)] lg:-translate-y-5 hover:-translate-y-6"
                    : "border border-white/[0.14] bg-[#F3E9DC]/[0.10] text-[#F3E9DC] shadow-[0_30px_70px_rgba(15,5,3,0.22),0_8px_25px_rgba(15,5,3,0.12)] backdrop-blur-sm hover:-translate-y-3 hover:border-white/[0.22] hover:bg-[#F3E9DC]/[0.14] hover:shadow-[0_40px_90px_rgba(15,5,3,0.30)]"
                }`}
              >
                <div
                  className={`pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full blur-3xl transition-opacity duration-500 ${
                    plan.highlighted
                      ? "bg-[#C93E2B]/[0.08] opacity-100"
                      : "bg-[#F3E9DC]/[0.04] opacity-0 group-hover:opacity-100"
                  }`}
                />

                <div
                  className={`absolute left-8 right-8 top-0 h-px ${
                    plan.highlighted ? "bg-[#C93E2B]" : "bg-[#F3E9DC]/20"
                  }`}
                />

                {plan.highlighted && (
                  <div className="absolute right-7 top-7">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#C93E2B] px-4 py-2 font-sans text-[9px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_8px_22px_rgba(201,62,43,0.22)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="relative flex flex-1 flex-col">
                  {/* Plan information */}
                  <div>
                    <p
                      className={`font-sans text-[10px] font-semibold uppercase tracking-[0.25em] ${
                        plan.highlighted ? "text-[#C93E2B]" : "text-[#F98D7C]"
                      }`}
                    >
                      {plan.name}
                    </p>

                    {/* Price */}
                    <div className="mt-6 flex items-end gap-2">
                      <h2
                        className={`font-display font-semibold leading-[0.9] tracking-[-0.045em] ${
                          plan.name === "Enterprise"
                            ? "text-4xl sm:text-5xl"
                            : "text-6xl sm:text-[4.5rem]"
                        }`}
                      >
                        {plan.price}
                      </h2>

                      {plan.period && (
                        <span
                          className={`mb-1.5 font-sans text-xs ${
                            plan.highlighted
                              ? "text-[#786A64]"
                              : "text-[#C9B7A8]/70"
                          }`}
                        >
                          {plan.period}
                        </span>
                      )}
                    </div>

                    <p
                      className={`mt-6 max-w-sm font-sans text-sm leading-6 ${
                        plan.highlighted
                          ? "text-[#5E514C]"
                          : "text-[#F3E9DC]/60"
                      }`}
                    >
                      {plan.description}
                    </p>
                  </div>

                  {/* Features */}
                  <div
                    className={`mt-9 flex-1 border-t pt-7 ${
                      plan.highlighted
                        ? "border-[#3A1A16]/10"
                        : "border-white/[0.12]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p
                        className={`font-sans text-[9px] font-semibold uppercase tracking-[0.22em] ${
                          plan.highlighted
                            ? "text-[#786A64]"
                            : "text-[#C9B7A8]/55"
                        }`}
                      >
                        Included
                      </p>

                      <span
                        className={`font-display text-2xl leading-none ${
                          plan.highlighted
                            ? "text-[#3A1A16]/10"
                            : "text-white/[0.08]"
                        }`}
                      >
                        0{index + 1}
                      </span>
                    </div>

                    <ul className="mt-6 space-y-4">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                              plan.highlighted
                                ? "bg-[#C93E2B]/10"
                                : "bg-white/[0.08]"
                            }`}
                          >
                            <CheckCircle2
                              size={13}
                              className={
                                plan.highlighted
                                  ? "text-[#C93E2B]"
                                  : "text-[#F98D7C]"
                              }
                            />
                          </span>

                          <span
                            className={`font-sans text-xs leading-5 ${
                              plan.highlighted
                                ? "text-[#5E514C]"
                                : "text-[#F3E9DC]/65"
                            }`}
                          >
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <div className="mt-auto pt-10">
                    <Button
                      variant="outline"
                      size="md"
                      className={`group/button h-12 w-full justify-center rounded-full border font-sans text-[10px] font-semibold uppercase tracking-[0.12em] transition-all duration-300 ${
                        plan.highlighted
                          ? "!border-[#C93E2B] !bg-[#C93E2B] !text-white shadow-[0_10px_25px_rgba(201,62,43,0.16)] hover:!border-[#AF3021] hover:!bg-[#AF3021] hover:!text-white"
                          : "!border-white/[0.18] !bg-white/[0.03] !text-[#F3E9DC] hover:!border-white/[0.32] hover:!bg-white/[0.10] hover:!text-white"
                      }`}
                    >
                      {plan.cta}
                      <span
                        className={`ml-2 flex h-7 w-7 items-center justify-center rounded-full ${
                          plan.highlighted ? "bg-white/10" : "bg-white/[0.06]"
                        }`}
                      >
                        <ArrowRight
                          size={14}
                          className="transition-transform duration-300 group-hover/button:translate-x-1"
                        />
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUESTIONS & ANSWERS */}

      <section className="relative bg-[#F3E9DC] px-6 pb-48 pt-28 sm:px-8 lg:px-12 lg:pb-56 lg:pt-36 2xl:px-16">
        <div className="relative mx-auto max-w-[1440px]">
          {/* FAQ Header */}
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-[#C93E2B]" />

              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C93E2B]">
                Questions & Answers
              </p>

              <span className="h-px w-8 bg-[#C93E2B]" />
            </div>

            <h2 className="mt-6 font-display text-5xl leading-[0.88] tracking-[-0.04em] text-[#3A1A16] sm:text-6xl lg:text-[5.5rem]">
              Everything you need
              <br />
              <span className="text-[#7A3026]">to know.</span>
            </h2>

            <p className="mx-auto mt-6 max-w-xl font-sans text-sm leading-7 text-[#5E514C]">
              Everything you need to know about pricing, billing, and choosing
              the right plan for your restaurant.
            </p>
          </div>

          {/* FAQ */}
          <div className="mt-14">
            <FAQAccordion />
          </div>

          {/* FLOATING CTA CARD */}
          <div className="relative z-20 mx-auto -mb-80 mt-24 max-w-[1180px] px-1 sm:px-4">
            <div className="pointer-events-none absolute -inset-5 rounded-[44px] bg-[#C93E2B]/[0.055] blur-2xl" />

            <div className="relative overflow-hidden rounded-[38px] border border-[#3A1A16]/10 bg-[#FFFCF9] px-7 py-14 text-center text-[#2B211F] shadow-[0_35px_90px_rgba(43,33,31,0.18),0_8px_25px_rgba(43,33,31,0.08)] sm:px-12 sm:py-16 lg:px-20 lg:py-20">
              <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#3A1A16]/[0.045] blur-3xl" />

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
                  Need something
                  <br />
                  <span className="text-[#7A3026]">more tailored?</span>
                </h2>

                <p className="mx-auto mt-6 max-w-xl font-sans text-sm leading-7 text-[#5E514C]">
                  Every hospitality operation is different. Talk to our team
                  about your concept, workflow, and specific requirements.
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
