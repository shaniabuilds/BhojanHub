"use client";
import { Bill } from "./shared";
import { Discount } from "./types";
import { formatCurrency } from "./calculations";
interface Props {
  bill: Bill;
  discount: Discount;
  setDiscount: (d: Discount) => void;
  taxRate: number;
  setTaxRate: (n: number) => void;
  serviceEnabled: boolean;
  setServiceEnabled: (v: boolean) => void;
  serviceRate: number;
  setServiceRate: (n: number) => void;
}
export function BillingSummary({
  bill,
  discount,
  setDiscount,
  taxRate,
  setTaxRate,
  serviceEnabled,
  setServiceEnabled,
  serviceRate,
  setServiceRate,
}: Props) {
  return (
    <div className="mt-5 border-t border-[#3A1A16]/10 pt-4">
      <div className="grid grid-cols-2 gap-2">
        <select
          value={discount.kind}
          onChange={(e) =>
            setDiscount({
              ...discount,
              kind: e.target.value as Discount["kind"],
            })
          }
          className="rounded-lg border border-[#3A1A16]/15 bg-white px-2 py-2 text-xs"
        >
          <option value="percent">Discount %</option>
          <option value="fixed">Discount ₹</option>
        </select>
        <input
          aria-label="Discount amount"
          type="number"
          min="0"
          value={discount.value || ""}
          onChange={(e) =>
            setDiscount({ ...discount, value: Number(e.target.value) })
          }
          placeholder="0"
          className="rounded-lg border border-[#3A1A16]/15 px-2 py-2 text-xs"
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <label className="text-[#665650]">Tax</label>
        <select
          value={taxRate}
          onChange={(e) => setTaxRate(Number(e.target.value))}
          className="rounded-lg border border-[#3A1A16]/15 bg-white px-2 py-1.5"
        >
          <option value="0">No Tax</option>
          <option value="5">5% GST</option>
          <option value="12">12% GST</option>
          <option value="18">18% GST</option>
        </select>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-xs">
        <label className="flex items-center gap-2 text-[#665650]">
          <input
            checked={serviceEnabled}
            onChange={(e) => setServiceEnabled(e.target.checked)}
            type="checkbox"
            className="accent-[#C93E2B]"
          />{" "}
          Service charge
        </label>
        {serviceEnabled && (
          <input
            aria-label="Service charge percentage"
            type="number"
            min="0"
            value={serviceRate}
            onChange={(e) => setServiceRate(Number(e.target.value))}
            className="w-16 rounded-lg border border-[#3A1A16]/15 px-2 py-1"
          />
        )}
      </div>
      <div className="mt-4 space-y-2 text-sm text-[#665650]">
        <Row label="Subtotal" value={bill.subtotal} />
        {bill.discountAmount > 0 && (
          <Row label="Discount" value={-bill.discountAmount} />
        )}
        <Row
          label={`Tax${taxRate ? ` (${taxRate}%)` : ""}`}
          value={bill.taxAmount}
        />
        {serviceEnabled && (
          <Row label={`Service (${serviceRate}%)`} value={bill.serviceCharge} />
        )}
        <div className="flex justify-between border-t border-[#3A1A16]/15 pt-3 font-display text-2xl text-[#3A1A16]">
          <span>Total</span>
          <span>{formatCurrency(bill.grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}
function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>
        {value < 0 ? "−" : ""}
        {formatCurrency(Math.abs(value))}
      </span>
    </div>
  );
}
