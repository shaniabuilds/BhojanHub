
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Clock,
  RotateCcw,
  ShoppingBag,
  ChevronRight,
  X,
} from "lucide-react";

import { MenuPanel } from "./MenuPanel";
import { CartPanel } from "./CartPanel";
import { BillingSummary } from "./BillingSummary";
import { OrderDetails } from "./OrderDetails";
import { PaymentSection } from "./PaymentSection";
import { Receipt } from "./Receipt";
import { menuItems } from "./menu-data";
import type { Category, PaymentMethod } from "./types";
import type {
  CreateOrderRequest,
  OrdersResponse,
  PosOrder,
} from "@/types/pos";
import { usePos } from "./use-pos";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { ShortcutsHelpModal } from "@/components/shared/ShortcutsHelpModal";

export function PosApp() {
  const pos = usePos();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [toast, setToast] = useState("");
  const [confirm, setConfirm] = useState<"clear" | "new" | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>("Cash");
  const [received, setReceived] = useState("");

  const [completed, setCompleted] = useState<{
    number: number;
    date: Date;
    method: PaymentMethod;
    cashReceived: number;
  } | null>(null);

  const [orderNo, setOrderNo] = useState(1001);
  const [held, setHeld] = useState<PosOrder[]>([]);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const menuSearchRef = useRef<HTMLInputElement>(null);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  useEffect(() => {
    const loadHeldOrders = async () => {
      try {
        const response = await fetch("/api/orders?status=held");

        if (!response.ok) {
          throw new Error("Unable to load held orders.");
        }

        const data = (await response.json()) as OrdersResponse;
        setHeld(data.orders);
      } catch {
        setToast("Could not load held orders.");
      }
    };

    void loadHeldOrders();
  }, []);

  useEffect(() => {
    if (!toast) return;

    const id = window.setTimeout(() => {
      setToast("");
    }, 2200);

    return () => window.clearTimeout(id);
  }, [toast]);

  const categories = useMemo(
    () =>
      [
        "All",
        ...Array.from(new Set(menuItems.map((item) => item.category))),
      ] as Category[],
    [],
  );

  const filtered = useMemo(
    () =>
      menuItems.filter(
        (item) =>
          (category === "All" || item.category === category) &&
          `${item.name} ${item.description}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [query, category],
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered]);

  const reset = () => {
    pos.reset();
    setReceived("");
    setPayment("Cash");
    setCompleted(null);
    setConfirm(null);
    setOrderNo((number) => number + 1);
    setLastAddedId(null);
  };

  const validated = () => {
    if (!pos.items.length) {
      return "Add at least one item.";
    }

    if (pos.details.type === "Dine In" && !pos.details.table) {
      return "Select a table for dine-in.";
    }

    if (pos.details.type === "Delivery") {
      const delivery = pos.details.delivery;

      if (!delivery?.name || !delivery?.phone || !delivery?.address) {
        return "Complete the delivery details.";
      }
    }

    if (
      payment === "Cash" &&
      Number(received || 0) < pos.bill.grandTotal
    ) {
      return "Cash received must cover the total.";
    }

    return "";
  };

  const complete = async () => {
    const error = validated();

    if (error) {
      setToast(error);
      return;
    }

    const currentOrderId = pos.activeOrderId;

    try {
      if (currentOrderId) {
        await fetch(`/api/orders/${currentOrderId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "completed",
          }),
        });

        setHeld((current) =>
          current.filter((order) => order.id !== currentOrderId),
        );
      } else {
        await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "completed",
            channel: "pos",
            items: pos.items.map(({ id, quantity }) => ({
              id,
              quantity,
            })),
            details: pos.details,
            discount: pos.discount,
            taxRate: pos.taxRate,
            serviceEnabled: pos.serviceEnabled,
            serviceRate: pos.serviceRate,
            paymentMethod: payment,
            cashReceived:
              payment === "Cash" ? Number(received || 0) : undefined,
            totals: pos.bill,
          } satisfies CreateOrderRequest),
        });
      }
    } catch (orderSyncError) {
      console.warn(
        "POS order completion sync failed:",
        orderSyncError,
      );
    }

    setCompleted({
      number: orderNo,
      date: new Date(),
      method: payment,
      cashReceived:
        payment === "Cash" ? Number(received || 0) : 0,
    });

    setToast("Payment completed successfully.");
  };

  const startNewOrder = () => {
    if (pos.items.length) {
      setConfirm("new");
      return;
    }

    reset();
  };

  const addItemByIndex = (index: number) => {
    const item = filtered[index];

    if (!item) return;

    pos.addItem(item);
    setLastAddedId(item.id);
    setToast(`${item.name} added to order.`);
  };

  const moveSelection = (delta: number) => {
    if (!filtered.length) return;

    setSelectedIndex((current) => {
      const next = current + delta;

      if (next < 0) return 0;
      if (next > filtered.length - 1) return filtered.length - 1;

      return next;
    });
  };

  const addSelectedItem = () => {
    addItemByIndex(selectedIndex);
  };

  const bumpLastAddedQuantity = (delta: number) => {
    if (!lastAddedId) {
      setToast("Add an item first, then use +/- to adjust quantity.");
      return;
    }

    pos.changeQuantity(lastAddedId, delta);
  };

  const removeLastAddedItem = () => {
    if (!lastAddedId) return;

    pos.removeItem(lastAddedId);
    setLastAddedId(null);
    setToast("Removed last added item.");
  };

  const hold = async () => {
    if (!pos.items.length) {
      setToast("There is no order to hold.");
      return;
    }

    try {
      const order = await pos.saveHold();

      setHeld((current) => [
        ...current.filter((entry) => entry.id !== order.id),
        order,
      ]);

      setToast("Order saved to held orders.");
    } catch (holdError) {
      setToast(
        holdError instanceof Error
          ? holdError.message
          : "Unable to hold order.",
      );
    }
  };

  const resumeHeldOrder = async (order = held.at(-1)) => {
    if (!order) {
      setToast("There are no held orders to resume.");
      return;
    }

    try {
      await pos.resume(order);

      setHeld((current) =>
        current.filter((entry) => entry.id !== order.id),
      );

      setToast("Held order resumed.");
    } catch (resumeError) {
      setToast(
        resumeError instanceof Error
          ? resumeError.message
          : "Unable to resume order.",
      );
    }
  };

  const shortcuts = [
    {
      key: "/",
      handler: () => menuSearchRef.current?.focus(),
      description: "Focus menu search",
    },
    {
      key: "N",
      handler: startNewOrder,
      description: "Start a new order",
    },
    {
      key: "Enter",
      ctrlOrCmd: true,
      handler: () => void complete(),
      description: "Complete payment",
    },
    {
      key: "?",
      handler: () => setShowShortcuts(true),
      description: "Show keyboard shortcuts",
    },
    {
      key: "H",
      alt: true,
      shift: true,
      handler: () => void hold(),
      description: "Hold order",
    },
    {
      key: "R",
      alt: true,
      shift: true,
      handler: () => void resumeHeldOrder(),
      description: "Resume latest held order",
    },
    {
      key: "ArrowDown",
      handler: () => moveSelection(1),
      description: "Move to next menu item",
    },
    {
      key: "ArrowUp",
      handler: () => moveSelection(-1),
      description: "Move to previous menu item",
    },
    {
      key: "Enter",
      handler: addSelectedItem,
      description: "Add highlighted menu item to order",
    },
    {
      key: "1",
      handler: () => addItemByIndex(0),
      description: "Add menu item #1 to order",
    },
    {
      key: "2",
      handler: () => addItemByIndex(1),
      description: "Add menu item #2 to order",
    },
    {
      key: "3",
      handler: () => addItemByIndex(2),
      description: "Add menu item #3 to order",
    },
    {
      key: "4",
      handler: () => addItemByIndex(3),
      description: "Add menu item #4 to order",
    },
    {
      key: "5",
      handler: () => addItemByIndex(4),
      description: "Add menu item #5 to order",
    },
    {
      key: "6",
      handler: () => addItemByIndex(5),
      description: "Add menu item #6 to order",
    },
    {
      key: "7",
      handler: () => addItemByIndex(6),
      description: "Add menu item #7 to order",
    },
    {
      key: "8",
      handler: () => addItemByIndex(7),
      description: "Add menu item #8 to order",
    },
    {
      key: "9",
      handler: () => addItemByIndex(8),
      description: "Add menu item #9 to order",
    },
    {
      key: "+",
      handler: () => bumpLastAddedQuantity(1),
      description: "Increase quantity of last added item",
    },
    {
      key: "-",
      handler: () => bumpLastAddedQuantity(-1),
      description: "Decrease quantity of last added item",
    },
    {
      key: "Backspace",
      handler: removeLastAddedItem,
      description: "Remove last added item",
    },
  ];

  useKeyboardShortcuts(shortcuts);

  if (completed) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-[#F3E9DC] px-3 py-6 sm:px-4 sm:py-10">
        <Receipt
          orderNo={completed.number}
          date={completed.date}
          details={pos.details}
          items={pos.items}
          bill={pos.bill}
          payment={completed.method}
          cashReceived={completed.cashReceived}
          onNew={reset}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F3E9DC] p-2.5 sm:p-4 lg:h-screen lg:overflow-hidden">
      <div className="mx-auto flex min-h-[calc(100vh-20px)] w-full max-w-[1800px] flex-col sm:min-h-[calc(100vh-32px)] lg:h-full lg:min-h-0">
        {/* HELD ORDERS */}
        {held.length > 0 && (
          <section className="mb-3 shrink-0 overflow-hidden rounded-[18px] border border-[#3A1A16]/10 bg-[#FFFCF9] shadow-sm sm:mb-4 sm:rounded-[20px]">
            <div className="flex flex-col gap-3 px-3 py-3 sm:px-5 sm:py-3.5 lg:flex-row lg:items-center">
              <div className="flex shrink-0 items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F3E9DC] text-[#3A1A16]">
                  <Clock size={16} />
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#3A1A16]">
                    Held Orders
                  </p>

                  <p className="text-[10px] text-[#8D7C74]">
                    Resume a saved order
                  </p>
                </div>
              </div>

              <div className="hidden h-8 w-px bg-[#3A1A16]/8 lg:block" />

              <div className="flex min-w-0 gap-2 overflow-x-auto pb-0.5 scrollbar-none">
                {held.map((order) => (
                  <button
                    type="button"
                    key={order.id}
                    onClick={() => void resumeHeldOrder(order)}
                    className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#3A1A16]/10 bg-[#F3E9DC]/60 px-3 py-2 text-left transition hover:border-[#C93E2B]/30 hover:bg-[#FCE4DE]"
                  >
                    <ShoppingBag
                      size={13}
                      className="text-[#C93E2B]"
                    />

                    <span className="text-[11px] font-semibold text-[#3A1A16]">
                      #{order.id.slice(-5)}
                    </span>

                    <span className="text-[10px] text-[#665650]">
                      {order.items.length} items
                    </span>

                    <ChevronRight
                      size={13}
                      className="text-[#8D7C74] transition group-hover:translate-x-0.5 group-hover:text-[#C93E2B]"
                    />
                  </button>
                ))}
              </div>

              <div className="flex w-full shrink-0 gap-2 lg:ml-auto lg:w-auto">
                <button
                  type="button"
                  onClick={() => void hold()}
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-[#3A1A16]/15 bg-[#FFFCF9] px-3.5 py-2 text-[11px] font-semibold text-[#3A1A16] shadow-sm transition hover:border-[#3A1A16]/25 hover:bg-white active:scale-[.98] lg:flex-none"
                >
                  <Clock size={14} />
                  Hold
                </button>

                <button
                  type="button"
                  onClick={startNewOrder}
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#3A1A16] px-3.5 py-2 text-[11px] font-semibold text-[#F3E9DC] shadow-sm transition hover:bg-[#4a241e] active:scale-[.98] lg:flex-none"
                >
                  <RotateCcw size={14} />
                  New Order
                </button>
              </div>
            </div>
          </section>
        )}

        {/* MAIN POS WORKSPACE */}
        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
          {/* MENU */}
          <section className="h-[calc(100vh-20px)] min-h-0 min-w-0 lg:h-full">
            <MenuPanel
              query={query}
              searchInputRef={menuSearchRef}
              onQuery={setQuery}
              category={category}
              categories={categories}
              onCategory={setCategory}
              items={filtered}
              selectedIndex={selectedIndex}
              onAdd={(item) => {
                pos.addItem(item);
                setLastAddedId(item.id);
                setToast(`${item.name} added to order.`);
              }}
            />
          </section>

          {/* CURRENT ORDER */}
          <aside className="min-h-[520px] min-w-0 lg:h-full lg:min-h-0">
            <div className="flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-[#3A1A16]/10 bg-[#FFFCF9] shadow-[0_12px_40px_rgba(58,26,22,0.06)] lg:h-full lg:rounded-[24px]">
              {/* ORDER HEADER */}
              <div className="shrink-0 border-b border-[#3A1A16]/10 bg-[#FFFCF9] p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C93E2B]" />

                      <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#C93E2B]">
                        Current order
                      </p>
                    </div>

                    <h2 className="mt-1 font-display text-2xl leading-tight text-[#3A1A16] sm:text-3xl">
                      Order #{orderNo}
                    </h2>
                  </div>

                  {pos.items.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setConfirm("clear")}
                      className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold text-[#C93E2B] transition hover:bg-[#FCE4DE]"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* <div className="mt-4 flex items-center justify-between rounded-xl bg-[#F3E9DC]/65 px-3.5 py-2.5">
                  <span className="text-[10px] uppercase tracking-[.12em] text-[#8D7C74]">
                    Items
                  </span>

                  <span className="text-xs font-semibold text-[#3A1A16]">
                    {pos.items.reduce(
                      (total, item) => total + item.quantity,
                      0,
                    )}
                  </span>
                </div> */}

                <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#F3E9DC]/65 p-2.5">
  <div className="flex min-w-0 flex-1 items-center justify-between px-1">
    <span className="text-[10px] uppercase tracking-[.12em] text-[#8D7C74]">
      Items
    </span>

    <span className="text-xs font-semibold text-[#3A1A16]">
      {pos.items.reduce(
        (total, item) => total + item.quantity,
        0,
      )}
    </span>
  </div>

  {/* HOLD */}
  <button
    type="button"
    onClick={() => void hold()}
    disabled={!pos.items.length}
    className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#3A1A16]/15 bg-[#FFFCF9] px-3 text-[10px] font-semibold text-[#3A1A16] shadow-sm transition hover:border-[#C93E2B]/30 hover:bg-white active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40 sm:px-3.5"
  >
    <Clock size={13} />
    <span>Hold</span>
  </button>

  {/* RESUME */}
  <button
    type="button"
    onClick={() => void resumeHeldOrder()}
    disabled={!held.length}
    className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#3A1A16] px-3 text-[10px] font-semibold text-[#F3E9DC] shadow-sm transition hover:bg-[#4a241e] active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40 sm:px-3.5"
  >
    <RotateCcw size={13} />
    <span>Resume</span>
  </button>
</div>
              </div>

              {/* ORDER CONTENT */}
              <div className="min-h-0 flex-1 overflow-y-auto p-3 scrollbar-none sm:p-5">
                <CartPanel
                  items={pos.items}
                  changeQuantity={pos.changeQuantity}
                  removeItem={pos.removeItem}
                />

                <div className="mt-4">
                  <BillingSummary
                    bill={pos.bill}
                    discount={pos.discount}
                    setDiscount={pos.setDiscount}
                    taxRate={pos.taxRate}
                    setTaxRate={pos.setTaxRate}
                    serviceEnabled={pos.serviceEnabled}
                    setServiceEnabled={pos.setServiceEnabled}
                    serviceRate={pos.serviceRate}
                    setServiceRate={pos.setServiceRate}
                  />
                </div>

                <div className="mt-4">
                  <OrderDetails
                    details={pos.details}
                    setDetails={pos.setDetails}
                  />
                </div>

                <div className="mt-4">
                  <PaymentSection
                    method={payment}
                    setMethod={setPayment}
                    received={received}
                    setReceived={setReceived}
                    total={pos.bill.grandTotal}
                    onComplete={complete}
                  />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* SHORTCUTS MODAL */}
      <ShortcutsHelpModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={shortcuts}
      />

      {/* TOAST */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 z-[60] flex max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-3 rounded-full bg-[#3A1A16] px-4 py-3 text-xs font-semibold text-[#F3E9DC] shadow-[0_10px_30px_rgba(58,26,22,0.2)] sm:bottom-5 sm:max-w-[calc(100vw-32px)]"
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C93E2B]" />

          <span className="truncate">{toast}</span>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {confirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#3A1A16]/45 p-3 backdrop-blur-[3px] sm:p-4"
        >
          <div className="my-auto w-full max-w-sm overflow-hidden rounded-[22px] border border-[#3A1A16]/10 bg-[#FFFCF9] shadow-[0_25px_80px_rgba(58,26,22,0.2)] sm:rounded-[24px]">
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between border-b border-[#3A1A16]/10 p-4 sm:p-6">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C93E2B]" />

                  <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#C93E2B]">
                    Confirmation
                  </p>
                </div>

                <h2 className="font-display text-2xl leading-tight text-[#3A1A16] sm:text-3xl">
                  {confirm === "clear"
                    ? "Clear this order?"
                    : "Start a new order?"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setConfirm(null)}
                aria-label="Close"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#8D7C74] transition hover:bg-[#F3E9DC] hover:text-[#3A1A16]"
              >
                <X size={16} />
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div className="p-4 sm:p-6">
              <p className="text-sm leading-6 text-[#665650]">
                Items currently in this order will be removed. This action
                cannot be undone.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setConfirm(null)}
                  className="rounded-xl border border-[#3A1A16]/12 bg-white px-4 py-3 text-xs font-semibold text-[#3A1A16] transition hover:bg-[#F3E9DC]"
                >
                  Keep Order
                </button>

                <button
                  type="button"
                  onClick={() => {
                    reset();
                    setConfirm(null);
                  }}
                  className="rounded-xl bg-[#C93E2B] px-4 py-3 text-xs font-semibold text-white transition hover:bg-[#A93324] active:scale-[.98]"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


