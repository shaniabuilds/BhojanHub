
import { Bill, Discount } from "../types/pos";

export function formatCurrency(amount: number): string {
  const rounded =
    Math.round((amount + Number.EPSILON) * 100) / 100;

  return `₹${rounded.toLocaleString("en-IN", {
    minimumFractionDigits: rounded % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function calculateBill(params: {
  subtotal: number;
  discount: Discount;
  taxRate: number;
  serviceEnabled: boolean;
  serviceRate: number;
  deliveryFee?: number;
}): Bill {
  const {
    subtotal,
    discount,
    taxRate,
    serviceEnabled,
    serviceRate,
    deliveryFee = 0,
  } = params;

  let discountAmount = 0;

  if (discount.kind === "percent") {
    discountAmount =
      (subtotal *
        Math.max(0, Math.min(100, discount.value))) /
      100;
  } else {
    discountAmount = Math.max(
      0,
      Math.min(subtotal, discount.value),
    );
  }

  const taxableAmount = Math.max(
    0,
    subtotal - discountAmount,
  );

  const taxAmount =
    (taxableAmount * Math.max(0, taxRate)) / 100;

  const serviceCharge = serviceEnabled
    ? (taxableAmount * Math.max(0, serviceRate)) / 100
    : 0;

  const normalizedDeliveryFee = Math.max(
    0,
    deliveryFee,
  );

  const grandTotal =
    Math.round(
      (
        taxableAmount +
        taxAmount +
        serviceCharge +
        normalizedDeliveryFee
      ) *
        100,
    ) / 100;

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