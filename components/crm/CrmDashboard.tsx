
"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Heart,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShoppingBag,
  Sparkles,
  Tag,
  User,
  Users,
  Utensils,
  X,
} from "lucide-react";

import { formatCurrency } from "@/lib/billing/calculateBill";
import type {
  Customer,
  CustomersResponse,
  CustomerResponse,
  OrdersResponse,
  PosOrder,
} from "@/types/pos";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { ShortcutsHelpModal } from "@/components/shared/ShortcutsHelpModal";

type FilterTab = "all" | "regular" | "vip" | "with-orders";

const PRESET_TAGS = [
  "VIP",
  "Regular",
  "Vegetarian",
  "Vegan",
  "Family",
  "Corporate",
  "Weekend Diner",
  "High Spender",
];

export function CrmDashboard() {
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [showShortcuts, setShowShortcuts] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<PosOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<PosOrder[]>([]);
  const [loadingCustomerOrders, setLoadingCustomerOrders] = useState(false);

  const [notesInput, setNotesInput] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSuccess, setNotesSuccess] = useState(false);

  const [customTagInput, setCustomTagInput] = useState("");
  const [isUpdatingTags, setIsUpdatingTags] = useState(false);

  const [pointDeltaInput, setPointDeltaInput] = useState("");
  const [isUpdatingPoints, setIsUpdatingPoints] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
    tags: [] as string[],
    loyalty_points: 0,
  });

  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [addCustomerError, setAddCustomerError] = useState("");

  const [isSeeding, setIsSeeding] = useState(false);

  const [feedbackBanner, setFeedbackBanner] = useState<{
    message: string;
    type: "success" | "info";
  } | null>(null);

  /* =====================================================
      FETCH DATA
  ===================================================== */

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const [customersRes, ordersRes] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/orders"),
      ]);

      if (!customersRes.ok) {
        throw new Error("Failed to load customer directory.");
      }

      const customersData =
        (await customersRes.json()) as CustomersResponse;

      setCustomers(customersData.customers || []);

      if (ordersRes.ok) {
        const ordersData = (await ordersRes.json()) as OrdersResponse;
        setOrders(ordersData.orders || []);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* =====================================================
      CORRELATE CUSTOMER ORDERS
  ===================================================== */

  const getOrdersForCustomer = useCallback(
    (
      customer: Customer,
      orderList: PosOrder[] = orders
    ): PosOrder[] => {
      const phoneDigits = customer.phone.replace(/\D/g, "");

      return orderList
        .filter((order) => {
          if (order.customerId === customer.id) return true;

          if (phoneDigits) {
            const orderPhone = (
              order.details?.delivery?.phone || ""
            ).replace(/\D/g, "");

            if (
              orderPhone &&
              (orderPhone === phoneDigits ||
                (phoneDigits.length >= 6 &&
                  orderPhone.length >= 6 &&
                  (orderPhone.endsWith(phoneDigits) ||
                    phoneDigits.endsWith(orderPhone))))
            ) {
              return true;
            }
          }

          return false;
        })
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        );
    },
    [orders]
  );

  /*   CUSTOMER STATS */

  const customerStatsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        totalOrders: number;
        completedOrders: number;
        totalSpent: number;
        isRegular: boolean;
        lastOrder: PosOrder | null;
      }
    >();

    for (const cust of customers) {
      const custOrders = getOrdersForCustomer(cust, orders);

      const completed = custOrders.filter(
        (order) => order.status === "completed"
      );

      const spent = completed.reduce(
        (sum, order) => sum + (order.totals?.grandTotal || 0),
        0
      );

      map.set(cust.id, {
        totalOrders: custOrders.length,
        completedOrders: completed.length,
        totalSpent: spent,
        isRegular: completed.length >= 3,
        lastOrder: custOrders[0] || null,
      });
    }

    return map;
  }, [customers, orders, getOrdersForCustomer]);

  /*   KPI SUMMARY */

  const kpis = useMemo(() => {
    let regularCount = 0;
    let totalLoyalty = 0;
    let totalRevenue = 0;

    for (const cust of customers) {
      totalLoyalty += cust.loyalty_points || 0;

      const stats = customerStatsMap.get(cust.id);

      if (stats?.isRegular) regularCount++;
      if (stats?.totalSpent) totalRevenue += stats.totalSpent;
    }

    return {
      totalCustomers: customers.length,
      regularCount,
      totalLoyalty,
      totalRevenue,
    };
  }, [customers, customerStatsMap]);

  /*   FILTER CUSTOMERS */

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const queryDigits = searchQuery.replace(/\D/g, "");

    return customers.filter((cust) => {
      const stats = customerStatsMap.get(cust.id);

      if (query) {
        const nameMatch = cust.name.toLowerCase().includes(query);
        const emailMatch = cust.email?.toLowerCase().includes(query);

        const phoneMatch =
          cust.phone.toLowerCase().includes(query) ||
          (queryDigits.length >= 3 &&
            cust.phone.replace(/\D/g, "").includes(queryDigits));

        const tagsMatch = cust.tags?.some((tag) =>
          tag.toLowerCase().includes(query)
        );

        if (!nameMatch && !emailMatch && !phoneMatch && !tagsMatch) {
          return false;
        }
      }

      if (selectedTag && !cust.tags?.includes(selectedTag)) {
        return false;
      }

      if (activeTab === "regular" && !stats?.isRegular) {
        return false;
      }

      if (activeTab === "vip" && !cust.tags?.includes("VIP")) {
        return false;
      }

      if (
        activeTab === "with-orders" &&
        (!stats || stats.totalOrders === 0)
      ) {
        return false;
      }

      return true;
    });
  }, [
    customers,
    searchQuery,
    activeTab,
    selectedTag,
    customerStatsMap,
  ]);

  /* =====================================================
      SELECT CUSTOMER
  ===================================================== */

  const handleSelectCustomer = useCallback(
    async (cust: Customer) => {
      setSelectedCustomer(cust);
      setNotesInput(cust.notes || "");
      setNotesSuccess(false);
      setPointDeltaInput("");
      setLoadingCustomerOrders(true);

      try {
        const res = await fetch(`/api/customers/${cust.id}/orders`);

        if (res.ok) {
          const data = (await res.json()) as OrdersResponse;
          setCustomerOrders(data.orders || []);
        } else {
          setCustomerOrders(getOrdersForCustomer(cust));
        }
      } catch {
        setCustomerOrders(getOrdersForCustomer(cust));
      } finally {
        setLoadingCustomerOrders(false);
      }
    },
    [getOrdersForCustomer]
  );

  /* =====================================================
      SAVE NOTES
  ===================================================== */

  const handleSaveNotes = async () => {
    if (!selectedCustomer) return;

    setIsSavingNotes(true);
    setNotesSuccess(false);

    try {
      const res = await fetch(
        `/api/customers/${selectedCustomer.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notes: notesInput,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to save notes.");
      }

      const data = (await res.json()) as CustomerResponse;

      setSelectedCustomer(data.customer);

      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === data.customer.id
            ? data.customer
            : customer
        )
      );

      setNotesSuccess(true);

      setTimeout(() => {
        setNotesSuccess(false);
      }, 3000);
    } catch (err: unknown) {
      alert(
        err instanceof Error
          ? err.message
          : "Error saving guest notes."
      );
    } finally {
      setIsSavingNotes(false);
    }
  };

  /* =====================================================
      TAG MANAGEMENT
  ===================================================== */

  const handleToggleTag = async (tag: string) => {
    if (!selectedCustomer || isUpdatingTags) return;

    setIsUpdatingTags(true);

    const currentTags = selectedCustomer.tags || [];

    const newTags = currentTags.includes(tag)
      ? currentTags.filter((item) => item !== tag)
      : [...currentTags, tag];

    try {
      const res = await fetch(
        `/api/customers/${selectedCustomer.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tags: newTags,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update tags.");
      }

      const data = (await res.json()) as CustomerResponse;

      setSelectedCustomer(data.customer);

      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === data.customer.id
            ? data.customer
            : customer
        )
      );
    } catch (err: unknown) {
      alert(
        err instanceof Error
          ? err.message
          : "Error updating tags."
      );
    } finally {
      setIsUpdatingTags(false);
    }
  };

  const handleAddCustomTag = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (
      !selectedCustomer ||
      !customTagInput.trim() ||
      isUpdatingTags
    ) {
      return;
    }

    const cleanTag = customTagInput.trim();

    if ((selectedCustomer.tags || []).includes(cleanTag)) {
      setCustomTagInput("");
      return;
    }

    await handleToggleTag(cleanTag);
    setCustomTagInput("");
  };

  /* =====================================================
      LOYALTY POINTS
  ===================================================== */

  const handleAdjustPoints = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (
      !selectedCustomer ||
      !pointDeltaInput.trim() ||
      isUpdatingPoints
    ) {
      return;
    }

    const delta = parseInt(pointDeltaInput.trim(), 10);

    if (isNaN(delta)) return;

    const currentPoints =
      selectedCustomer.loyalty_points || 0;

    const newPoints = Math.max(
      0,
      currentPoints + delta
    );

    setIsUpdatingPoints(true);

    try {
      const res = await fetch(
        `/api/customers/${selectedCustomer.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            loyalty_points: newPoints,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update points.");
      }

      const data = (await res.json()) as CustomerResponse;

      setSelectedCustomer(data.customer);

      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === data.customer.id
            ? data.customer
            : customer
        )
      );

      setPointDeltaInput("");
    } catch (err: unknown) {
      alert(
        err instanceof Error
          ? err.message
          : "Error updating points."
      );
    } finally {
      setIsUpdatingPoints(false);
    }
  };

  /* =====================================================
      CREATE CUSTOMER
  ===================================================== */

  const handleCreateCustomer = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (
      !newCustomer.name.trim() ||
      !newCustomer.phone.trim()
    ) {
      setAddCustomerError(
        "Name and phone number are required."
      );
      return;
    }

    setIsCreatingCustomer(true);
    setAddCustomerError("");

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCustomer.name.trim(),
          phone: newCustomer.phone.trim(),
          email: newCustomer.email.trim() || undefined,
          address: newCustomer.address.trim() || undefined,
          notes: newCustomer.notes.trim() || undefined,
          tags: newCustomer.tags,
          loyalty_points:
            Number(newCustomer.loyalty_points) || 0,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();

        throw new Error(
          errData.error || "Failed to create customer."
        );
      }

      const data =
        (await res.json()) as CustomerResponse;

      setCustomers((prev) => [
        data.customer,
        ...prev,
      ]);

      setShowAddModal(false);

      setNewCustomer({
        name: "",
        phone: "",
        email: "",
        address: "",
        notes: "",
        tags: [],
        loyalty_points: 0,
      });

      handleSelectCustomer(data.customer);

      setFeedbackBanner({
        message: `Customer profile for "${data.customer.name}" created successfully!`,
        type: "success",
      });

      setTimeout(() => {
        setFeedbackBanner(null);
      }, 5000);
    } catch (err: unknown) {
      setAddCustomerError(
        err instanceof Error
          ? err.message
          : "Failed to create customer."
      );
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  /* =====================================================
      SEED DEMO DATA
  ===================================================== */

  const handleSeedDemoData = async () => {
    setIsSeeding(true);

    try {
      const sunitaPhone = "9876543210";

      let sunitaCust = customers.find((customer) =>
        customer.phone.includes(sunitaPhone)
      );

      if (!sunitaCust) {
        const res = await fetch("/api/customers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Sunita Rao",
            phone: sunitaPhone,
            email: "sunita.rao@example.com",
            address:
              "Flat 402, Lotus Towers, Indiranagar",
            notes:
              "Visits with family on weekends. Mild spice preference. Loves Dal Makhani.",
            tags: ["Regular", "Family"],
            loyalty_points: 35,
          }),
        });

        if (res.ok) {
          const data =
            (await res.json()) as CustomerResponse;

          sunitaCust = data.customer;
        }
      }

      const aaravPhone = "9820112345";

      let aaravCust = customers.find((customer) =>
        customer.phone.includes(aaravPhone)
      );

      if (!aaravCust) {
        const res = await fetch("/api/customers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Aarav Mehta",
            phone: aaravPhone,
            email: "aarav.mehta@example.com",
            address: "12 Palm Grove, Bandra West",
            notes:
              "Prefers table near window. Strict vegetarian.",
            tags: ["VIP", "Vegetarian"],
            loyalty_points: 48,
          }),
        });

        if (res.ok) {
          const data =
            (await res.json()) as CustomerResponse;

          aaravCust = data.customer;
        }
      }

      const vikramPhone = "9811122334";

      let vikramCust = customers.find((customer) =>
        customer.phone.includes(vikramPhone)
      );

      if (!vikramCust) {
        const res = await fetch("/api/customers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Vikram Singhania",
            phone: vikramPhone,
            email: "vikram@techcorp.in",
            address: "DLF Cyber City, Tower B",
            notes:
              "Corporate accounts diner. Requests itemized GST invoices.",
            tags: ["Corporate", "High Spender"],
            loyalty_points: 20,
          }),
        });

        if (res.ok) {
          const data =
            (await res.json()) as CustomerResponse;

          vikramCust = data.customer;
        }
      }

      const sampleOrdersToCreate = [
        {
          items: [
            {
              id: "butter-chicken",
              quantity: 1,
            },
            {
              id: "coke",
              quantity: 2,
            },
          ],
          table: "Table 03",
          grandTotal: 574,
          subtotal: 547,
          taxableAmount: 547,
          taxAmount: 27.35,
        },
        {
          items: [
            {
              id: "paneer-tikka",
              quantity: 2,
            },
            {
              id: "masala-chai",
              quantity: 2,
            },
          ],
          table: "Table 05",
          grandTotal: 731,
          subtotal: 696,
          taxableAmount: 696,
          taxAmount: 34.8,
        },
        {
          items: [
            {
              id: "farmhouse",
              quantity: 1,
            },
            {
              id: "gulab-jamun",
              quantity: 2,
            },
          ],
          table: "Table 02",
          grandTotal: 742,
          subtotal: 707,
          taxableAmount: 707,
          taxAmount: 35.35,
        },
      ];

      for (const sample of sampleOrdersToCreate) {
        await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "completed",
            items: sample.items,
            details: {
              type: "Delivery",
              table: sample.table,
              delivery: {
                name: "Sunita Rao",
                phone: sunitaPhone,
                address:
                  "Flat 402, Lotus Towers, Indiranagar",
              },
            },
            discount: {
              kind: "percent",
              value: 0,
            },
            taxRate: 5,
            serviceEnabled: false,
            serviceRate: 5,
            paymentMethod: "UPI",
            totals: {
              subtotal: sample.subtotal,
              discountAmount: 0,
              taxableAmount: sample.taxableAmount,
              taxAmount: sample.taxAmount,
              serviceCharge: 0,
              grandTotal: sample.grandTotal,
            },
          }),
        });
      }

      await fetchData(true);

      setFeedbackBanner({
        message:
          "Demo profiles & orders loaded! Check Sunita Rao's profile for 3 correlated orders & Regular badge.",
        type: "success",
      });

      setTimeout(() => {
        setFeedbackBanner(null);
      }, 6000);
    } catch (err: unknown) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to seed demo data."
      );
    } finally {
      setIsSeeding(false);
    }
  };

  const initials = (name: string) =>
    name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const uniqueTags = Array.from(
    new Set(
      customers.flatMap(
        (customer) => customer.tags || []
      )
    )
  );

  const shortcuts = [
    {
      key: "/",
      handler: () => searchInputRef.current?.focus(),
      description: "Focus customer search",
    },
    {
      key: "?",
      handler: () => setShowShortcuts(true),
      description: "Show keyboard shortcuts",
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden bg-[#F3E9DC] text-[#3A1A16] antialiased selection:bg-[#C93E2B] selection:text-white">
      {/* =====================================================
          FEEDBACK
      ===================================================== */}

      {feedbackBanner && (
        <div className="sticky top-0 z-40 border-b border-emerald-200 bg-emerald-50 px-3 py-2.5 sm:px-6 sm:py-3">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 text-xs sm:gap-4 sm:text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-600 text-white">
                <CheckCircle2 size={15} />
              </span>

              <span className="font-medium">
                {feedbackBanner.message}
              </span>
            </div>

            <button
              onClick={() => setFeedbackBanner(null)}
              className="shrink-0 rounded-full p-1.5 text-emerald-700 transition hover:bg-emerald-100"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="border-b border-[#3A1A16]/10 bg-[#F3E9DC]">
        <div className="mx-auto max-w-[1600px] px-3 py-5 sm:px-5 sm:py-7 md:px-7 lg:px-10">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between xl:gap-7">
            <div className="max-w-3xl">
              <div className="mb-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C93E2B]/15 bg-[#C93E2B]/8 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#C93E2B] sm:px-3 sm:text-[10px] sm:tracking-[0.14em]">
                  <Heart
                    size={10}
                    className="fill-current sm:h-[11px] sm:w-[11px]"
                  />
                  Guest Intelligence
                </span>

                <span className="rounded-full border border-[#3A1A16]/10 bg-white px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#665650] sm:px-3 sm:text-[10px] sm:tracking-[0.12em]">
                  Live Directory
                </span>
              </div>

              <h1 className="font-display text-[2.35rem] font-semibold leading-[0.95] tracking-[-0.025em] text-[#3A1A16] sm:text-5xl">
                Guest Directory
                <span className="block text-[#C93E2B]">
                  & Loyalty
                </span>
              </h1>

              <p className="mt-3 max-w-2xl text-[12px] leading-5 text-[#665650] sm:mt-4 sm:text-sm sm:leading-6">
                Build stronger guest relationships with customer
                profiles, order history, preferences, loyalty
                points, and useful dining insights.
              </p>

              <button
                type="button"
                onClick={() => setShowShortcuts(true)}
                className="mt-2 text-[10px] font-medium text-[#88756E] hover:text-[#C93E2B] sm:text-[11px]"
              >
                Press ? for shortcuts
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2.5">
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing || loading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#3A1A16]/12 bg-white px-4 text-xs font-semibold text-[#3A1A16] shadow-sm transition hover:border-[#3A1A16]/25 hover:bg-[#F3E9DC]/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={
                    refreshing
                      ? "animate-spin text-[#C93E2B]"
                      : ""
                  }
                />
                Refresh
              </button>

              {customers.length === 0 && (
                <button
                  onClick={handleSeedDemoData}
                  disabled={isSeeding}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#C93E2B]/15 bg-[#C93E2B]/5 px-4 text-xs font-semibold text-[#C93E2B] transition hover:bg-[#C93E2B]/10 disabled:opacity-50"
                >
                  <Sparkles
                    size={14}
                    className={
                      isSeeding ? "animate-spin" : ""
                    }
                  />
                  {isSeeding
                    ? "Loading..."
                    : "Load Demo Data"}
                </button>
              )}

              <button
                onClick={() => {
                  setAddCustomerError("");
                  setShowAddModal(true);
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#C93E2B] px-5 text-xs font-bold text-white shadow-[0_8px_22px_rgba(201,62,43,0.18)] transition hover:bg-[#AD3424] hover:shadow-[0_10px_26px_rgba(201,62,43,0.24)] active:scale-[0.98]"
              >
                <Plus size={15} />
                Add Guest
              </button>
            </div>
          </div>

          {/* KPI CARDS */}

          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:mt-8 sm:gap-3 lg:grid-cols-4">
            {[
              {
                label: "Total Guests",
                value: kpis.totalCustomers,
                note: "Customer profiles",
                icon: Users,
                tone: "cream",
              },
              {
                label: "Regular Guests",
                value: kpis.regularCount,
                note: "3+ completed visits",
                icon: Award,
                tone: "amber",
              },
              {
                label: "Loyalty Points",
                value: kpis.totalLoyalty,
                note: "Across all guests",
                icon: Sparkles,
                tone: "green",
              },
              {
                label: "Correlated Spend",
                value: formatCurrency(kpis.totalRevenue),
                note: "Completed orders",
                icon: ShoppingBag,
                tone: "coral",
              },
            ].map((item) => {
              const Icon = item.icon;

              const iconClass =
                item.tone === "amber"
                  ? "bg-amber-50 text-amber-700"
                  : item.tone === "green"
                  ? "bg-emerald-50 text-emerald-700"
                  : item.tone === "coral"
                  ? "bg-[#C93E2B]/8 text-[#C93E2B]"
                  : "bg-[#F3E9DC] text-[#3A1A16]";

              return (
                <div
                  key={item.label}
                  className="group rounded-2xl border border-[#3A1A16]/10 bg-white p-3.5 shadow-[0_5px_20px_rgba(58,26,22,0.035)] transition hover:-translate-y-0.5 hover:border-[#3A1A16]/15 hover:shadow-[0_10px_28px_rgba(58,26,22,0.07)] sm:p-5"
                >
                  <div className="flex items-start justify-between gap-2.5 sm:gap-3">
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#88756E] sm:text-[10px] sm:tracking-[0.13em]">
                        {item.label}
                      </p>

                      <p className="mt-1.5 truncate font-display text-2xl font-semibold tracking-tight text-[#3A1A16] sm:mt-2 sm:text-3xl">
                        {item.value}
                      </p>
                    </div>

                    <div
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl sm:h-9 sm:w-9 ${iconClass}`}
                    >
                      <Icon size={15} />
                    </div>
                  </div>

                  <p className="mt-1.5 line-clamp-2 text-[9px] leading-4 text-[#88756E] sm:mt-2 sm:text-[10px]">
                    {item.note}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* =====================================================
          FILTER / SEARCH
      ===================================================== */}

      <section className="mx-auto max-w-[1600px] px-3 py-4 sm:px-5 sm:py-6 md:px-7 lg:px-10">
        <div className="rounded-2xl border border-[#3A1A16]/10 bg-white p-2.5 shadow-[0_5px_20px_rgba(58,26,22,0.035)] sm:p-3">
          <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#88756E]"
              />

              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                placeholder="Search guests by name, phone, email or tag..."
                className="h-10 w-full rounded-xl border border-[#3A1A16]/10 bg-[#FDFBF7] pl-10 pr-10 text-[11px] font-medium text-[#3A1A16] outline-none transition placeholder:text-[#88756E] focus:border-[#C93E2B]/40 focus:bg-white focus:ring-4 focus:ring-[#C93E2B]/5 sm:h-11 sm:text-xs"
              />

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#88756E] transition hover:bg-[#F3E9DC] hover:text-[#3A1A16]"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:items-center">
              {[
                {
                  id: "all" as FilterTab,
                  label: `All ${customers.length}`,
                  icon: Users,
                },
                {
                  id: "regular" as FilterTab,
                  label: `Regular ${kpis.regularCount}`,
                  icon: Award,
                },
                {
                  id: "vip" as FilterTab,
                  label: "VIP Guests",
                  icon: Sparkles,
                },
                {
                  id: "with-orders" as FilterTab,
                  label: "With Orders",
                  icon: ShoppingBag,
                },
              ].map((tab) => {
                const Icon = tab.icon;
                const active =
                  activeTab === tab.id && !selectedTag;

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSelectedTag(null);
                    }}
                    className={`inline-flex h-9 min-w-0 items-center justify-center gap-1 rounded-lg px-2 text-[10px] font-bold transition sm:h-9 sm:gap-1.5 sm:px-3 sm:text-[11px] ${
                      active
                        ? "bg-[#3A1A16] text-white shadow-sm"
                        : "bg-[#FDFBF7] text-[#665650] hover:bg-[#F3E9DC] hover:text-[#3A1A16]"
                    }`}
                  >
                    <Icon
                      size={12}
                      className="shrink-0"
                    />
                    <span className="truncate">
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {uniqueTags.length > 0 && (
            <div className="mt-2.5 flex min-w-0 items-center gap-2 border-t border-[#3A1A16]/7 pt-2.5 sm:mt-3 sm:pt-3">
              <span className="flex shrink-0 items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.12em] text-[#88756E] sm:text-[9px] sm:tracking-[0.14em]">
                <Tag size={10} />
                <span className="hidden sm:inline">
                  Segments
                </span>
              </span>

              <div className="no-scrollbar flex min-w-0 gap-1.5 overflow-x-auto">
                {uniqueTags.map((tag) => {
                  const active = selectedTag === tag;

                  return (
                    <button
                      key={tag}
                      onClick={() =>
                        setSelectedTag(
                          active ? null : tag
                        )
                      }
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-semibold transition sm:text-[10px] ${
                        active
                          ? "border-[#C93E2B] bg-[#C93E2B] text-white"
                          : "border-[#3A1A16]/10 bg-[#F3E9DC]/50 text-[#665650] hover:border-[#C93E2B]/25 hover:bg-[#F3E9DC]"
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          DIRECTORY
      ===================================================== */}

      <main className="mx-auto w-full max-w-[1600px] px-3 pb-8 sm:px-5 sm:pb-10 md:px-7 lg:px-10 lg:pb-14">
        {loading ? (
          <div className="rounded-2xl border border-[#3A1A16]/10 bg-white py-20 text-center shadow-sm sm:py-24">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#F3E9DC]">
              <RefreshCw
                size={22}
                className="animate-spin text-[#C93E2B]"
              />
            </div>

            <p className="font-display text-xl font-semibold text-[#3A1A16]">
              Loading guest intelligence
            </p>

            <p className="mt-1 px-4 text-xs text-[#88756E]">
              Matching customer records with order history...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center sm:p-8">
            <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-red-100 text-red-600">
              <AlertCircle size={22} />
            </div>

            <p className="mt-3 break-words text-sm font-semibold text-red-800">
              {error}
            </p>

            <button
              onClick={() => fetchData()}
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : customers.length === 0 ? (
          <div className="overflow-hidden rounded-2xl border border-[#3A1A16]/10 bg-[#3A1A16] shadow-xl">
            <div className="relative px-5 py-12 text-center sm:px-12 sm:py-14">
              <div className="absolute left-0 top-0 h-40 w-40 rounded-full bg-[#C93E2B]/15 blur-3xl" />
              <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-[#F3E9DC]/10 blur-3xl" />

              <div className="relative">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/10 text-[#F3E9DC]">
                  <Users size={30} />
                </div>

                <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-[#C93E2B]">
                  Guest intelligence
                </p>

                <h2 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl">
                  Your guest book starts here.
                </h2>

                <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/60">
                  Create customer profiles and connect them
                  with their dining history, preferences,
                  loyalty points, and valuable relationship
                  data.
                </p>

                <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
                  <button
                    onClick={() => {
                      setAddCustomerError("");
                      setShowAddModal(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C93E2B] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#AD3424]"
                  >
                    <Plus size={15} />
                    Add First Guest
                  </button>

                  <button
                    onClick={handleSeedDemoData}
                    disabled={isSeeding}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/8 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-white/12 disabled:opacity-50"
                  >
                    <Sparkles size={15} />
                    {isSeeding
                      ? "Loading..."
                      : "Load Demo Data"}
                  </button>
                </div>

                <div className="mx-auto mt-9 flex max-w-md flex-wrap justify-center gap-x-5 gap-y-2 border-t border-white/10 pt-5">
                  <Link
                    href="/features/billing-pos"
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/60 transition hover:text-white"
                  >
                    Billing & POS
                    <ArrowRight size={12} />
                  </Link>

                  <Link
                    href="/features/online-ordering"
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/60 transition hover:text-white"
                  >
                    Online Ordering
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="rounded-2xl border border-[#3A1A16]/10 bg-white px-5 py-14 text-center shadow-sm sm:px-6 sm:py-16">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#F3E9DC] text-[#88756E]">
              <Search size={22} />
            </div>

            <h3 className="mt-4 font-display text-2xl font-semibold text-[#3A1A16]">
              No matching guests
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#88756E]">
              Try a different search or remove the active
              segment filters.
            </p>

            <button
              onClick={() => {
                setSearchQuery("");
                setActiveTab("all");
                setSelectedTag(null);
              }}
              className="mt-5 rounded-xl border border-[#3A1A16]/12 bg-white px-4 py-2 text-xs font-bold text-[#3A1A16] transition hover:bg-[#F3E9DC]/50"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#88756E]">
                  Customer directory
                </p>

                <p className="mt-1 text-xs text-[#665650]">
                  Showing{" "}
                  <span className="font-bold text-[#3A1A16]">
                    {filteredCustomers.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-[#3A1A16]">
                    {customers.length}
                  </span>{" "}
                  guests
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-2 xl:grid-cols-4">
              {filteredCustomers.map((cust) => {
                const stats = customerStatsMap.get(cust.id);
                const isSelected =
                  selectedCustomer?.id === cust.id;

                return (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => handleSelectCustomer(cust)}
                    className={`group relative min-w-0 overflow-hidden rounded-2xl border bg-white p-3.5 text-left transition-all duration-200 sm:p-5 ${
                      isSelected
                        ? "border-[#C93E2B]/50 ring-4 ring-[#C93E2B]/8"
                        : "border-[#3A1A16]/10 hover:-translate-y-0.5 hover:border-[#3A1A16]/20 hover:shadow-[0_12px_30px_rgba(58,26,22,0.07)]"
                    }`}
                  >
                    <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-[#F3E9DC]/60 blur-2xl transition group-hover:bg-[#C93E2B]/5 sm:h-24 sm:w-24" />

                    <div className="relative min-w-0">
                      <div className="flex items-start justify-between gap-2.5 sm:gap-3">
                        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F3E9DC] font-display text-sm font-bold text-[#3A1A16] transition group-hover:bg-[#3A1A16] group-hover:text-white sm:h-11 sm:w-11 sm:rounded-2xl">
                            {initials(cust.name)}
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate font-display text-base font-semibold text-[#3A1A16] transition group-hover:text-[#C93E2B] sm:text-lg">
                              {cust.name}
                            </h3>

                            <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[10px] text-[#88756E] sm:text-[11px]">
                              <Phone
                                size={10}
                                className="shrink-0"
                              />
                              <span className="truncate">
                                {cust.phone}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-1 text-[9px] font-bold text-emerald-800 sm:px-2 sm:text-[10px]">
                          <Sparkles
                            size={9}
                            className="text-emerald-600"
                          />
                          {cust.loyalty_points || 0}
                        </div>
                      </div>

                      <div className="mt-3 flex min-h-[25px] flex-wrap gap-1 sm:mt-4 sm:gap-1.5">
                        {stats?.isRegular && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.06em] text-amber-800 sm:px-2.5 sm:text-[9px]">
                            <Award size={9} />
                            Regular
                          </span>
                        )}

                        {cust.tags?.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-[#3A1A16]/8 bg-[#F3E9DC]/45 px-2 py-1 text-[8px] font-semibold text-[#665650] sm:px-2.5 sm:text-[9px]"
                          >
                            #{tag}
                          </span>
                        ))}

                        {(cust.tags?.length || 0) > 3 && (
                          <span className="rounded-full bg-[#FDFBF7] px-2 py-1 text-[8px] font-semibold text-[#88756E] sm:text-[9px]">
                            +{(cust.tags?.length || 0) - 3}
                          </span>
                        )}
                      </div>

                      {cust.notes ? (
                        <p className="mt-3 line-clamp-2 rounded-xl border border-[#3A1A16]/6 bg-[#FDFBF7] px-3 py-2 text-[10px] italic leading-4 text-[#88756E] sm:mt-4 sm:text-[11px] sm:leading-5">
                          “{cust.notes}”
                        </p>
                      ) : (
                        <div className="mt-3 h-[37px] rounded-xl border border-dashed border-[#3A1A16]/8 bg-[#FDFBF7]/60 sm:mt-4 sm:h-[43px]" />
                      )}

                      <div className="mt-3 flex items-end justify-between gap-2 border-t border-[#3A1A16]/8 pt-3 sm:mt-4 sm:pt-4">
                        <div className="min-w-0">
                          <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#88756E] sm:text-[9px] sm:tracking-[0.12em]">
                            Visits
                          </p>

                          <p className="mt-1 font-display text-base font-semibold text-[#3A1A16] sm:text-lg">
                            {stats?.completedOrders || 0}
                          </p>
                        </div>

                        <div className="min-w-0 text-right">
                          <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#88756E] sm:text-[9px] sm:tracking-[0.12em]">
                            Total Spend
                          </p>

                          <p className="mt-1 truncate font-display text-base font-semibold text-[#3A1A16] sm:text-lg">
                            {formatCurrency(
                              stats?.totalSpent || 0
                            )}
                          </p>
                        </div>

                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#F3E9DC] text-[#3A1A16] transition group-hover:bg-[#C93E2B] group-hover:text-white sm:h-8 sm:w-8">
                          <ArrowRight size={13} />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* =====================================================
          CUSTOMER DRAWER
      ===================================================== */}

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-[#21100d]/45 backdrop-blur-[3px]">
          <button
            aria-label="Close customer profile"
            onClick={() => setSelectedCustomer(null)}
            className="absolute inset-0 h-full w-full cursor-default"
          />

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-[560px] flex-col overflow-hidden border-l border-[#3A1A16]/10 bg-[#FDFBF7] shadow-2xl">
            {/* Drawer Header */}

            <div className="shrink-0 border-b border-[#3A1A16]/10 bg-white">
              <div className="px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="flex min-w-0 items-center gap-2.5 sm:gap-3.5">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#3A1A16] font-display text-base font-bold text-white shadow-sm sm:h-14 sm:w-14 sm:rounded-2xl sm:text-lg">
                      {initials(selectedCustomer.name)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h2 className="min-w-0 truncate font-display text-xl font-semibold text-[#3A1A16] sm:text-2xl">
                          {selectedCustomer.name}
                        </h2>

                        {customerStatsMap.get(
                          selectedCustomer.id
                        )?.isRegular && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-amber-800">
                            <Award size={10} />
                            Regular
                          </span>
                        )}
                      </div>

                      <p className="mt-1 flex items-center gap-1.5 text-[9px] text-[#88756E] sm:text-[10px]">
                        <Calendar size={11} />
                        Member since{" "}
                        {new Date(
                          selectedCustomer.created_at
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F3E9DC]/60 text-[#665650] transition hover:bg-[#F3E9DC] hover:text-[#3A1A16]"
                  >
                    <X size={17} />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:mt-5">
                  <a
                    href={`tel:${selectedCustomer.phone}`}
                    className="flex min-w-0 items-center gap-2 rounded-xl border border-[#3A1A16]/8 bg-[#FDFBF7] px-3 py-2.5 text-[11px] font-medium text-[#3A1A16] transition hover:border-[#C93E2B]/20 hover:bg-[#F3E9DC]/50"
                  >
                    <Phone
                      size={13}
                      className="shrink-0 text-[#C93E2B]"
                    />
                    <span className="truncate">
                      {selectedCustomer.phone}
                    </span>
                  </a>

                  <a
                    href={
                      selectedCustomer.email
                        ? `mailto:${selectedCustomer.email}`
                        : "#"
                    }
                    onClick={(e) => {
                      if (!selectedCustomer.email) {
                        e.preventDefault();
                      }
                    }}
                    className={`flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-medium transition ${
                      selectedCustomer.email
                        ? "border-[#3A1A16]/8 bg-[#FDFBF7] text-[#3A1A16] hover:border-[#C93E2B]/20 hover:bg-[#F3E9DC]/50"
                        : "border-dashed border-[#3A1A16]/8 bg-[#FDFBF7] text-[#88756E]"
                    }`}
                  >
                    <Mail
                      size={13}
                      className="shrink-0 text-[#C93E2B]"
                    />
                    <span className="truncate">
                      {selectedCustomer.email ||
                        "No email registered"}
                    </span>
                  </a>
                </div>

                {selectedCustomer.address && (
                  <div className="mt-2 flex min-w-0 items-start gap-2 rounded-xl border border-[#3A1A16]/8 bg-[#FDFBF7] px-3 py-2.5 text-[11px] leading-5 text-[#665650]">
                    <MapPin
                      size={13}
                      className="mt-0.5 shrink-0 text-[#C93E2B]"
                    />
                    <span className="min-w-0 break-words">
                      {selectedCustomer.address}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Body */}

            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="space-y-3.5 p-4 sm:space-y-4 sm:p-6">
                {/* Profile Summary */}

                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  <div className="rounded-xl border border-[#3A1A16]/8 bg-white p-2.5 sm:p-3">
                    <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#88756E] sm:text-[9px]">
                      Orders
                    </p>

                    <p className="mt-1 font-display text-xl font-semibold text-[#3A1A16]">
                      {customerStatsMap.get(
                        selectedCustomer.id
                      )?.totalOrders || 0}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#3A1A16]/8 bg-white p-2.5 sm:p-3">
                    <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#88756E] sm:text-[9px]">
                      Visits
                    </p>

                    <p className="mt-1 font-display text-xl font-semibold text-[#3A1A16]">
                      {customerStatsMap.get(
                        selectedCustomer.id
                      )?.completedOrders || 0}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#3A1A16]/8 bg-white p-2.5 sm:p-3">
                    <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#88756E] sm:text-[9px]">
                      Spend
                    </p>

                    <p className="mt-1 truncate font-display text-xl font-semibold text-[#3A1A16]">
                      {formatCurrency(
                        customerStatsMap.get(
                          selectedCustomer.id
                        )?.totalSpent || 0
                      )}
                    </p>
                  </div>
                </div>

                {/* Loyalty */}

                <section className="overflow-hidden rounded-2xl border border-[#3A1A16]/10 bg-[#3A1A16]">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-[#F3E9DC]">
                          <Sparkles size={18} />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">
                            Loyalty Rewards
                          </p>

                          <p className="mt-0.5 truncate text-xs font-medium text-white">
                            Guest reward balance
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="font-display text-3xl font-semibold text-white">
                          {selectedCustomer.loyalty_points ||
                            0}
                        </p>

                        <p className="text-[9px] font-bold uppercase tracking-widest text-[#C93E2B]">
                          Points
                        </p>
                      </div>
                    </div>

                    <form
                      onSubmit={handleAdjustPoints}
                      className="mt-4 flex flex-col gap-2 min-[420px]:flex-row"
                    >
                      <input
                        type="number"
                        value={pointDeltaInput}
                        onChange={(e) =>
                          setPointDeltaInput(
                            e.target.value
                          )
                        }
                        placeholder="Adjustment e.g. +10 or -5"
                        className="h-9 min-w-0 flex-1 rounded-lg border border-white/10 bg-white/8 px-3 text-xs text-white outline-none placeholder:text-white/30 focus:border-white/25"
                      />

                      <button
                        type="submit"
                        disabled={
                          isUpdatingPoints ||
                          !pointDeltaInput.trim()
                        }
                        className="h-9 shrink-0 rounded-lg bg-[#C93E2B] px-4 text-[11px] font-bold text-white transition hover:bg-[#AD3424] disabled:opacity-50"
                      >
                        {isUpdatingPoints
                          ? "Saving..."
                          : "Adjust"}
                      </button>
                    </form>
                  </div>
                </section>

                {/* Notes */}

                <section className="rounded-2xl border border-[#3A1A16]/10 bg-white p-4 sm:p-5">
                  <div className="flex items-center justify-between border-b border-[#3A1A16]/8 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#C93E2B]/8 text-[#C93E2B]">
                        <Edit3 size={13} />
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#88756E]">
                          Guest Profile
                        </p>

                        <h4 className="font-display text-base font-semibold text-[#3A1A16]">
                          Notes & Preferences
                        </h4>
                      </div>
                    </div>

                    {notesSuccess && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 size={12} />
                        Saved
                      </span>
                    )}
                  </div>

                  <textarea
                    rows={4}
                    value={notesInput}
                    onChange={(e) =>
                      setNotesInput(e.target.value)
                    }
                    placeholder="Add preferences, allergies, seating requests, celebrations..."
                    className="mt-4 w-full resize-none rounded-xl border border-[#3A1A16]/10 bg-[#FDFBF7] p-3 text-xs leading-5 text-[#3A1A16] outline-none placeholder:text-[#88756E] focus:border-[#C93E2B]/40 focus:bg-white focus:ring-4 focus:ring-[#C93E2B]/5"
                  />

                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={handleSaveNotes}
                      disabled={isSavingNotes}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#3A1A16] px-4 py-2 text-[11px] font-bold text-white transition hover:bg-[#C93E2B] disabled:opacity-50"
                    >
                      <Save size={13} />
                      {isSavingNotes
                        ? "Saving..."
                        : "Save Notes"}
                    </button>
                  </div>
                </section>

                {/* Tags */}

                <section className="rounded-2xl border border-[#3A1A16]/10 bg-white p-4 sm:p-5">
                  <div className="flex items-center gap-2 border-b border-[#3A1A16]/8 pb-3">
                    <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#F3E9DC] text-[#3A1A16]">
                      <Tag size={13} />
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#88756E]">
                        Segmentation
                      </p>

                      <h4 className="font-display text-base font-semibold text-[#3A1A16]">
                        Tags & Guest Flags
                      </h4>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {(selectedCustomer.tags || []).length ===
                    0 ? (
                      <p className="text-xs italic text-[#88756E]">
                        No tags assigned.
                      </p>
                    ) : (
                      selectedCustomer.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-full border border-[#C93E2B]/15 bg-[#C93E2B]/7 px-2.5 py-1 text-[10px] font-bold text-[#C93E2B]"
                        >
                          #{tag}

                          <button
                            onClick={() =>
                              handleToggleTag(tag)
                            }
                            disabled={isUpdatingTags}
                            className="ml-0.5 rounded-full transition hover:bg-[#C93E2B]/10 hover:text-red-700"
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  <div className="mt-4">
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#88756E]">
                      Suggested Tags
                    </p>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {PRESET_TAGS.filter(
                        (tag) =>
                          !selectedCustomer.tags?.includes(tag)
                      ).map((tag) => (
                        <button
                          key={tag}
                          onClick={() =>
                            handleToggleTag(tag)
                          }
                          disabled={isUpdatingTags}
                          className="rounded-lg border border-dashed border-[#3A1A16]/15 bg-[#FDFBF7] px-2.5 py-1 text-[10px] font-semibold text-[#665650] transition hover:border-[#C93E2B]/30 hover:bg-[#F3E9DC] hover:text-[#3A1A16] disabled:opacity-50"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <form
                    onSubmit={handleAddCustomTag}
                    className="mt-4 flex flex-col gap-2 min-[420px]:flex-row"
                  >
                    <input
                      type="text"
                      value={customTagInput}
                      onChange={(e) =>
                        setCustomTagInput(
                          e.target.value
                        )
                      }
                      placeholder="Create custom tag..."
                      className="h-9 min-w-0 flex-1 rounded-lg border border-[#3A1A16]/10 bg-[#FDFBF7] px-3 text-xs text-[#3A1A16] outline-none placeholder:text-[#88756E] focus:border-[#C93E2B]/40 focus:bg-white"
                    />

                    <button
                      type="submit"
                      disabled={
                        isUpdatingTags ||
                        !customTagInput.trim()
                      }
                      className="h-9 shrink-0 rounded-lg border border-[#3A1A16]/12 bg-white px-4 text-[11px] font-bold text-[#3A1A16] transition hover:bg-[#F3E9DC] disabled:opacity-50"
                    >
                      Add
                    </button>
                  </form>
                </section>

                {/* Order History */}

                <section className="rounded-2xl border border-[#3A1A16]/10 bg-white p-4 sm:p-5">
                  <div className="flex flex-col gap-2 border-b border-[#3A1A16]/8 pb-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                    <div className="flex items-center gap-2">
                      <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#F3E9DC] text-[#3A1A16]">
                        <ShoppingBag size={13} />
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#88756E]">
                          Guest Activity
                        </p>

                        <h4 className="font-display text-base font-semibold text-[#3A1A16]">
                          Order History
                        </h4>
                      </div>
                    </div>

                    <span className="w-fit rounded-full bg-[#F3E9DC] px-2.5 py-1 text-[9px] font-bold text-[#3A1A16]">
                      {customerOrders.length}{" "}
                      {customerOrders.length === 1
                        ? "ORDER"
                        : "ORDERS"}
                    </span>
                  </div>

                  <div className="mt-4">
                    {loadingCustomerOrders ? (
                      <div className="py-10 text-center">
                        <RefreshCw
                          size={19}
                          className="mx-auto animate-spin text-[#C93E2B]"
                        />

                        <p className="mt-3 text-xs font-medium text-[#665650]">
                          Matching order history...
                        </p>
                      </div>
                    ) : customerOrders.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-[#3A1A16]/10 bg-[#FDFBF7] px-5 py-9 text-center">
                        <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[#F3E9DC] text-[#88756E]">
                          <Utensils size={19} />
                        </div>

                        <p className="mt-3 font-display text-lg font-semibold text-[#3A1A16]">
                          No order history
                        </p>

                        <p className="mx-auto mt-1 max-w-xs text-[10px] leading-5 text-[#88756E]">
                          Orders placed using this guest's
                          phone number will appear here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {customerOrders.map((order) => {
                          const statusClasses: Record<
                            string,
                            string
                          > = {
                            completed:
                              "border-emerald-200 bg-emerald-50 text-emerald-800",
                            open: "border-blue-200 bg-blue-50 text-blue-800",
                            held: "border-amber-200 bg-amber-50 text-amber-800",
                            cancelled:
                              "border-red-200 bg-red-50 text-red-800",
                          };

                          return (
                            <div
                              key={order.id}
                              className="rounded-xl border border-[#3A1A16]/8 bg-[#FDFBF7] p-3.5"
                            >
                              <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-mono text-[11px] font-bold text-[#3A1A16]">
                                      #{order.orderNumber}
                                    </span>

                                    <span
                                      className={`rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] ${
                                        statusClasses[
                                          order.status
                                        ] ||
                                        "border-gray-200 bg-gray-50 text-gray-700"
                                      }`}
                                    >
                                      {order.status}
                                    </span>

                                    <span className="rounded-md bg-[#F3E9DC] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#665650]">
                                      {order.details.type}
                                    </span>
                                  </div>

                                  <p className="mt-1.5 flex items-center gap-1 text-[9px] text-[#88756E]">
                                    <Clock size={10} />
                                    <span className="break-words">
                                      {new Date(
                                        order.createdAt
                                      ).toLocaleString()}
                                    </span>
                                  </p>
                                </div>

                                <div className="shrink-0 text-left min-[420px]:text-right">
                                  <p className="font-display text-base font-semibold text-[#3A1A16]">
                                    {formatCurrency(
                                      order.totals
                                        ?.grandTotal || 0
                                    )}
                                  </p>

                                  <p className="mt-0.5 text-[9px] text-[#88756E]">
                                    {order.paymentMethod ||
                                      "Unpaid"}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-[#3A1A16]/7 pt-3">
                                {order.items.map((item) => (
                                  <span
                                    key={item.id}
                                    className="text-[10px] text-[#665650]"
                                  >
                                    <strong className="text-[#3A1A16]">
                                      {item.quantity}×
                                    </strong>{" "}
                                    {item.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* =====================================================
          ADD CUSTOMER MODAL
      ===================================================== */}

      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#21100d]/50 p-2 backdrop-blur-[3px] sm:items-center sm:p-4">
          <div className="relative flex max-h-[94dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#3A1A16]/10 bg-[#FDFBF7] shadow-2xl sm:max-h-[92vh]">
            <div className="shrink-0 border-b border-[#3A1A16]/10 bg-white px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#C93E2B]/8 text-[#C93E2B]">
                    <User size={17} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#88756E]">
                      Guest management
                    </p>

                    <h3 className="truncate font-display text-xl font-semibold text-[#3A1A16]">
                      Add Guest Profile
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setShowAddModal(false)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F3E9DC]/60 text-[#665650] transition hover:bg-[#F3E9DC] hover:text-[#3A1A16]"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
              {addCustomerError && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircle
                    size={15}
                    className="mt-0.5 shrink-0"
                  />
                  <span>{addCustomerError}</span>
                </div>
              )}

              <form
                onSubmit={handleCreateCustomer}
                className="space-y-4"
              >
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#665650]">
                    Full Name{" "}
                    <span className="text-[#C93E2B]">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    required
                    value={newCustomer.name}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g. Vikram Singh"
                    className="h-10 w-full rounded-xl border border-[#3A1A16]/10 bg-white px-3 text-xs text-[#3A1A16] outline-none placeholder:text-[#88756E] focus:border-[#C93E2B]/40 focus:ring-4 focus:ring-[#C93E2B]/5"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#665650]">
                      Phone Number{" "}
                      <span className="text-[#C93E2B]">
                        *
                      </span>
                    </label>

                    <input
                      type="tel"
                      required
                      value={newCustomer.phone}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          phone: e.target.value,
                        })
                      }
                      placeholder="e.g. 9811122233"
                      className="h-10 w-full rounded-xl border border-[#3A1A16]/10 bg-white px-3 text-xs text-[#3A1A16] outline-none placeholder:text-[#88756E] focus:border-[#C93E2B]/40 focus:ring-4 focus:ring-[#C93E2B]/5"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#665650]">
                      Email Address
                    </label>

                    <input
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          email: e.target.value,
                        })
                      }
                      placeholder="Optional"
                      className="h-10 w-full rounded-xl border border-[#3A1A16]/10 bg-white px-3 text-xs text-[#3A1A16] outline-none placeholder:text-[#88756E] focus:border-[#C93E2B]/40 focus:ring-4 focus:ring-[#C93E2B]/5"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#665650]">
                    Address
                  </label>

                  <input
                    type="text"
                    value={newCustomer.address}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        address: e.target.value,
                      })
                    }
                    placeholder="Optional delivery / residential address"
                    className="h-10 w-full rounded-xl border border-[#3A1A16]/10 bg-white px-3 text-xs text-[#3A1A16] outline-none placeholder:text-[#88756E] focus:border-[#C93E2B]/40 focus:ring-4 focus:ring-[#C93E2B]/5"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#665650]">
                    Dining Notes & Preferences
                  </label>

                  <textarea
                    rows={3}
                    value={newCustomer.notes}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Allergies, seating preferences, celebrations..."
                    className="w-full resize-none rounded-xl border border-[#3A1A16]/10 bg-white p-3 text-xs leading-5 text-[#3A1A16] outline-none placeholder:text-[#88756E] focus:border-[#C93E2B]/40 focus:ring-4 focus:ring-[#C93E2B]/5"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#665650]">
                      Initial Loyalty Points
                    </label>

                    <input
                      type="number"
                      min={0}
                      value={newCustomer.loyalty_points}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          loyalty_points: Math.max(
                            0,
                            parseInt(
                              e.target.value,
                              10
                            ) || 0
                          ),
                        })
                      }
                      className="h-10 w-full rounded-xl border border-[#3A1A16]/10 bg-white px-3 text-xs text-[#3A1A16] outline-none focus:border-[#C93E2B]/40 focus:ring-4 focus:ring-[#C93E2B]/5"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#665650]">
                      Initial Tags
                    </label>

                    <div className="flex min-h-10 flex-wrap content-start gap-1.5 rounded-xl border border-[#3A1A16]/10 bg-white p-2">
                      {[
                        "VIP",
                        "Vegetarian",
                        "Family",
                      ].map((tag) => {
                        const active =
                          newCustomer.tags.includes(tag);

                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setNewCustomer({
                                ...newCustomer,
                                tags: active
                                  ? newCustomer.tags.filter(
                                      (item) =>
                                        item !== tag
                                    )
                                  : [
                                      ...newCustomer.tags,
                                      tag,
                                    ],
                              });
                            }}
                            className={`rounded-full px-2.5 py-1 text-[9px] font-bold transition ${
                              active
                                ? "bg-[#C93E2B] text-white"
                                : "bg-[#F3E9DC] text-[#665650] hover:bg-[#eadbc9]"
                            }`}
                          >
                            #{tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-[#3A1A16]/8 pt-4 min-[420px]:flex-row min-[420px]:justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setShowAddModal(false)
                    }
                    className="h-10 rounded-xl border border-[#3A1A16]/12 bg-white px-4 text-xs font-bold text-[#3A1A16] transition hover:bg-[#F3E9DC]/50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isCreatingCustomer}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#C93E2B] px-5 text-xs font-bold text-white shadow-sm transition hover:bg-[#AD3424] disabled:opacity-50"
                  >
                    {isCreatingCustomer && (
                      <RefreshCw
                        size={13}
                        className="animate-spin"
                      />
                    )}

                    {isCreatingCustomer
                      ? "Creating..."
                      : "Create Guest"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ShortcutsHelpModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={shortcuts}
      />
    </div>
  );
}