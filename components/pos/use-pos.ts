"use client";
import { useCallback, useMemo, useState } from "react";
import { calculateBill } from "./calculations";
import { CartItem, Discount, MenuItem, OrderDetails } from "./types";
import type {
  ApiError,
  CreateOrderRequest,
  OrderResponse,
  PosOrder,
} from "@/types/pos";
const initialDetails: OrderDetails = {
  type: "Dine In",
  table: "",
  delivery: { name: "", phone: "", address: "" },
};
export function usePos() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<Discount>({
    kind: "percent",
    value: 0,
  });
  const [taxRate, setTaxRate] = useState(0);
  const [serviceEnabled, setServiceEnabled] = useState(false);
  const [serviceRate, setServiceRate] = useState(5);
  const [details, setDetails] = useState(initialDetails);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const bill = useMemo(
    () => calculateBill(items, discount, taxRate, serviceEnabled, serviceRate),
    [items, discount, taxRate, serviceEnabled, serviceRate],
  );
  const addItem = useCallback(
    (item: MenuItem) =>
      setItems((current) => {
        const found = current.find((entry) => entry.id === item.id);
        return found
          ? current.map((entry) =>
              entry.id === item.id
                ? { ...entry, quantity: entry.quantity + 1 }
                : entry,
            )
          : [...current, { ...item, quantity: 1 }];
      }),
    [],
  );
  const changeQuantity = useCallback(
    (id: string, change: number) =>
      setItems((current) =>
        current.flatMap((item) =>
          item.id !== id
            ? [item]
            : item.quantity + change > 0
              ? [{ ...item, quantity: item.quantity + change }]
              : [],
        ),
      ),
    [],
  );
  const removeItem = useCallback(
    (id: string) =>
      setItems((current) => current.filter((item) => item.id !== id)),
    [],
  );
  const reset = useCallback(() => {
    setItems([]);
    setDiscount({ kind: "percent", value: 0 });
    setTaxRate(0);
    setServiceEnabled(false);
    setServiceRate(5);
    setDetails(initialDetails);
    setActiveOrderId(null);
  }, []);
  const loadOrder = useCallback((order: PosOrder) => {
    setItems(
      order.items.map((item) => ({
        ...item,
        category: item.category as CartItem["category"],
      })),
    );
    setDiscount(order.totals.discount);
    setTaxRate(order.totals.taxRate);
    setServiceEnabled(order.totals.serviceEnabled);
    setServiceRate(order.totals.serviceRate);
    setDetails(order.details);
    setActiveOrderId(order.id);
  }, []);
  const saveHold = useCallback(async (): Promise<PosOrder> => {
    const response = activeOrderId
      ? await fetch(`/api/orders/${activeOrderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "held" }),
        })
      : await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "held",
            items: items.map(({ id, quantity }) => ({ id, quantity })),
            details,
            discount,
            taxRate,
            serviceEnabled,
            serviceRate,
            totals: bill,
          } satisfies CreateOrderRequest),
        });
    const data = (await response.json()) as OrderResponse | ApiError;
    if (!response.ok || !("order" in data))
      throw new Error("error" in data ? data.error : "Unable to hold order.");
    setActiveOrderId(data.order.id);
    return data.order;
  }, [
    activeOrderId,
    bill,
    details,
    discount,
    items,
    serviceEnabled,
    serviceRate,
    taxRate,
  ]);
  const resume = useCallback(
    async (held: PosOrder): Promise<PosOrder> => {
      const response = await fetch(`/api/orders/${held.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "open" }),
      });
      const data = (await response.json()) as OrderResponse | ApiError;
      if (!response.ok || !("order" in data))
        throw new Error(
          "error" in data ? data.error : "Unable to resume order.",
        );
      loadOrder(data.order);
      return data.order;
    },
    [loadOrder],
  );
  return {
    items,
    discount,
    setDiscount,
    taxRate,
    setTaxRate,
    serviceEnabled,
    setServiceEnabled,
    serviceRate,
    setServiceRate,
    details,
    setDetails,
    bill,
    addItem,
    changeQuantity,
    removeItem,
    reset,
    loadOrder,
    activeOrderId,
    saveHold,
    resume,
  };
}
