
"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowRight,
  Beef,
  CakeSlice,
  CheckCircle2,
  ChefHat,
  Coffee,
  Cookie,
  Croissant,
  Drumstick,
  Egg,
  Flame,
  GlassWater,
  IceCream,
  Mail,
  MapPin,
  Minus,
  PackageCheck,
  Phone,
  Pizza,
  Plus,
  RefreshCw,
  Salad,
  Sandwich,
  Search,
  ShoppingBag,
  Soup,
  Sparkles,
  Trash2,
  User,
  Utensils,
  UtensilsCrossed,
} from "lucide-react";

import { calculateBill, formatCurrency } from "@/lib/billing/calculateBill";

import type {
  CartItem,
  CustomersResponse,
  MenuCategory,
  MenuItem,
  MenuResponse,
  OrderResponse,
  OrderStatus,
  PosOrder,
} from "@/types/pos";

import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { ShortcutsHelpModal } from "@/components/shared/ShortcutsHelpModal";

type ActiveTab = "menu" | "checkout" | "confirmation" | "track";

type OrderTypeOption = "Takeaway" | "Delivery";

interface CustomerFormState {
  name: string;
  phone: string;
  email: string;
  address: string;
}

const initialForm: CustomerFormState = {
  name: "",
  phone: "",
  email: "",
  address: "",
};

const categoryTheme: Record<
  string,
  {
    bg: string;
    iconBg: string;
    iconColor: string;
  }
> = {
  Indian: {
    bg: "#FBEFE4",
    iconBg: "#F3D9BE",
    iconColor: "#B5541A",
  },

  Biryani: {
    bg: "#FDF0E2",
    iconBg: "#F4D9AE",
    iconColor: "#A85A15",
  },

  Chinese: {
    bg: "#FBECEC",
    iconBg: "#F3CFCF",
    iconColor: "#C0392B",
  },

  "Fast Food": {
    bg: "#FDF3E0",
    iconBg: "#F6DFA8",
    iconColor: "#B4780A",
  },

  Starters: {
    bg: "#F1F1E8",
    iconBg: "#D9DABC",
    iconColor: "#6B7A2E",
  },

  "South Indian": {
    bg: "#FDF3E5",
    iconBg: "#F4DCAF",
    iconColor: "#B06A16",
  },

  "Naan & Roti": {
    bg: "#F7EEE2",
    iconBg: "#E8D2B4",
    iconColor: "#8A5A2B",
  },

  Rice: {
    bg: "#F4F1E6",
    iconBg: "#E1DAB9",
    iconColor: "#7A6E2E",
  },

  Breakfast: {
    bg: "#FDF0E9",
    iconBg: "#F5D8C4",
    iconColor: "#B25E2C",
  },

  Combos: {
    bg: "#F2ECF7",
    iconBg: "#DCCBEC",
    iconColor: "#6E3F9E",
  },

  Drinks: {
    bg: "#E9F2F6",
    iconBg: "#C7E0EA",
    iconColor: "#1E7A9E",
  },

  Desserts: {
    bg: "#FBEAF0",
    iconBg: "#F4C9DA",
    iconColor: "#C0397D",
  },
};

const defaultTheme = {
  bg: "#F3E9DC",
  iconBg: "#E4D4C0",
  iconColor: "#7A3026",
};

function getCategoryTheme(category: string) {
  return categoryTheme[category] ?? defaultTheme;
}

function getItemEmoji(item: MenuItem) {
  const text = `${item.name} ${item.category}`.toLowerCase();

  if (text.includes("pizza")) return "🍕";
  if (text.includes("burger")) return "🍔";
  if (text.includes("fries")) return "🍟";
  if (text.includes("sandwich")) return "🥪";
  if (text.includes("wrap") || text.includes("roll")) return "🌯";
  if (text.includes("paneer tikka")) return "🍢";
  if (text.includes("crispy corn")) return "🌽";
  if (text.includes("butter chicken")) return "🍛";
  if (text.includes("dal")) return "🍲";
  if (text.includes("chai")) return "☕";
  if (text.includes("coke")) return "🥤";
  if (text.includes("gulab")) return "🍮";
  if (text.includes("chicken")) return "🍗";

  return "🍽️";
}

function getItemIcon(item: MenuItem) {
  const text = `${item.name} ${item.category}`.toLowerCase();

  if (text.includes("pizza")) {
    return Pizza;
  }

  if (text.includes("burger") || text.includes("patty")) {
    return Beef;
  }

  if (
    text.includes("noodle") ||
    text.includes("fried rice") ||
    text.includes("manchurian") ||
    text.includes("momos") ||
    text.includes("chilli")
  ) {
    return Soup;
  }

  if (
    text.includes("chicken") ||
    text.includes("mutton") ||
    text.includes("fish") ||
    text.includes("kebab") ||
    text.includes("tandoori")
  ) {
    return Drumstick;
  }

  if (
    text.includes("coffee") ||
    text.includes("cappuccino") ||
    text.includes("chai") ||
    text.includes("tea")
  ) {
    return Coffee;
  }

  if (
    text.includes("dosa") ||
    text.includes("idli") ||
    text.includes("vada") ||
    text.includes("uttapam")
  ) {
    return Egg;
  }

  if (
    text.includes("naan") ||
    text.includes("roti") ||
    text.includes("paratha")
  ) {
    return Croissant;
  }

  if (
    text.includes("sandwich") ||
    text.includes("wrap") ||
    text.includes("roll")
  ) {
    return Sandwich;
  }

  if (
    text.includes("dessert") ||
    text.includes("cake") ||
    text.includes("brownie") ||
    text.includes("gulab") ||
    text.includes("rasmalai") ||
    text.includes("kulfi") ||
    text.includes("halwa")
  ) {
    return CakeSlice;
  }

  if (text.includes("ice cream") || text.includes("gelato")) {
    return IceCream;
  }

  if (
    text.includes("drink") ||
    text.includes("juice") ||
    text.includes("coke") ||
    text.includes("sprite") ||
    text.includes("shake") ||
    text.includes("mojito") ||
    text.includes("lassi") ||
    text.includes("soda")
  ) {
    return GlassWater;
  }

  if (
    text.includes("cookie") ||
    text.includes("biscuit") ||
    text.includes("pastry")
  ) {
    return Cookie;
  }

  if (
    text.includes("fries") ||
    text.includes("starter") ||
    text.includes("snack")
  ) {
    return Flame;
  }

  if (text.includes("salad") || text.includes("vegetable")) {
    return Salad;
  }

  return UtensilsCrossed;
}

export function OnlineOrderingApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => "menu");
  const currentActiveTab: ActiveTab = activeTab;

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] =
    useState<OrderTypeOption>("Takeaway");

  const [customerForm, setCustomerForm] =
    useState<CustomerFormState>(initialForm);

  const [formErrors, setFormErrors] = useState<{
    [key: string]: string;
  }>({});

  const [loadingMenu, setLoadingMenu] = useState(true);
  const [menuError, setMenuError] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [lastPlacedOrder, setLastPlacedOrder] =
    useState<PosOrder | null>(null);

  const [showShortcuts, setShowShortcuts] = useState(false);

  const menuSearchRef = useRef<HTMLInputElement>(null);

  const [trackQuery, setTrackQuery] = useState("");
  const [trackedOrder, setTrackedOrder] =
    useState<PosOrder | null>(null);

  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  const [simulatingFulfillment, setSimulatingFulfillment] =
    useState(false);

  const fetchMenu = useCallback(async () => {
    setLoadingMenu(true);
    setMenuError("");

    try {
      const res = await fetch("/api/menu");

      if (!res.ok) {
        throw new Error("Failed to load menu. Please try again.");
      }

      const data = (await res.json()) as MenuResponse;

      setMenuItems(data.items || []);
      setCategories(data.categories || []);
    } catch (err) {
      setMenuError(
        err instanceof Error
          ? err.message
          : "Failed to load restaurant menu.",
      );
    } finally {
      setLoadingMenu(false);
    }
  }, []);

  useEffect(() => {
    void fetchMenu();
  }, [fetchMenu]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" ||
        item.category === selectedCategory;

      const q = searchQuery.trim().toLowerCase();

      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const bill = useMemo(() => {
    return calculateBill(
      cart.map((item) => ({
        price: item.price,
        quantity: item.quantity,
      })),
      {
        kind: "percent",
        value: 0,
      },
      5,
      false,
      0,
    );
  }, [cart]);

  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find(
        (entry) => entry.id === item.id,
      );

      if (existing) {
        return prev.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                quantity: entry.quantity + 1,
              }
            : entry,
        );
      }

      return [
        ...prev,
        {
          ...item,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.flatMap((entry) => {
        if (entry.id !== id) {
          return [entry];
        }

        const newQty = entry.quantity + delta;

        return newQty > 0
          ? [
              {
                ...entry,
                quantity: newQty,
              },
            ]
          : [];
      }),
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) =>
      prev.filter((item) => item.id !== id),
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const validateForm = () => {
    const errors: {
      [key: string]: string;
    } = {};

    if (!customerForm.name.trim()) {
      errors.name = "Please enter your full name.";
    }

    const cleanPhone = customerForm.phone.trim();

    if (!cleanPhone) {
      errors.phone =
        "Phone number is required for order updates.";
    } else if (
      cleanPhone.replace(/\D/g, "").length < 10
    ) {
      errors.phone =
        "Please enter a valid 10-digit phone number.";
    }

    if (
      orderType === "Delivery" &&
      !customerForm.address.trim()
    ) {
      errors.address =
        "Delivery address is required for doorstep delivery.";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async (
    e?: React.FormEvent,
  ) => {
    e?.preventDefault();

    if (!cart.length) {
      setSubmitError(
        "Your cart is empty. Please add items to proceed.",
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    setSubmittingOrder(true);
    setSubmitError("");

    try {
      const cleanPhone = customerForm.phone.trim();
      const cleanName = customerForm.name.trim();
      const cleanEmail =
        customerForm.email.trim() || undefined;
      const cleanAddress =
        customerForm.address.trim() || undefined;

      const custLookupRes = await fetch(
        `/api/customers?phone=${encodeURIComponent(
          cleanPhone,
        )}`,
      );

      if (custLookupRes.ok) {
        const custData =
          (await custLookupRes.json()) as CustomersResponse;

        if (
          !custData.customers ||
          custData.customers.length === 0
        ) {
          await fetch("/api/customers", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: cleanName,
              phone: cleanPhone,
              email: cleanEmail,
              address: cleanAddress,
            }),
          });
        }
      }

      const orderPayload = {
        status: "open" as const,
        channel: "online" as const,

        items: cart.map((item) => ({
          id: item.id,
          quantity: item.quantity,
        })),

        details: {
          type: orderType,
          table: "",

          delivery: {
            name: cleanName,
            phone: cleanPhone,

            address:
              orderType === "Delivery"
                ? customerForm.address.trim()
                : "Takeaway / Store Pickup",
          },
        },

        discount: {
          kind: "percent" as const,
          value: 0,
        },

        taxRate: 5,
        serviceEnabled: false,
        serviceRate: 0,
        paymentMethod: "Cash" as const,
        totals: bill,
      };

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      });

      if (!orderRes.ok) {
        const errData = await orderRes
          .json()
          .catch(() => ({
            error: "Failed to place order",
          }));

        throw new Error(
          errData.error || "Unable to complete order.",
        );
      }

      const placedData =
        (await orderRes.json()) as OrderResponse;

      setLastPlacedOrder(placedData.order);
      setCart([]);
      setActiveTab("confirmation");
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Failed to place order. Please try again.",
      );
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleTrackOrder = async (queryId?: string) => {
    const q = (queryId || trackQuery).trim();

    if (!q) {
      setTrackingError(
        "Please enter an order number or ID.",
      );
      return;
    }

    setTrackingLoading(true);
    setTrackingError("");

    try {
      const res = await fetch(
        `/api/orders/${encodeURIComponent(q)}`,
      );

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(
            `Order #${q} was not found. Please check your order number.`,
          );
        }

        throw new Error(
          "Unable to look up order status.",
        );
      }

      const data =
        (await res.json()) as OrderResponse;

      setTrackedOrder(data.order);
    } catch (err) {
      setTrackedOrder(null);

      setTrackingError(
        err instanceof Error
          ? err.message
          : "Failed to fetch order status.",
      );
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleSimulateFulfill = async (id: string) => {
    setSimulatingFulfillment(true);

    try {
      const res = await fetch(
        `/api/orders/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "completed",
          }),
        },
      );

      if (!res.ok) {
        throw new Error(
          "Could not update order status.",
        );
      }

      const data =
        (await res.json()) as OrderResponse;

      setTrackedOrder(data.order);

      if (
        lastPlacedOrder &&
        lastPlacedOrder.id === data.order.id
      ) {
        setLastPlacedOrder(data.order);
      }
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Simulation update failed.",
      );
    } finally {
      setSimulatingFulfillment(false);
    }
  };

  const renderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "open":
        return (
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold leading-4 text-amber-800 sm:px-3 sm:text-xs">
            <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-amber-600" />
            Order Received · Kitchen Preparing
          </span>
        );

      case "completed":
        return (
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold leading-4 text-emerald-800 sm:px-3 sm:text-xs">
            <CheckCircle2
              size={14}
              className="shrink-0 text-emerald-600"
            />
            Ready for Pickup / Delivered
          </span>
        );

      case "held":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[10px] font-semibold text-orange-800 sm:px-3 sm:py-1 sm:text-xs">
            <ClockIcon />
            On Hold
          </span>
        );

      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold text-red-800 sm:px-3 sm:py-1 sm:text-xs">
            <AlertCircle
              size={14}
              className="shrink-0 text-red-600"
            />
            Cancelled
          </span>
        );

      default:
        return null;
    }
  };

  const shortcuts = [
    {
      key: "/",
      handler: () => menuSearchRef.current?.focus(),
      description: "Focus menu search",
    },
    {
      key: "Enter",
      ctrlOrCmd: true,
      handler: () => void handlePlaceOrder(),
      description: "Place order",
    },
    {
      key: "?",
      handler: () => setShowShortcuts(true),
      description: "Show keyboard shortcuts",
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return (
    <div className="flex h-screen min-h-0 w-full flex-col overflow-hidden bg-[#F3E9DC] px-2.5 py-3 font-sans text-[#3A1A16] sm:px-4 sm:py-4 lg:px-6 lg:py-5">
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
        {/* =========================
            MENU
        ========================== */}

        {activeTab === "menu" && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* SEARCH + CATEGORY */}

            <div className="mb-3 shrink-0 space-y-3 sm:mb-4 sm:space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C93E2B]" />

                    <p className="text-[9px] font-semibold uppercase tracking-[.22em] text-[#C93E2B] sm:text-[10px]">
                      Our Menu
                    </p>
                  </div>

                  <h2 className="mt-1 truncate font-display text-xl font-medium text-[#3A1A16] sm:text-2xl">
                    Choose your favourites
                  </h2>
                </div>

                {/* NAVIGATION */}

                <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("menu")}
                    className={`inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[10px] font-semibold transition sm:gap-2 sm:px-4 sm:text-xs ${
                      activeTab === "menu"
                        ? "bg-[#3A1A16] text-[#F3E9DC] shadow-sm"
                        : "border border-[#3A1A16]/10 bg-[#FFFCF9] text-[#665650] hover:bg-white"
                    }`}
                  >
                    <Utensils size={14} className="shrink-0 sm:size-[15px]" />
                    <span className="truncate">Menu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("checkout")}
                    className={`relative inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[10px] font-semibold transition sm:gap-2 sm:px-4 sm:text-xs ${
                      currentActiveTab === "checkout"
                        ? "bg-[#3A1A16] text-[#F3E9DC] shadow-sm"
                        : "border border-[#3A1A16]/10 bg-[#FFFCF9] text-[#665650] hover:bg-white"
                    }`}
                  >
                    <ShoppingBag
                      size={14}
                      className="shrink-0 sm:size-[15px]"
                    />

                    <span className="truncate">
                      Cart & Checkout
                    </span>

                    {totalCartCount > 0 && (
                      <span className="grid h-4 min-w-4 shrink-0 place-items-center rounded-full bg-[#C93E2B] px-1 text-[9px] font-bold text-white sm:h-5 sm:min-w-5 sm:text-[10px]">
                        {totalCartCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("track")}
                    className={`inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[10px] font-semibold transition sm:gap-2 sm:px-4 sm:text-xs ${
                      currentActiveTab === "track"
                        ? "bg-[#3A1A16] text-[#F3E9DC] shadow-sm"
                        : "border border-[#3A1A16]/10 bg-[#FFFCF9] text-[#665650] hover:bg-white"
                    }`}
                  >
                    <ClockIcon />
                    <span className="truncate">Track Order</span>
                  </button>
                </div>
              </div>

              {/* SEARCH */}

              <label className="relative block">
                <Search
                  size={16}
                  strokeWidth={1.8}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8D7C74]"
                />

                <input
                  ref={menuSearchRef}
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(e.target.value)
                  }
                  placeholder="Search menu items..."
                  className="w-full rounded-xl border border-[#3A1A16]/12 bg-[#FFFCF9] py-3 pl-10 pr-4 text-sm text-[#3A1A16] outline-none transition placeholder:text-[#9A8982] hover:border-[#3A1A16]/20 focus:border-[#C93E2B] focus:ring-2 focus:ring-[#C93E2B]/8"
                />
              </label>

              {/* CATEGORIES */}

              <div className="overflow-x-auto px-0.5 pb-1 scrollbar-none">
                <div className="flex w-max gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedCategory("All")
                    }
                    className={`whitespace-nowrap rounded-full px-3 py-2 text-[10px] font-semibold transition active:scale-[.97] sm:px-3.5 sm:text-[11px] ${
                      selectedCategory === "All"
                        ? "bg-[#3A1A16] text-[#F3E9DC] shadow-sm"
                        : "border border-[#3A1A16]/10 bg-[#FFFCF9] text-[#665650] hover:border-[#3A1A16]/20 hover:bg-white"
                    }`}
                  >
                    All Items
                  </button>

                  {categories.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() =>
                        setSelectedCategory(tab)
                      }
                      className={`whitespace-nowrap rounded-full px-3 py-2 text-[10px] font-semibold transition active:scale-[.97] sm:px-3.5 sm:text-[11px] ${
                        selectedCategory === tab
                          ? "bg-[#3A1A16] text-[#F3E9DC] shadow-sm"
                          : "border border-[#3A1A16]/10 bg-[#FFFCF9] text-[#665650] hover:border-[#3A1A16]/20 hover:bg-white"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ONLY MENU CARDS SCROLL */}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-0.5 pb-1 pt-1 scrollbar-none">
              {/* LOADING */}

              {loadingMenu && (
                <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[20px] border border-[#3A1A16]/10 bg-[#FFFCF9] sm:min-h-[320px] sm:rounded-[22px]">
                  <RefreshCw
                    size={24}
                    className="animate-spin text-[#C93E2B]"
                  />

                  <p className="mt-3 text-xs text-[#665650]">
                    Loading restaurant menu...
                  </p>
                </div>
              )}

              {/* ERROR */}

              {!loadingMenu && menuError && (
                <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[20px] border border-red-200 bg-[#FFFCF9] p-5 text-center sm:min-h-[320px] sm:rounded-[22px] sm:p-8">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-red-50 text-red-600 sm:h-12 sm:w-12">
                    <AlertCircle size={20} />
                  </div>

                  <h2 className="mt-4 font-display text-xl text-[#3A1A16] sm:text-2xl">
                    Unable to load menu
                  </h2>

                  <p className="mt-1 max-w-sm text-xs text-[#665650]">
                    {menuError}
                  </p>

                  <button
                    type="button"
                    onClick={() => void fetchMenu()}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#3A1A16] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#C93E2B]"
                  >
                    <RefreshCw size={14} />
                    Try Again
                  </button>
                </div>
              )}

              {/* EMPTY */}

              {!loadingMenu &&
                !menuError &&
                filteredItems.length === 0 && (
                  <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[20px] border border-dashed border-[#3A1A16]/15 bg-[#FFFCF9] p-5 text-center sm:min-h-[300px] sm:rounded-[22px] sm:p-8">
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-[#F3E9DC] text-[#C93E2B] sm:h-12 sm:w-12">
                      <Search size={18} />
                    </div>

                    <h2 className="mt-4 font-display text-xl text-[#3A1A16] sm:text-2xl">
                      No menu items found
                    </h2>

                    <p className="mt-1 max-w-xs text-xs leading-5 text-[#76655F]">
                      Try another search term or choose a
                      different category.
                    </p>
                  </div>
                )}

              {/* MENU GRID */}

              {!loadingMenu &&
                !menuError &&
                filteredItems.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-2.5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                    {filteredItems.map((item) => {
                      const Icon = getItemIcon(item);
                      const emoji = getItemEmoji(item);
                      const theme = getCategoryTheme(
                        item.category,
                      );

                      const inCart = cart.find(
                        (cartItem) =>
                          cartItem.id === item.id,
                      );

                      return (
                        <article
                          key={item.id}
                          className="group relative flex min-w-0 flex-col overflow-hidden rounded-[13px] border border-[#3A1A16]/10 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C93E2B]/25 hover:shadow-[0_10px_24px_rgba(58,26,22,0.10)] sm:rounded-[14px]"
                        >
                          <div
                            className="relative flex h-14 w-full shrink-0 items-center justify-center overflow-hidden sm:h-16"
                            style={{
                              backgroundColor: theme.bg,
                            }}
                          >
                            <Icon
                              size={115}
                              strokeWidth={1}
                              style={{
                                color: theme.iconColor,
                              }}
                              className="hidden"
                            />

                            <div className="relative z-10 grid h-8 w-8 place-items-center rounded-lg sm:h-9 sm:w-9">
                              <span
                                role="img"
                                aria-label={item.name}
                                className="text-3xl leading-none sm:text-4xl"
                              >
                                {emoji}
                              </span>
                            </div>
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-2 sm:p-2.5">
                            <div className="min-w-0">
                              <h2 className="truncate font-display text-[14px] font-medium leading-tight text-[#3A1A16] sm:text-[15px]">
                                {item.name}
                              </h2>
                            </div>

                            <p className="truncate text-[9px] leading-tight text-[#8D7C74] sm:text-[10px]">
                              {item.description}
                            </p>

                            <div className="mt-auto pt-1">
                              <div className="flex min-w-0 items-center justify-between gap-1.5">
                                <span className="shrink-0 font-display text-[13px] font-semibold leading-none text-[#3A1A16] sm:text-sm">
                                  {formatCurrency(item.price)}
                                </span>

                                {inCart ? (
                                  <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-[#FCE4DE] p-0.5 sm:gap-1 sm:p-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateQuantity(
                                          item.id,
                                          -1,
                                        )
                                      }
                                      className="grid h-5 w-5 place-items-center rounded-full bg-white text-[#3A1A16] shadow-sm transition hover:bg-[#F3E9DC] sm:h-6 sm:w-6"
                                      aria-label="Decrease quantity"
                                    >
                                      <Minus size={11} />
                                    </button>

                                    <span className="min-w-[14px] text-center text-[9px] font-bold text-[#3A1A16] sm:min-w-[16px] sm:text-[10px]">
                                      {inCart.quantity}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateQuantity(
                                          item.id,
                                          1,
                                        )
                                      }
                                      className="grid h-5 w-5 place-items-center rounded-full bg-[#C93E2B] text-white transition hover:bg-[#a82d1c] sm:h-6 sm:w-6"
                                      aria-label="Increase quantity"
                                    >
                                      <Plus size={11} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      addToCart(item)
                                    }
                                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#3A1A16] text-[#F3E9DC] shadow-sm transition-all duration-150 hover:bg-[#C93E2B] active:scale-90"
                                    aria-label={`Add ${item.name} to cart`}
                                  >
                                    <Plus size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
            </div>

            {/* FIXED CART BAR */}

            {totalCartCount > 0 && (
              <div className="mt-3 shrink-0 rounded-[18px] border border-white/10 bg-[#3A1A16] p-3.5 text-[#F3E9DC] shadow-[0_18px_50px_rgba(58,26,22,0.25)] sm:mt-4 sm:rounded-[20px] sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#C93E2B] text-white sm:h-10 sm:w-10">
                      <ShoppingBag size={17} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[9px] uppercase tracking-[0.16em] text-[#F3E9DC]/60 sm:text-[10px]">
                        Your order
                      </p>

                      <p className="truncate text-xs font-semibold text-white sm:text-sm">
                        {totalCartCount}{" "}
                        {totalCartCount === 1
                          ? "item"
                          : "items"}{" "}
                        ·{" "}
                        {formatCurrency(
                          bill.grandTotal,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                    <button
                      type="button"
                      onClick={clearCart}
                      className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
                    >
                      Clear
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab("checkout")
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C93E2B] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#a82d1c] sm:px-5"
                    >
                      Checkout
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================
            CHECKOUT
        ========================== */}

        {activeTab === "checkout" && (
          <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 scrollbar-none sm:pr-1">
            <div className="pb-2">
              {cart.length === 0 ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[20px] border border-dashed border-[#3A1A16]/15 bg-[#FFFCF9] p-5 text-center sm:min-h-[350px] sm:rounded-[22px] sm:p-8">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F3E9DC] text-[#C93E2B] sm:h-14 sm:w-14">
                    <ShoppingBag size={22} />
                  </div>

                  <h2 className="mt-4 font-display text-2xl text-[#3A1A16] sm:text-3xl">
                    Your cart is empty
                  </h2>

                  <p className="mt-1 max-w-sm text-xs leading-5 text-[#665650]">
                    Add some dishes from the menu before
                    checking out.
                  </p>

                  <button
                    type="button"
                    onClick={() => setActiveTab("menu")}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#3A1A16] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#C93E2B]"
                  >
                    <Utensils size={14} />
                    Browse Menu
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
                  {/* LEFT CHECKOUT FORM */}

                  <form
                    onSubmit={handlePlaceOrder}
                    className="min-w-0 space-y-4 sm:space-y-5"
                  >
                    {/* ORDER TYPE */}

                    <div className="rounded-[20px] border border-[#3A1A16]/10 bg-[#FFFCF9] p-4 shadow-sm sm:rounded-[22px] sm:p-5">
                      <p className="text-[9px] font-semibold uppercase tracking-[.22em] text-[#C93E2B] sm:text-[10px]">
                        01 · Fulfillment
                      </p>

                      <h2 className="mt-1 font-display text-xl text-[#3A1A16] sm:text-2xl">
                        How would you like your order?
                      </h2>

                      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setOrderType("Takeaway")
                          }
                          className={`rounded-xl border p-3.5 text-left transition sm:p-4 ${
                            orderType === "Takeaway"
                              ? "border-[#C93E2B] bg-[#FCE4DE]"
                              : "border-[#3A1A16]/10 bg-white hover:border-[#3A1A16]/20"
                          }`}
                        >
                          <div className="flex items-center gap-2 text-xs font-semibold text-[#3A1A16] sm:text-sm">
                            <Utensils
                              size={16}
                              className="shrink-0 text-[#C93E2B]"
                            />
                            Takeaway / Pickup
                          </div>

                          <p className="mt-2 text-[10px] leading-5 text-[#665650] sm:text-[11px]">
                            Your order will be packed
                            fresh for counter pickup.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setOrderType("Delivery")
                          }
                          className={`rounded-xl border p-3.5 text-left transition sm:p-4 ${
                            orderType === "Delivery"
                              ? "border-[#C93E2B] bg-[#FCE4DE]"
                              : "border-[#3A1A16]/10 bg-white hover:border-[#3A1A16]/20"
                          }`}
                        >
                          <div className="flex items-center gap-2 text-xs font-semibold text-[#3A1A16] sm:text-sm">
                            <MapPin
                              size={16}
                              className="shrink-0 text-[#C93E2B]"
                            />
                            Doorstep Delivery
                          </div>

                          <p className="mt-2 text-[10px] leading-5 text-[#665650] sm:text-[11px]">
                            We&apos;ll deliver the order
                            to your address.
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* CUSTOMER DETAILS */}

                    <div className="rounded-[20px] border border-[#3A1A16]/10 bg-[#FFFCF9] p-4 shadow-sm sm:rounded-[22px] sm:p-5">
                      <p className="text-[9px] font-semibold uppercase tracking-[.22em] text-[#C93E2B] sm:text-[10px]">
                        02 · Guest Details
                      </p>

                      <h2 className="mt-1 font-display text-xl text-[#3A1A16] sm:text-2xl">
                        Tell us where to reach you
                      </h2>

                      <div className="mt-5 grid gap-3.5 sm:gap-4">
                        {/* NAME */}

                        <div>
                          <label className="text-xs font-semibold text-[#3A1A16]">
                            Full Name{" "}
                            <span className="text-[#C93E2B]">
                              *
                            </span>
                          </label>

                          <div className="relative mt-1.5">
                            <User
                              size={15}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8D7C74]"
                            />

                            <input
                              type="text"
                              value={customerForm.name}
                              onChange={(e) =>
                                setCustomerForm(
                                  (prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                  }),
                                )
                              }
                              placeholder="Your full name"
                              className={`w-full rounded-xl border bg-white py-3 pl-9 pr-3 text-sm outline-none transition focus:border-[#C93E2B] sm:text-xs ${
                                formErrors.name
                                  ? "border-red-400"
                                  : "border-[#3A1A16]/12"
                              }`}
                            />
                          </div>

                          {formErrors.name && (
                            <p className="mt-1 text-[10px] text-red-600">
                              {formErrors.name}
                            </p>
                          )}
                        </div>

                        {/* PHONE */}

                        <div>
                          <label className="text-xs font-semibold text-[#3A1A16]">
                            Phone Number{" "}
                            <span className="text-[#C93E2B]">
                              *
                            </span>
                          </label>

                          <div className="relative mt-1.5">
                            <Phone
                              size={15}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8D7C74]"
                            />

                            <input
                              type="tel"
                              value={customerForm.phone}
                              onChange={(e) =>
                                setCustomerForm(
                                  (prev) => ({
                                    ...prev,
                                    phone: e.target.value,
                                  }),
                                )
                              }
                              placeholder="10-digit phone number"
                              className={`w-full rounded-xl border bg-white py-3 pl-9 pr-3 text-sm outline-none transition focus:border-[#C93E2B] sm:text-xs ${
                                formErrors.phone
                                  ? "border-red-400"
                                  : "border-[#3A1A16]/12"
                              }`}
                            />
                          </div>

                          {formErrors.phone && (
                            <p className="mt-1 text-[10px] text-red-600">
                              {formErrors.phone}
                            </p>
                          )}
                        </div>

                        {/* EMAIL */}

                        <div>
                          <label className="text-xs font-semibold text-[#3A1A16]">
                            Email{" "}
                            <span className="font-normal text-[#9A8982]">
                              (Optional)
                            </span>
                          </label>

                          <div className="relative mt-1.5">
                            <Mail
                              size={15}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8D7C74]"
                            />

                            <input
                              type="email"
                              value={customerForm.email}
                              onChange={(e) =>
                                setCustomerForm(
                                  (prev) => ({
                                    ...prev,
                                    email: e.target.value,
                                  }),
                                )
                              }
                              placeholder="Email for receipt"
                              className="w-full rounded-xl border border-[#3A1A16]/12 bg-white py-3 pl-9 pr-3 text-sm outline-none transition focus:border-[#C93E2B] sm:text-xs"
                            />
                          </div>
                        </div>

                        {/* ADDRESS */}

                        {orderType === "Delivery" && (
                          <div>
                            <label className="text-xs font-semibold text-[#3A1A16]">
                              Delivery Address{" "}
                              <span className="text-[#C93E2B]">
                                *
                              </span>
                            </label>

                            <div className="relative mt-1.5">
                              <MapPin
                                size={15}
                                className="absolute left-3 top-3 text-[#8D7C74]"
                              />

                              <textarea
                                rows={3}
                                value={customerForm.address}
                                onChange={(e) =>
                                  setCustomerForm(
                                    (prev) => ({
                                      ...prev,
                                      address:
                                        e.target.value,
                                    }),
                                  )
                                }
                                placeholder="House no., street, landmark, city"
                                className={`w-full resize-none rounded-xl border bg-white py-3 pl-9 pr-3 text-sm outline-none transition focus:border-[#C93E2B] sm:text-xs ${
                                  formErrors.address
                                    ? "border-red-400"
                                    : "border-[#3A1A16]/12"
                                }`}
                              />
                            </div>

                            {formErrors.address && (
                              <p className="mt-1 text-[10px] text-red-600">
                                {formErrors.address}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* PAYMENT */}

                    <div className="rounded-[20px] border border-[#3A1A16]/10 bg-[#FFFCF9] p-4 shadow-sm sm:rounded-[22px] sm:p-5">
                      <p className="text-[9px] font-semibold uppercase tracking-[.22em] text-[#C93E2B] sm:text-[10px]">
                        03 · Payment
                      </p>

                      <h2 className="mt-1 font-display text-xl text-[#3A1A16] sm:text-2xl">
                        Pay when you receive it
                      </h2>

                      <div className="mt-4 rounded-xl bg-[#F3E9DC] p-3.5 sm:p-4">
                        <div className="flex items-start gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-[#C93E2B]">
                            <ShoppingBag size={16} />
                          </div>

                          <p className="text-[11px] leading-5 text-[#665650] sm:text-xs">
                            Payment will be collected at
                            the counter for takeaway orders
                            or upon delivery. Cash, UPI and
                            card can be accepted by the
                            restaurant.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ERROR */}

                    {submitError && (
                      <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                        <AlertCircle
                          size={15}
                          className="mt-0.5 shrink-0"
                        />
                        <span>{submitError}</span>
                      </div>
                    )}

                    {/* PLACE ORDER */}

                    <button
                      type="submit"
                      disabled={submittingOrder}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C93E2B] py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a82d1c] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submittingOrder ? (
                        <>
                          <RefreshCw
                            size={16}
                            className="animate-spin"
                          />
                          Placing order...
                        </>
                      ) : (
                        <>
                          Confirm & Place Order
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  </form>

                  {/* ORDER SUMMARY */}

                  <aside className="h-fit min-w-0 rounded-[20px] border border-[#3A1A16]/10 bg-[#FFFCF9] p-4 shadow-sm sm:rounded-[22px] sm:p-5 lg:sticky lg:top-4">
                    <div className="flex items-start justify-between gap-3 border-b border-[#3A1A16]/10 pb-4">
                      <div className="min-w-0">
                        <p className="text-[9px] font-semibold uppercase tracking-[.22em] text-[#C93E2B] sm:text-[10px]">
                          Your Selection
                        </p>

                        <h2 className="mt-1 font-display text-xl text-[#3A1A16] sm:text-2xl">
                          Order Summary
                        </h2>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTab("menu")}
                        className="shrink-0 text-[10px] font-semibold text-[#C93E2B] hover:underline sm:text-[11px]"
                      >
                        + Add more
                      </button>
                    </div>

                    <div className="divide-y divide-[#3A1A16]/5">
                      {cart.map((item) => {
                        const Icon = getItemIcon(item);
                        const theme =
                          getCategoryTheme(
                            item.category,
                          );

                        return (
                          <div
                            key={item.id}
                            className="flex min-w-0 items-center gap-2.5 py-3 sm:gap-3 sm:py-4"
                          >
                            <div
                              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl sm:h-11 sm:w-11"
                              style={{
                                backgroundColor:
                                  theme.bg,
                                color:
                                  theme.iconColor,
                              }}
                            >
                              <Icon
                                size={18}
                                strokeWidth={1.7}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[11px] font-semibold text-[#3A1A16] sm:text-xs">
                                {item.name}
                              </p>

                              <p className="mt-0.5 text-[9px] text-[#8D7C74] sm:text-[10px]">
                                {formatCurrency(
                                  item.price,
                                )}{" "}
                                each
                              </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-[#3A1A16]/10 bg-white p-0.5 sm:gap-1 sm:p-1">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.id,
                                    -1,
                                  )
                                }
                                className="grid h-5 w-5 place-items-center rounded-md bg-[#F3E9DC] text-[#3A1A16] sm:h-6 sm:w-6"
                              >
                                <Minus size={10} />
                              </button>

                              <span className="min-w-[15px] text-center text-[10px] font-bold sm:min-w-[18px] sm:text-[11px]">
                                {item.quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.id,
                                    1,
                                  )
                                }
                                className="grid h-5 w-5 place-items-center rounded-md bg-[#C93E2B] text-white sm:h-6 sm:w-6"
                              >
                                <Plus size={10} />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeFromCart(item.id)
                              }
                              className="shrink-0 text-[#9A8982] transition hover:text-red-600"
                              aria-label={`Remove ${item.name}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* BILL */}

                    <div className="mt-3 space-y-2 border-t border-[#3A1A16]/10 pt-4 text-[11px] sm:text-xs">
                      <div className="flex justify-between gap-4 text-[#665650]">
                        <span>Subtotal</span>
                        <span>
                          {formatCurrency(
                            bill.subtotal,
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4 text-[#665650]">
                        <span>GST (5%)</span>
                        <span>
                          {formatCurrency(
                            bill.taxAmount,
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4 text-[#665650]">
                        <span>Delivery / Packaging</span>

                        <span className="font-semibold text-emerald-700">
                          FREE
                        </span>
                      </div>

                      <div className="flex justify-between gap-4 border-t border-[#3A1A16]/10 pt-3 text-sm font-bold text-[#3A1A16] sm:text-base">
                        <span>Grand Total</span>

                        <span className="text-[#C93E2B]">
                          {formatCurrency(
                            bill.grandTotal,
                          )}
                        </span>
                      </div>
                    </div>
                  </aside>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================
            CONFIRMATION
        ========================== */}

        {activeTab === "confirmation" &&
          lastPlacedOrder && (
            <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 scrollbar-none sm:pr-1">
              <div className="mx-auto max-w-2xl pb-2">
                <div className="rounded-[20px] border border-[#3A1A16]/10 bg-[#FFFCF9] p-4 text-center shadow-sm sm:rounded-[22px] sm:p-8">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 sm:h-16 sm:w-16">
                    <CheckCircle2 size={29} />
                  </div>

                  <p className="mt-5 text-[9px] font-semibold uppercase tracking-[.22em] text-[#C93E2B] sm:text-[10px]">
                    Order Confirmed
                  </p>

                  <h2 className="mt-1 font-display text-3xl font-medium text-[#3A1A16] sm:text-4xl">
                    Thank you!
                  </h2>

                  <p className="mt-2 text-[11px] text-[#665650] sm:text-xs">
                    Your order has been successfully sent
                    to the kitchen.
                  </p>

                  <div className="mx-auto my-5 w-fit max-w-full rounded-2xl bg-[#F3E9DC] px-6 py-3 sm:my-6 sm:px-8 sm:py-4">
                    <p className="text-[8px] uppercase tracking-[.2em] text-[#8D7C74] sm:text-[9px]">
                      Order Number
                    </p>

                    <p className="mt-1 font-display text-3xl font-semibold text-[#3A1A16] sm:text-4xl">
                      #{lastPlacedOrder.orderNumber}
                    </p>
                  </div>

                  <div className="mb-5 flex justify-center">
                    {renderStatusBadge(
                      lastPlacedOrder.status,
                    )}
                  </div>

                  <div className="rounded-xl border border-[#3A1A16]/10 bg-white p-3.5 text-left sm:p-4">
                    <div className="flex flex-col gap-1 border-b border-[#3A1A16]/10 pb-3 text-xs sm:flex-row sm:justify-between">
                      <span className="text-[#665650]">
                        Order Type
                      </span>

                      <span className="font-semibold text-[#3A1A16]">
                        {lastPlacedOrder.details.type}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-col gap-1 border-b border-[#3A1A16]/10 pb-3 text-xs sm:flex-row sm:justify-between">
                      <span className="text-[#665650]">
                        Phone
                      </span>

                      <span className="break-all font-semibold text-[#3A1A16]">
                        {
                          lastPlacedOrder.details
                            .delivery.phone
                        }
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs font-semibold text-[#3A1A16]">
                        Items
                      </p>

                      <div className="mt-2 space-y-1.5">
                        {lastPlacedOrder.items.map(
                          (item) => (
                            <div
                              key={item.id}
                              className="flex items-start justify-between gap-3 text-[11px] text-[#665650] sm:text-xs"
                            >
                              <span className="min-w-0 break-words">
                                {item.name} ×{" "}
                                {item.quantity}
                              </span>

                              <span className="shrink-0">
                                {formatCurrency(
                                  item.price *
                                    item.quantity,
                                )}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex justify-between gap-4 border-t border-[#3A1A16]/10 pt-3 text-sm font-bold text-[#3A1A16]">
                      <span>Total</span>

                      <span className="text-[#C93E2B]">
                        {formatCurrency(
                          lastPlacedOrder.totals
                            .grandTotal,
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTrackQuery(
                          String(
                            lastPlacedOrder.orderNumber,
                          ),
                        );

                        void handleTrackOrder(
                          String(
                            lastPlacedOrder.orderNumber,
                          ),
                        );

                        setActiveTab("track");
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3A1A16] py-3 text-xs font-semibold text-white transition hover:bg-[#C93E2B]"
                    >
                      <ClockIcon />
                      Track Order
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCustomerForm(initialForm);
                        setFormErrors({});
                        setActiveTab("menu");
                      }}
                      className="rounded-xl border border-[#3A1A16]/12 bg-white py-3 text-xs font-semibold text-[#3A1A16] transition hover:bg-[#F3E9DC]"
                    >
                      Order More
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* =========================
            TRACK ORDER
        ========================== */}

        {activeTab === "track" && (
          <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 scrollbar-none sm:pr-1">
            <div className="mx-auto max-w-3xl pb-2">
              <div className="rounded-[20px] border border-[#3A1A16]/10 bg-[#FFFCF9] p-4 shadow-sm sm:rounded-[22px] sm:p-6">
                <p className="text-[9px] font-semibold uppercase tracking-[.22em] text-[#C93E2B] sm:text-[10px]">
                  Order Tracking
                </p>

                <h2 className="mt-1 font-display text-2xl text-[#3A1A16] sm:text-3xl">
                  Where is my order?
                </h2>

                <p className="mt-1 text-[11px] text-[#665650] sm:text-xs">
                  Enter your order number to view its
                  current status.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleTrackOrder();
                  }}
                  className="mt-5 flex flex-col gap-2 sm:flex-row"
                >
                  <div className="relative min-w-0 flex-1">
                    <Search
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8D7C74]"
                    />

                    <input
                      type="text"
                      value={trackQuery}
                      onChange={(e) =>
                        setTrackQuery(e.target.value)
                      }
                      placeholder="Enter order number..."
                      className="w-full rounded-xl border border-[#3A1A16]/12 bg-white py-3 pl-9 pr-3 text-sm outline-none focus:border-[#C93E2B] sm:text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={trackingLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3A1A16] px-6 py-3 text-xs font-semibold text-white transition hover:bg-[#C93E2B] disabled:opacity-50"
                  >
                    {trackingLoading ? (
                      <RefreshCw
                        size={14}
                        className="animate-spin"
                      />
                    ) : (
                      <>
                        Track Order
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </form>

                {trackingError && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    <AlertCircle
                      size={15}
                      className="mt-0.5 shrink-0"
                    />
                    <span>{trackingError}</span>
                  </div>
                )}
              </div>

              {/* TRACKED ORDER */}

              {trackedOrder && (
                <div className="mt-4 rounded-[20px] border border-[#3A1A16]/10 bg-[#FFFCF9] p-4 shadow-sm sm:mt-5 sm:rounded-[22px] sm:p-6">
                  <div className="flex flex-col gap-3 border-b border-[#3A1A16]/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[9px] uppercase tracking-[.2em] text-[#8D7C74] sm:text-[10px]">
                        Order #{trackedOrder.orderNumber}
                      </p>

                      <h3 className="mt-1 truncate font-display text-xl text-[#3A1A16] sm:text-2xl">
                        {
                          trackedOrder.details
                            .delivery.name
                        }
                      </h3>
                    </div>

                    <div className="max-w-full">
                      {renderStatusBadge(
                        trackedOrder.status,
                      )}
                    </div>
                  </div>

                  {/* PROGRESS */}

                  <div className="my-6 sm:my-7">
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                      {/* RECEIVED */}

                      <div className="min-w-0 text-center">
                        <div className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-emerald-700 sm:h-11 sm:w-11">
                          <CheckCircle2
                            size={17}
                            className="sm:size-[19px]"
                          />
                        </div>

                        <p className="mt-2 text-[9px] font-semibold leading-4 text-[#3A1A16] sm:text-[11px]">
                          Order Received
                        </p>

                        <p className="mt-0.5 text-[8px] leading-4 text-[#8D7C74] sm:text-[9px]">
                          Sent to kitchen
                        </p>
                      </div>

                      {/* KITCHEN */}

                      <div className="min-w-0 text-center">
                        <div
                          className={`mx-auto grid h-9 w-9 place-items-center rounded-full sm:h-11 sm:w-11 ${
                            trackedOrder.status ===
                            "open"
                              ? "bg-amber-100 text-amber-700 ring-4 ring-amber-50"
                              : trackedOrder.status ===
                                  "completed"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-[#F3E9DC] text-[#8D7C74]"
                          }`}
                        >
                          <ChefHat
                            size={17}
                            className="sm:size-[19px]"
                          />
                        </div>

                        <p className="mt-2 text-[9px] font-semibold leading-4 text-[#3A1A16] sm:text-[11px]">
                          Kitchen Preparing
                        </p>

                        <p className="mt-0.5 text-[8px] leading-4 text-[#8D7C74] sm:text-[9px]">
                          {trackedOrder.status === "open"
                            ? "In progress"
                            : trackedOrder.status ===
                                "completed"
                              ? "Ready"
                              : "Waiting"}
                        </p>
                      </div>

                      {/* COMPLETED */}

                      <div className="min-w-0 text-center">
                        <div
                          className={`mx-auto grid h-9 w-9 place-items-center rounded-full sm:h-11 sm:w-11 ${
                            trackedOrder.status ===
                            "completed"
                              ? "bg-emerald-100 text-emerald-700 ring-4 ring-emerald-50"
                              : "bg-[#F3E9DC] text-[#8D7C74]"
                          }`}
                        >
                          <PackageCheck
                            size={17}
                            className="sm:size-[19px]"
                          />
                        </div>

                        <p className="mt-2 text-[9px] font-semibold leading-4 text-[#3A1A16] sm:text-[11px]">
                          {trackedOrder.details.type ===
                          "Delivery"
                            ? "Delivered"
                            : "Ready for Pickup"}
                        </p>

                        <p className="mt-0.5 text-[8px] leading-4 text-[#8D7C74] sm:text-[9px]">
                          {trackedOrder.status ===
                          "completed"
                            ? "Completed"
                            : "Pending"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ITEMS */}

                  <div className="rounded-xl border border-[#3A1A16]/10 bg-white p-3.5 sm:p-4">
                    <p className="text-xs font-semibold text-[#3A1A16]">
                      Order Items
                    </p>

                    <div className="mt-3 space-y-2">
                      {trackedOrder.items.map(
                        (item) => {
                          const Icon =
                            getItemIcon(item);
                          const theme =
                            getCategoryTheme(
                              item.category,
                            );

                          return (
                            <div
                              key={item.id}
                              className="flex min-w-0 items-center gap-2.5 sm:gap-3"
                            >
                              <div
                                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg sm:h-9 sm:w-9"
                                style={{
                                  backgroundColor:
                                    theme.bg,
                                  color:
                                    theme.iconColor,
                                }}
                              >
                                <Icon
                                  size={15}
                                  className="sm:size-[16px]"
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="break-words text-[11px] font-medium text-[#3A1A16] sm:text-xs">
                                  {item.name} ×{" "}
                                  {item.quantity}
                                </p>
                              </div>

                              <span className="shrink-0 text-[11px] font-semibold text-[#3A1A16] sm:text-xs">
                                {formatCurrency(
                                  item.price *
                                    item.quantity,
                                )}
                              </span>
                            </div>
                          );
                        },
                      )}
                    </div>

                    <div className="mt-4 flex justify-between gap-4 border-t border-[#3A1A16]/10 pt-3 text-sm font-bold">
                      <span>Grand Total</span>

                      <span className="text-[#C93E2B]">
                        {formatCurrency(
                          trackedOrder.totals
                            .grandTotal,
                        )}
                      </span>
                    </div>
                  </div>

                  {/* DEMO BUTTON */}

                  {trackedOrder.status === "open" && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5 sm:mt-5 sm:p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-amber-900">
                            Demo Fulfillment
                          </p>

                          <p className="mt-1 text-[10px] leading-5 text-[#665650]">
                            Move this order from open to
                            completed for testing.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            void handleSimulateFulfill(
                              trackedOrder.id,
                            )
                          }
                          disabled={
                            simulatingFulfillment
                          }
                          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-[#3A1A16] px-4 py-2.5 text-[11px] font-semibold text-white transition hover:bg-[#C93E2B] disabled:opacity-50 sm:w-auto"
                        >
                          {simulatingFulfillment ? (
                            <RefreshCw
                              size={13}
                              className="animate-spin"
                            />
                          ) : (
                            <Sparkles size={13} />
                          )}
                          Mark Ready
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ShortcutsHelpModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={shortcuts}
      />
    </div>
  );
}

function ClockIcon() {
  return (
    <span className="inline-flex shrink-0">
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 14" />
      </svg>
    </span>
  );
}