import type { Bill, CartItem, Discount } from "@/types/pos";

const round = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export function calculateBill(
  items: Pick<CartItem, "price" | "quantity">[],
  discount: Discount,
  taxRate: number,
  serviceEnabled: boolean,
  serviceRate: number,
  deliveryFee = 0,
): Bill {
  const subtotal = round(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  );

  const requestedDiscount =
    discount.kind === "percent"
      ? (subtotal * Math.max(0, discount.value)) / 100
      : Math.max(0, discount.value);

  const discountAmount = round(Math.min(subtotal, requestedDiscount));

  const taxableAmount = round(subtotal - discountAmount);

  const taxAmount = round((taxableAmount * Math.max(0, taxRate)) / 100);

  const serviceCharge = round(
    serviceEnabled ? (taxableAmount * Math.max(0, serviceRate)) / 100 : 0,
  );

  const normalizedDeliveryFee = round(Math.max(0, deliveryFee));

  const grandTotal = round(
    taxableAmount + taxAmount + serviceCharge + normalizedDeliveryFee,
  );

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    serviceCharge,
    deliveryFee: normalizedDeliveryFee,
    grandTotal,
  };
}

export const formatCurrency = (value: number) => `₹${round(value).toFixed(2)}`;
