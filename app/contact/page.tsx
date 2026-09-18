"use client";

import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Sparkles,
} from "lucide-react";

interface FormData {
  name: string;
  phone: string;
  restaurant: string;
  city: string;
  outlets: string;
  message: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  restaurant?: string;
  city?: string;
  outlets?: string;
}

const initialFormData: FormData = {
  name: "",
  phone: "",
  restaurant: "",
  city: "",
  outlets: "",
  message: "",
};

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const phoneRegex =
    /^[6-9]\d{9}$|^\+?\d{1,3}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}$/;

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(formData.phone.trim())) {
      newErrors.phone = "Enter a valid phone number";
    }

    if (!formData.restaurant.trim()) {
      newErrors.restaurant = "Restaurant name is required";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.outlets.trim()) {
      newErrors.outlets = "Number of outlets is required";
    } else if (!/^\d+$/.test(formData.outlets.trim())) {
      newErrors.outlets = "Enter a valid number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    // Simulate network request — no real backend yet
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1500);
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setErrors({});
    setIsSubmitted(false);
  };

  const inputClass = (error?: string) =>
    `h-12 w-full rounded-xl border bg-[#FFFCF9] px-4 font-sans text-sm text-[#3A1A16] outline-none transition-all placeholder:text-[#9A8B84] ${
      error
        ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
        : "border-[#3A1A16]/10 focus:border-[#C93E2B]/50 focus:ring-4 focus:ring-[#C93E2B]/[0.08]"
    }`;

  return (
    <main className="bg-[#F3E9DC] text-[#2B211F]">
      {/*  HERO  */}
      <section className="relative overflow-hidden bg-[#3A1A16] text-[#F3E9DC]">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[#C93E2B]/[0.07] blur-3xl" />

        <div className="pointer-events-none absolute -bottom-40 -left-40 h-[450px] w-[450px] rounded-full bg-white/[0.025] blur-3xl" />

        <div className="relative mx-auto max-w-[1440px] px-6 pb-28 pt-24 sm:px-8 lg:px-12 lg:pb-36 lg:pt-32 2xl:px-16">
          <div className="mx-auto max-w-5xl text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-[#C93E2B]" />

              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-[#F98D7C]">
                Private Hospitality Consultation
              </p>

              <span className="h-px w-8 bg-[#C93E2B]" />
            </div>

            <h1 className="mt-7 font-display text-[4rem] leading-[0.86] tracking-[-0.045em] sm:text-6xl lg:text-[6.4rem]">
              Let&apos;s talk about
              <br />
              <span className="text-[#C9B7A8]">your operation.</span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl font-sans text-sm leading-7 text-[#F3E9DC]/60 sm:text-base">
              Tell us a little about your restaurant and we&apos;ll show you how
              the platform can fit the way you already work.
            </p>

            <div className="mt-8 flex items-center justify-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C93E2B]" />

              <span className="font-sans text-[9px] font-medium uppercase tracking-[0.2em] text-[#C9B7A8]/65">
                No pressure · Just a conversation
              </span>
            </div>
          </div>
        </div>
      </section>

      {/*  CONTACT AREA */}
      <section className="relative bg-[#F3E9DC] px-6 py-24 sm:px-8 lg:px-12 lg:py-32 2xl:px-16">
        <div className="relative mx-auto grid max-w-[1200px] gap-7 lg:grid-cols-[1.45fr_0.75fr]">
          {/* FORM CARD */}
          <div className="overflow-hidden rounded-[32px] border border-[#3A1A16]/10 bg-[#FFFCF9] shadow-[0_24px_70px_rgba(58,26,22,0.07)]">
            {isSubmitted ? (
              <div className="flex min-h-[650px] flex-col items-center justify-center px-7 py-16 text-center sm:px-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-[20px] border border-[#C93E2B]/20 bg-[#C93E2B]/[0.07] text-[#C93E2B]">
                  <CheckCircle2 size={30} strokeWidth={1.5} />
                </div>

                <p className="mt-7 font-sans text-[9px] font-semibold uppercase tracking-[0.25em] text-[#C93E2B]">
                  Request received
                </p>

                <h2 className="mt-4 max-w-xl font-display text-4xl leading-[0.92] tracking-[-0.03em] text-[#3A1A16] sm:text-5xl">
                  We&apos;ll be in touch
                  <br />
                  <span className="text-[#7A3026]">shortly.</span>
                </h2>

                <p className="mt-6 max-w-md font-sans text-sm leading-7 text-[#665650]">
                  Thanks, {formData.name || "there"}. Our team will reach out at{" "}
                  {formData.phone} to schedule your personalized walkthrough.
                </p>

                <button
                  onClick={handleReset}
                  className="mt-9 inline-flex items-center justify-center rounded-full border border-[#3A1A16]/15 px-7 py-3.5 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3A1A16] transition-all duration-300 hover:border-[#C93E2B]/30 hover:text-[#C93E2B]"
                >
                  Submit Another Request
                </button>
              </div>
            ) : (
              <div className="p-7 sm:p-10 lg:p-12">
                {/* Form heading */}
                <div className="mb-9">
                  <div className="flex items-center gap-3">
                    <span className="h-px w-7 bg-[#C93E2B]" />

                    <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.24em] text-[#C93E2B]">
                      Book a Free Demo
                    </p>
                  </div>

                  <h2 className="mt-5 font-display text-4xl leading-[0.92] tracking-[-0.03em] text-[#3A1A16] sm:text-5xl">
                    Tell us about
                    <br />
                    <span className="text-[#7A3026]">your restaurant.</span>
                  </h2>

                  <p className="mt-5 max-w-lg font-sans text-sm leading-6 text-[#665650]">
                    A few details will help us prepare a more relevant
                    walkthrough for your operation.
                  </p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  {/* Name + Phone */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-[#786A64]">
                        Name <span className="text-[#C93E2B]">*</span>
                      </label>

                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder="Your full name"
                        className={inputClass(errors.name)}
                      />

                      {errors.name && (
                        <p className="mt-1.5 font-sans text-[10px] text-red-600">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-[#786A64]">
                        Phone Number <span className="text-[#C93E2B]">*</span>
                      </label>

                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        placeholder="9876543210"
                        className={inputClass(errors.phone)}
                      />

                      {errors.phone && (
                        <p className="mt-1.5 font-sans text-[10px] text-red-600">
                          {errors.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Restaurant + City */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-[#786A64]">
                        Restaurant Name{" "}
                        <span className="text-[#C93E2B]">*</span>
                      </label>

                      <input
                        type="text"
                        value={formData.restaurant}
                        onChange={(e) =>
                          handleChange("restaurant", e.target.value)
                        }
                        placeholder="Your restaurant's name"
                        className={inputClass(errors.restaurant)}
                      />

                      {errors.restaurant && (
                        <p className="mt-1.5 font-sans text-[10px] text-red-600">
                          {errors.restaurant}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-[#786A64]">
                        City <span className="text-[#C93E2B]">*</span>
                      </label>

                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleChange("city", e.target.value)}
                        placeholder="e.g. Delhi"
                        className={inputClass(errors.city)}
                      />

                      {errors.city && (
                        <p className="mt-1.5 font-sans text-[10px] text-red-600">
                          {errors.city}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Outlets */}
                  <div>
                    <label className="mb-2 block font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-[#786A64]">
                      Number of Outlets{" "}
                      <span className="text-[#C93E2B]">*</span>
                    </label>

                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.outlets}
                      onChange={(e) => handleChange("outlets", e.target.value)}
                      placeholder="e.g. 1"
                      className={inputClass(errors.outlets)}
                    />

                    {errors.outlets && (
                      <p className="mt-1.5 font-sans text-[10px] text-red-600">
                        {errors.outlets}
                      </p>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <label className="mb-2 block font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-[#786A64]">
                      Message{" "}
                      <span className="font-normal tracking-normal text-[#A2948D]">
                        (optional)
                      </span>
                    </label>

                    <textarea
                      value={formData.message}
                      onChange={(e) => handleChange("message", e.target.value)}
                      placeholder="Tell us anything else about your restaurant..."
                      rows={4}
                      className="w-full resize-none rounded-xl border border-[#3A1A16]/10 bg-[#FFFCF9] px-4 py-3 font-sans text-sm text-[#3A1A16] outline-none transition-all placeholder:text-[#9A8B84] focus:border-[#C93E2B]/50 focus:ring-4 focus:ring-[#C93E2B]/[0.08]"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group mt-2 inline-flex h-14 w-full items-center justify-center gap-4 rounded-full bg-[#C93E2B] px-8 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_14px_35px_rgba(201,62,43,0.16)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#AF3021] hover:shadow-[0_18px_40px_rgba(201,62,43,0.25)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <span>Book a Free Demo</span>

                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                          <ArrowRight
                            size={15}
                            className="transition-transform duration-300 group-hover:translate-x-1"
                          />
                        </span>
                      </>
                    )}
                  </button>

                  <p className="text-center font-sans text-[9px] leading-5 text-[#8D7E77]">
                    By submitting this form, you&apos;re simply requesting a
                    conversation with our team.
                  </p>
                </form>
              </div>
            )}
          </div>

          {/* CONTACT INFORMATION */}
          <div className="flex flex-col gap-5">
            <div className="relative flex-1 overflow-hidden rounded-[32px] bg-[#3A1A16] p-7 text-[#F3E9DC] shadow-[0_24px_60px_rgba(58,26,22,0.12)] sm:p-8">
              <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#C93E2B]/[0.08] blur-3xl" />

              <div className="relative">
                <div className="flex items-center gap-3">
                  <span className="h-px w-7 bg-[#C93E2B]" />

                  <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.24em] text-[#F98D7C]">
                    Get In Touch
                  </p>
                </div>

                <h3 className="mt-6 font-display text-4xl leading-[0.92] tracking-[-0.03em]">
                  We&apos;re here
                  <br />
                  <span className="text-[#C9B7A8]">to help.</span>
                </h3>

                <p className="mt-5 font-sans text-xs leading-6 text-[#F3E9DC]/50">
                  Prefer to reach us directly? Our team is happy to answer
                  questions about the platform, pricing, or onboarding.
                </p>

                <div className="mt-10 space-y-7">
                  {/* Phone */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.04] text-[#F98D7C]">
                      <Phone size={18} strokeWidth={1.5} />
                    </div>

                    <div>
                      <p className="font-sans text-[8px] font-semibold uppercase tracking-[0.2em] text-[#C9B7A8]/55">
                        Phone
                      </p>

                      <p className="mt-1.5 font-sans text-sm text-[#F3E9DC]">
                        +1 (800) 468-7638
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.04] text-[#F98D7C]">
                      <Mail size={18} strokeWidth={1.5} />
                    </div>

                    <div>
                      <p className="font-sans text-[8px] font-semibold uppercase tracking-[0.2em] text-[#C9B7A8]/55">
                        Email
                      </p>

                      <p className="mt-1.5 break-all font-sans text-sm text-[#F3E9DC]">
                        hello@bhojanhub.com
                      </p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.04] text-[#F98D7C]">
                      <MapPin size={18} strokeWidth={1.5} />
                    </div>

                    <div>
                      <p className="font-sans text-[8px] font-semibold uppercase tracking-[0.2em] text-[#C9B7A8]/55">
                        Office
                      </p>

                      <p className="mt-1.5 font-sans text-sm leading-5 text-[#F3E9DC]">
                        4th Floor, Cyber Hub Tower,
                        <br />
                        Sector 24, Gurugram,
                        <br />
                        Haryana, India
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Support card */}
            <div className="rounded-[28px] border border-[#3A1A16]/10 bg-[#FFFCF9] p-7 shadow-[0_18px_45px_rgba(58,26,22,0.055)]">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#C93E2B]/[0.08] text-[#C93E2B]">
                  <Sparkles size={19} strokeWidth={1.5} />
                </div>

                <div>
                  <p className="font-sans text-[8px] font-semibold uppercase tracking-[0.2em] text-[#C93E2B]">
                    Online Support
                  </p>

                  <h4 className="mt-2 font-display text-2xl leading-none text-[#3A1A16]">
                    Here when you need us.
                  </h4>

                  <p className="mt-3 font-sans text-xs leading-5 text-[#665650]">
                    Our support team is available 24/7 for onboarding, billing,
                    and technical questions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/*  CTA */}

      <section className="relative z-20 -mb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl lg:-translate-x-24">
          <div className="group relative overflow-hidden rounded-[34px] border border-[#3A1A16]/10 bg-[#FFFCF9] shadow-[0_30px_90px_rgba(58,26,22,0.18)]">
            <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#C93E2B]/[0.07] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-[#7A3026]/[0.05] blur-3xl" />

            <div className="relative h-1 w-full bg-[#3A1A16]" />

            <div className="relative z-10 px-7 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
              {/* Header */}
              <div className="mb-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.3em] text-[#C93E2B]">
                    Next Step
                  </span>

                  <span className="h-px w-14 bg-[#3A1A16]/15" />
                </div>

                <span className="hidden font-sans text-[10px] uppercase tracking-[0.22em] text-[#8D7C74] sm:block">
                  Private Consultation
                </span>
              </div>

              {/* Main content */}
              <div className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
                <div className="relative">
                  <div className="absolute -left-5 top-1 hidden h-20 w-px bg-[#C93E2B]/40 lg:block" />

                  <h2 className="max-w-2xl font-display text-[3.2rem] font-medium leading-[0.9] tracking-[-0.035em] text-[#3A1A16] sm:text-6xl lg:text-[4.5rem]">
                    Ready to build a
                    <br />
                    <span className="text-[#7A3026]">better operation?</span>
                  </h2>

                  <p className="mt-7 max-w-lg font-sans text-sm leading-7 text-[#665650] sm:text-[15px]">
                    Let&apos;s have a conversation about your restaurant, your
                    challenges, and where the platform can make the biggest
                    difference.
                  </p>
                </div>

                {/* CTA area */}
                <div className="flex flex-col items-start gap-4 lg:items-end">
                  <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#8D7C74]">
                    No pressure · Just a conversation
                  </span>

                  <a
                    href="#"
                    className="group/btn inline-flex h-14 items-center justify-center gap-4 rounded-full bg-[#3A1A16] px-7 font-sans text-xs font-semibold uppercase tracking-[0.08em] text-[#F3E9DC] transition-all duration-300 hover:-translate-y-1 hover:bg-[#C93E2B] hover:shadow-[0_15px_35px_rgba(201,62,43,0.22)]"
                  >
                    Book a Consultation
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F3E9DC]/10 transition-colors duration-300 group-hover/btn:bg-white/15">
                      <ArrowRight
                        size={15}
                        className="transition-transform duration-300 group-hover/btn:translate-x-0.5"
                      />
                    </span>
                  </a>
                </div>
              </div>

              <div className="mt-10 flex items-center justify-between border-t border-[#3A1A16]/10 pt-5">
                <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#8D7C74]">
                  Hospitality · Operations · Growth
                </span>

                <span className="font-display text-sm italic text-[#7A3026]">
                  Let&apos;s talk.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
