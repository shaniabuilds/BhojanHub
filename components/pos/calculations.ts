import { CartItem, Discount } from "./types";
export { calculateBill } from "@/lib/billing/calculateBill";
const round = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;
export const formatCurrency = (value: number) => `₹${round(value).toFixed(2)}`;
export function calculateBillLegacy(
  items: CartItem[],
  discount: Discount,
  taxRate: number,
  serviceEnabled: boolean,
  serviceRate: number,
) {
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
  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    serviceCharge,
    grandTotal: round(taxableAmount + taxAmount + serviceCharge),
  };
}
