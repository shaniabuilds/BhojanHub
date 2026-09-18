
"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  LockKeyhole,
  ShieldCheck,
  Utensils,
} from "lucide-react";

type Mode = "login" | "setup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextPath, setNextPath] = useState("/");

  useEffect(() => {
    const requestedPath = new URLSearchParams(
      window.location.search,
    ).get("next");

    if (
      requestedPath?.startsWith("/") &&
      !requestedPath.startsWith("//")
    ) {
      setNextPath(requestedPath);
    }

    void fetch("/api/auth/setup")
      .then(async (response) => {
        if (!response.ok) return;

        const data = (await response.json()) as {
          setupRequired?: boolean;
        };

        if (data.setupRequired) {
          setMode("setup");
        }
      })
      .catch(() =>
        setError(
          "Unable to check account setup. Please try again.",
        ),
      );
  }, []);

  const submit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(
        mode === "setup"
          ? "/api/auth/setup"
          : "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            mode === "setup"
              ? { name, email, password }
              : { email, password },
          ),
        },
      );

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setError(
          data.error ??
            "Unable to sign in. Please try again.",
        );
        return;
      }

      window.location.assign(nextPath);
    } catch {
      setError(
        "Unable to connect. Please check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSetup = mode === "setup";

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-[#3A1A16] px-3 py-5 text-[#3A1A16] sm:px-5 sm:py-8 lg:px-6 lg:py-10">
     
      <div className="pointer-events-none absolute -left-32 -top-20 h-64 w-64 rounded-full bg-[#C93E2B]/25 blur-3xl sm:-left-24 sm:top-0 sm:h-80 sm:w-80 sm:bg-[#C93E2B]/30" />

      <div className="pointer-events-none absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-[#F3E9DC]/10 blur-3xl sm:h-96 sm:w-96 sm:-right-10" />

      {/* Main card */}
      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-[22px] border border-white/10 bg-[#FFFCF9] shadow-[0_20px_70px_rgba(0,0,0,0.25)] sm:rounded-[28px] sm:shadow-[0_30px_100px_rgba(0,0,0,0.28)] lg:grid-cols-[0.9fr_1.1fr]">
        {/*   LEFT PANEL — DESKTOP */}
        <div className="hidden flex-col justify-between bg-[#F3E9DC] p-8 lg:flex xl:p-10">
          <div>
            {/* Brand */}
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#3A1A16] text-[#F3E9DC] xl:h-11 xl:w-11">
                <Utensils size={19} />
              </span>

              <span className="font-display text-3xl font-semibold">
                Bhojan
                <span className="text-[#C93E2B]">Hub</span>
              </span>
            </div>

            <p className="mt-16 text-[9px] font-semibold uppercase tracking-[0.25em] text-[#C93E2B] xl:mt-20 xl:text-[10px]">
              Restaurant operations
            </p>

            <h1 className="mt-4 max-w-sm font-display text-4xl font-medium leading-[0.92] xl:mt-5 xl:text-5xl">
              Everything in service, beautifully connected.
            </h1>

            <p className="mt-5 max-w-sm text-sm leading-6 text-[#665650] xl:mt-6 xl:leading-7">
              Securely manage orders, tables, guests, inventory,
              and every moving part of your restaurant.
            </p>
          </div>

          {/* Security */}
          <div className="flex items-center gap-3 border-t border-[#3A1A16]/10 pt-5 text-[11px] text-[#665650] xl:pt-6 xl:text-xs">
            <ShieldCheck
              size={16}
              className="shrink-0 text-[#C93E2B]"
            />
            Secure staff access
          </div>
        </div>

        {/* RIGHT PANEL — FORM */}
        <div className="min-w-0 p-5 sm:p-8 md:p-10 lg:p-10 xl:p-12">
          {/* Mobile brand */}
          <div className="lg:hidden">
            <div className="flex items-center gap-2 font-display text-2xl font-semibold sm:text-3xl">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#3A1A16] text-[#F3E9DC] sm:h-9 sm:w-9">
                <Utensils
                  size={16}
                  className="sm:h-[18px] sm:w-[18px]"
                />
              </span>

              <span>
                Bhojan
                <span className="text-[#C93E2B]">Hub</span>
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="mt-9 sm:mt-12 lg:mt-3 xl:mt-5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.19em] text-[#C93E2B] sm:text-[10px] sm:tracking-[0.22em]">
              {isSetup ? "Initial setup" : "Welcome back"}
            </p>

            <h2 className="mt-2 max-w-xl font-display text-3xl font-medium leading-[1.05] sm:text-4xl sm:leading-tight">
              {isSetup
                ? "Create your admin account"
                : "Sign in to your workspace"}
            </h2>

            <p className="mt-2 max-w-md text-xs leading-5 text-[#76655F] sm:text-sm sm:leading-6">
              {isSetup
                ? "This is available only while no BhojanHub user exists."
                : "Use your staff credentials to continue."}
            </p>
          </div>

          {/* Form */}
          <form
            className="mt-6 space-y-3.5 sm:mt-8 sm:space-y-4"
            onSubmit={submit}
          >
            {/* Name */}
            {isSetup && (
              <label className="block text-[11px] font-semibold text-[#3A1A16] sm:text-xs">
                Full name

                <input
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  required
                  minLength={2}
                  autoComplete="name"
                  className="
                    mt-1.5
                    h-11
                    w-full
                    rounded-xl
                    border
                    border-[#3A1A16]/15
                    bg-white
                    px-3
                    text-sm
                    text-[#3A1A16]
                    outline-none
                    transition
                    placeholder:text-[#9A8982]
                    focus:border-[#C93E2B]
                    focus:ring-2
                    focus:ring-[#C93E2B]/10
                    sm:h-12
                    sm:px-3.5
                  "
                />
              </label>
            )}

            {/* Email */}
            <label className="block text-[11px] font-semibold text-[#3A1A16] sm:text-xs">
              Email address

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
                autoComplete="email"
                className="
                  mt-1.5
                  h-11
                  w-full
                  rounded-xl
                  border
                  border-[#3A1A16]/15
                  bg-white
                  px-3
                  text-sm
                  text-[#3A1A16]
                  outline-none
                  transition
                  placeholder:text-[#9A8982]
                  focus:border-[#C93E2B]
                  focus:ring-2
                  focus:ring-[#C93E2B]/10
                  sm:h-12
                  sm:px-3.5
                "
              />
            </label>

            {/* Password */}
            <label className="block text-[11px] font-semibold text-[#3A1A16] sm:text-xs">
              Password

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
                minLength={isSetup ? 8 : undefined}
                autoComplete={
                  isSetup
                    ? "new-password"
                    : "current-password"
                }
                className="
                  mt-1.5
                  h-11
                  w-full
                  rounded-xl
                  border
                  border-[#3A1A16]/15
                  bg-white
                  px-3
                  text-sm
                  text-[#3A1A16]
                  outline-none
                  transition
                  placeholder:text-[#9A8982]
                  focus:border-[#C93E2B]
                  focus:ring-2
                  focus:ring-[#C93E2B]/10
                  sm:h-12
                  sm:px-3.5
                "
              />
            </label>

            {/* Error */}
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-[#FCE4DE] px-3 py-2.5 text-[11px] font-medium leading-4 text-[#A23625] sm:text-xs sm:leading-5"
              >
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              disabled={isSubmitting}
              type="submit"
              className="
                inline-flex
                min-h-11
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-[#3A1A16]
                px-4
                py-2.5
                text-xs
                font-semibold
                text-[#F3E9DC]
                transition
                hover:bg-[#C93E2B]
                active:scale-[0.99]
                disabled:cursor-not-allowed
                disabled:opacity-60
                sm:min-h-12
                sm:py-3
                sm:text-sm
              "
            >
              <span className="truncate">
                {isSubmitting
                  ? "Please wait…"
                  : isSetup
                    ? "Create admin account"
                    : "Sign in"}
              </span>

              <ArrowRight
                size={15}
                className="shrink-0 sm:h-4 sm:w-4"
              />
            </button>
          </form>

          {/* Security note */}
          <p className="mt-5 flex items-start gap-2 text-[10px] leading-4 text-[#8D7C74] sm:mt-6 sm:text-[11px] sm:leading-5">
            <LockKeyhole
              size={12}
              className="mt-0.5 shrink-0 sm:h-[13px] sm:w-[13px]"
            />

            <span>
              Your session is secured with an HTTP-only cookie.
            </span>
          </p>
        </div>
      </section>
    </main>
  );
}
