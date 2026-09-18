
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CreditCard,
  DollarSign,
  Package,
  PieChart,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Utensils,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "@/lib/billing/calculateBill";
import type {
  BreakdownItem,
  ReportBreakdownResponse,
  ReportSummary,
  TopItemReport,
} from "@/types/pos";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { ShortcutsHelpModal } from "@/components/shared/ShortcutsHelpModal";

type PresetRange = "all" | "today" | "7d" | "30d" | "custom";

export function ReportingDashboard() {
  const [preset, setPreset] = useState<PresetRange>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [topItems, setTopItems] = useState<TopItemReport[]>([]);
  const [orderTypeData, setOrderTypeData] = useState<BreakdownItem[]>([]);
  const [channelData, setChannelData] = useState<BreakdownItem[]>([]);
  const [paymentData, setPaymentData] = useState<BreakdownItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showShortcuts, setShowShortcuts] = useState(false);

  /* =====================================================
      RESOLVE ACTIVE DATES
  ===================================================== */
  const activeDates = useMemo(() => {
    const now = new Date();
    const formatYMD = (d: Date) => d.toISOString().split("T")[0];

    if (preset === "today") {
      const todayStr = formatYMD(now);
      return { from: todayStr, to: todayStr };
    }

    if (preset === "7d") {
      const past7 = new Date(
        now.getTime() - 7 * 24 * 60 * 60 * 1000
      );
      return {
        from: formatYMD(past7),
        to: formatYMD(now),
      };
    }

    if (preset === "30d") {
      const past30 = new Date(
        now.getTime() - 30 * 24 * 60 * 60 * 1000
      );
      return {
        from: formatYMD(past30),
        to: formatYMD(now),
      };
    }

    if (preset === "custom") {
      return {
        from: customFrom || undefined,
        to: customTo || undefined,
      };
    }

    return {
      from: undefined,
      to: undefined,
    };
  }, [preset, customFrom, customTo]);

 const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();

    if (activeDates.from) {
      params.set("from", activeDates.from);
    }

    if (activeDates.to) {
      params.set("to", activeDates.to);
    }

    const queryString = params.toString()
      ? `?${params.toString()}`
      : "";

    try {
      const [
        summaryRes,
        topItemsRes,
        typeRes,
        channelRes,
        paymentRes,
      ] = await Promise.all([
        fetch(`/api/reports/summary${queryString}`),
        fetch(`/api/reports/top-items${queryString}`),
        fetch(`/api/reports/by-order-type${queryString}`),
        fetch(`/api/reports/by-channel${queryString}`),
        fetch(`/api/reports/by-payment-method${queryString}`),
      ]);

      if (
        !summaryRes.ok ||
        !topItemsRes.ok ||
        !typeRes.ok ||
        !channelRes.ok ||
        !paymentRes.ok
      ) {
        throw new Error("Unable to load performance reports.");
      }

      const summaryData =
        (await summaryRes.json()) as ReportSummary;

      const topItemsData =
        (await topItemsRes.json()) as {
          topItems: TopItemReport[];
        };

      const typeData =
        (await typeRes.json()) as ReportBreakdownResponse;

      const channelDataRes =
        (await channelRes.json()) as ReportBreakdownResponse;

      const paymentDataRes =
        (await paymentRes.json()) as ReportBreakdownResponse;

      setSummary(summaryData);
      setTopItems(topItemsData.topItems || []);
      setOrderTypeData(typeData.breakdown || []);
      setChannelData(channelDataRes.breakdown || []);
      setPaymentData(paymentDataRes.breakdown || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load reports."
      );
    } finally {
      setLoading(false);
    }
  }, [activeDates]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const isEmpty =
    !summary ||
    (summary.completedOrdersCount === 0 &&
      summary.totalSales === 0);

  const shortcuts = [
    {
      key: "?",
      handler: () => setShowShortcuts(true),
      description: "Show keyboard shortcuts",
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#F3E9DC] px-4 py-5 font-sans text-[#3A1A16] sm:px-6 lg:px-8">
      <div className="flex h-full min-h-0 w-full flex-col">
        {/* =====================================================
            FIXED DASHBOARD HEADER
        ===================================================== */}
        <header className="mb-5 shrink-0 flex flex-col gap-4 border-b border-[#3A1A16]/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C93E2B]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#C93E2B]">
                <BarChart3 size={12} />
                BhojanHub Analytics
              </span>

              <span className="text-xs text-[#665650]">
                Live Restaurant Intelligence
              </span>
            </div>

            <h1 className="mt-1 font-display text-3xl font-medium tracking-tight text-[#3A1A16] sm:text-4xl">
              Reporting & sales analytics
            </h1>

            <p className="mt-1.5 text-xs text-[#665650]">
              Track business performance, customer preferences, and
              channel velocity in real time.
            </p>

            <button
              type="button"
              onClick={() => setShowShortcuts(true)}
              className="mt-2 text-[11px] font-medium text-[#88756E] transition hover:text-[#C93E2B]"
            >
              Press ? for shortcuts
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadReports()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-[#3A1A16]/15 bg-[#FFFCF9] px-4 py-2.5 text-xs font-semibold text-[#3A1A16] shadow-sm transition hover:border-[#3A1A16]/25 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={14}
                className={loading ? "animate-spin" : ""}
              />
              {loading ? "Calculating…" : "Refresh Data"}
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 scrollbar-none">
          {/* ERROR STATE */}
          {error && (
            <div className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>

              <button
                type="button"
                onClick={() => void loadReports()}
                className="font-bold underline"
              >
                Retry
              </button>
            </div>
          )}

           <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#3A1A16]/10 bg-[#FFFCF9] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] font-semibold text-[#8D7C74]">
                Period:
              </span>

              <button
                type="button"
                onClick={() => setPreset("all")}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  preset === "all"
                    ? "bg-[#3A1A16] text-[#F3E9DC] shadow-sm"
                    : "border border-[#3A1A16]/10 bg-white text-[#665650] hover:border-[#3A1A16]/25"
                }`}
              >
                All Time
              </button>

              <button
                type="button"
                onClick={() => setPreset("today")}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  preset === "today"
                    ? "bg-[#3A1A16] text-[#F3E9DC] shadow-sm"
                    : "border border-[#3A1A16]/10 bg-white text-[#665650] hover:border-[#3A1A16]/25"
                }`}
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => setPreset("7d")}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  preset === "7d"
                    ? "bg-[#3A1A16] text-[#F3E9DC] shadow-sm"
                    : "border border-[#3A1A16]/10 bg-white text-[#665650] hover:border-[#3A1A16]/25"
                }`}
              >
                Last 7 Days
              </button>

              <button
                type="button"
                onClick={() => setPreset("30d")}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  preset === "30d"
                    ? "bg-[#3A1A16] text-[#F3E9DC] shadow-sm"
                    : "border border-[#3A1A16]/10 bg-white text-[#665650] hover:border-[#3A1A16]/25"
                }`}
              >
                Last 30 Days
              </button>

              <button
                type="button"
                onClick={() => setPreset("custom")}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  preset === "custom"
                    ? "bg-[#3A1A16] text-[#F3E9DC] shadow-sm"
                    : "border border-[#3A1A16]/10 bg-white text-[#665650] hover:border-[#3A1A16]/25"
                }`}
              >
                Custom Range
              </button>
            </div>

            {preset === "custom" && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-[#8D7C74]">
                    From:
                  </span>

                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) =>
                      setCustomFrom(e.target.value)
                    }
                    className="rounded-lg border border-[#3A1A16]/15 bg-white px-2 py-1 text-xs outline-none focus:border-[#C93E2B]"
                  />
                </div>

                <div className="flex items-center gap-1 text-xs">
                  <span className="text-[#8D7C74]">
                    To:
                  </span>

                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) =>
                      setCustomTo(e.target.value)
                    }
                    className="rounded-lg border border-[#3A1A16]/15 bg-white px-2 py-1 text-xs outline-none focus:border-[#C93E2B]"
                  />
                </div>
              </div>
            )}
          </div>

          {loading && !summary ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-[#3A1A16]/10 bg-[#FFFCF9] p-8 text-center">
              <RefreshCw className="h-6 w-6 animate-spin text-[#C93E2B]" />

              <p className="mt-3 text-sm font-medium text-[#665650]">
                Aggregating restaurant sales and order trends…
              </p>
            </div>
          ) : isEmpty ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#3A1A16]/20 bg-[#FFFCF9] p-8 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#FCE4DE] text-[#C93E2B]">
                <Sparkles size={26} />
              </div>

              <h3 className="mt-4 font-display text-2xl font-medium text-[#3A1A16]">
                No completed orders yet
              </h3>

              <p className="mt-2 max-w-md text-xs leading-relaxed text-[#665650]">
                The analytics engine computes real metrics from
                completed restaurant transactions. Complete orders
                through the POS counter or Online Ordering to generate
                live reports.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/features/billing-pos"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#3A1A16] px-4 py-2.5 text-xs font-semibold text-[#F3E9DC] transition hover:bg-[#C93E2B]"
                >
                  <Utensils size={14} />
                  Open Billing & POS
                </Link>

                <Link
                  href="/features/online-ordering"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#3A1A16]/15 bg-white px-4 py-2.5 text-xs font-semibold text-[#3A1A16] transition hover:border-[#3A1A16]/30"
                >
                  <ShoppingBag size={14} />
                  Open Online Ordering
                </Link>
              </div>
            </div>
          ) : (
             <div className="space-y-6 pb-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {/* Total Revenue */}
                <div className="rounded-2xl border border-[#3A1A16]/10 bg-[#FFFCF9] p-5 shadow-sm">
                  <div className="flex items-center justify-between text-[#8D7C74]">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Total Revenue
                    </span>

                    <DollarSign
                      size={16}
                      className="text-[#C93E2B]"
                    />
                  </div>

                  <p className="mt-2 font-display text-3xl font-medium text-[#3A1A16]">
                    {formatCurrency(summary.totalSales)}
                  </p>

                  <p className="mt-1 text-[11px] text-[#665650]">
                    Across {summary.completedOrdersCount} fulfilled
                    orders
                  </p>
                </div>

                {/* Total Orders */}
                <div className="rounded-2xl border border-[#3A1A16]/10 bg-[#FFFCF9] p-5 shadow-sm">
                  <div className="flex items-center justify-between text-[#8D7C74]">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Completed Orders
                    </span>

                    <ShoppingBag
                      size={16}
                      className="text-emerald-700"
                    />
                  </div>

                  <p className="mt-2 font-display text-3xl font-medium text-emerald-800">
                    {summary.completedOrdersCount}
                  </p>

                  <p className="mt-1 text-[11px] text-[#665650]">
                    {summary.pendingOrdersCount > 0
                      ? `${summary.pendingOrdersCount} currently pending`
                      : "No active pending orders"}
                  </p>
                </div>

                {/* Average Order Value */}
                <div className="rounded-2xl border border-[#3A1A16]/10 bg-[#FFFCF9] p-5 shadow-sm">
                  <div className="flex items-center justify-between text-[#8D7C74]">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Average Order Value
                    </span>

                    <TrendingUp
                      size={16}
                      className="text-amber-700"
                    />
                  </div>

                  <p className="mt-2 font-display text-3xl font-medium text-amber-800">
                    {formatCurrency(
                      summary.averageOrderValue
                    )}
                  </p>

                  <p className="mt-1 text-[11px] text-[#665650]">
                    Per guest transaction
                  </p>
                </div>

                {/* Food Units Sold */}
                <div className="rounded-2xl border border-[#3A1A16]/10 bg-[#FFFCF9] p-5 shadow-sm">
                  <div className="flex items-center justify-between text-[#8D7C74]">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Dishes Sold
                    </span>

                    <Package
                      size={16}
                      className="text-purple-700"
                    />
                  </div>

                  <p className="mt-2 font-display text-3xl font-medium text-purple-800">
                    {summary.totalItemsSold}
                  </p>

                  <p className="mt-1 text-[11px] text-[#665650]">
                    Total portions prepared
                  </p>
                </div>
              </div>

               <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border border-[#3A1A16]/10 bg-[#FFFCF9] p-5 shadow-sm sm:p-6">
                  <div className="flex items-center justify-between border-b border-[#3A1A16]/10 pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C93E2B]">
                        Menu Velocity
                      </span>

                      <h2 className="font-display text-2xl font-medium text-[#3A1A16]">
                        Top-Selling Dishes
                      </h2>
                    </div>

                    <span className="rounded-full bg-[#F3E9DC] px-2.5 py-1 text-xs font-semibold text-[#665650]">
                      {topItems.length} items sold
                    </span>
                  </div>

                  {topItems.length === 0 ? (
                    <p className="py-8 text-center text-xs text-[#665650]">
                      No item data recorded in this period.
                    </p>
                  ) : (
                    <div className="mt-4 divide-y divide-[#3A1A16]/05">
                      {topItems.map((item, index) => (
                        <div key={item.id} className="py-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#F3E9DC] text-xs font-bold text-[#3A1A16]">
                                {index + 1}
                              </span>

                              <div>
                                <h3 className="font-semibold text-xs text-[#3A1A16]">
                                  {item.name}
                                </h3>

                                <span className="rounded bg-[#F3E9DC]/60 px-1.5 py-0.5 text-[10px] text-[#665650]">
                                  {item.category}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="font-sans text-xs font-bold text-[#3A1A16]">
                                {formatCurrency(item.revenue)}
                              </p>

                              <p className="text-[11px] text-[#665650]">
                                {item.quantitySold} portions (
                                {item.sharePercentage}%)
                              </p>
                            </div>
                          </div>

                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#F3E9DC]">
                            <div
                              className="h-full rounded-full bg-[#C93E2B] transition-all duration-500"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(
                                    8,
                                    item.sharePercentage
                                  )
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* =================================================
                    BREAKDOWN PANELS
                ================================================= */}
                <div className="flex flex-col gap-5">
                  {/* Order Type */}
                  <div className="rounded-2xl border border-[#3A1A16]/10 bg-[#FFFCF9] p-5 shadow-sm">
                    <div className="border-b border-[#3A1A16]/10 pb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C93E2B]">
                        Fulfillment Channel
                      </span>

                      <h3 className="font-display text-xl font-medium text-[#3A1A16]">
                        Order Type Breakdown
                      </h3>
                    </div>

                    <div className="mt-4 space-y-3">
                      {orderTypeData.map((item) => (
                        <div key={item.label}>
                          <div className="flex justify-between gap-3 text-xs">
                            <span className="font-semibold text-[#3A1A16]">
                              {item.label} ({item.orderCount})
                            </span>

                            <span className="text-right font-bold text-[#665650]">
                              {formatCurrency(
                                item.totalRevenue
                              )}{" "}
                              ({item.percentage}%)
                            </span>
                          </div>

                          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#F3E9DC]">
                            <div
                              className="h-full rounded-full bg-amber-600 transition-all duration-500"
                              style={{
                                width: `${item.percentage}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Channel */}
                  <div className="rounded-2xl border border-[#3A1A16]/10 bg-[#FFFCF9] p-5 shadow-sm">
                    <div className="border-b border-[#3A1A16]/10 pb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C93E2B]">
                        Platform Origin
                      </span>

                      <h3 className="font-display text-xl font-medium text-[#3A1A16]">
                        Sales by Channel
                      </h3>
                    </div>

                    <div className="mt-4 space-y-3">
                      {channelData.map((item) => (
                        <div key={item.label}>
                          <div className="flex justify-between gap-3 text-xs">
                            <span className="font-semibold text-[#3A1A16]">
                              {item.label} ({item.orderCount}{" "}
                              orders)
                            </span>

                            <span className="text-right font-bold text-[#665650]">
                              {formatCurrency(
                                item.totalRevenue
                              )}{" "}
                              ({item.percentage}%)
                            </span>
                          </div>

                          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#F3E9DC]">
                            <div
                              className="h-full rounded-full bg-[#C93E2B] transition-all duration-500"
                              style={{
                                width: `${item.percentage}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment */}
                  <div className="rounded-2xl border border-[#3A1A16]/10 bg-[#FFFCF9] p-5 shadow-sm">
                    <div className="border-b border-[#3A1A16]/10 pb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C93E2B]">
                        Settlement
                      </span>

                      <h3 className="font-display text-xl font-medium text-[#3A1A16]">
                        Payment Methods
                      </h3>
                    </div>

                    <div className="mt-4 space-y-3">
                      {paymentData.map((item) => (
                        <div key={item.label}>
                          <div className="flex justify-between gap-3 text-xs">
                            <span className="font-semibold text-[#3A1A16]">
                              {item.label} ({item.orderCount}{" "}
                              payments)
                            </span>

                            <span className="text-right font-bold text-[#665650]">
                              {formatCurrency(
                                item.totalRevenue
                              )}{" "}
                              ({item.percentage}%)
                            </span>
                          </div>

                          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#F3E9DC]">
                            <div
                              className="h-full rounded-full bg-emerald-700 transition-all duration-500"
                              style={{
                                width: `${item.percentage}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ShortcutsHelpModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={shortcuts}
      />
    </div>
  );
}