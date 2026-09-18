
"use client";

import { Check, Printer, PlusCircle } from "lucide-react";
import { Bill } from "./shared";
import { CartItem, OrderDetails, PaymentMethod } from "./types";
import { formatCurrency } from "./calculations";

interface Props {
  orderNo: number;
  date: Date;
  details: OrderDetails;
  items: CartItem[];
  bill: Bill;
  payment: PaymentMethod;
  cashReceived: number;
  onNew: () => void;
}

export function Receipt({
  orderNo,
  date,
  details,
  items,
  bill,
  payment,
  cashReceived,
  onNew,
}: Props) {
  const change = Math.max(
    0,
    cashReceived - bill.grandTotal,
  );

  return (
    <div className="mx-auto w-full max-w-xl px-1 sm:px-0">
      {/* =====================================================
          RECEIPT CARD
      ===================================================== */}
      <div className="overflow-hidden rounded-[20px] border border-[#3A1A16]/10 bg-[#FFFCF9] shadow-[0_16px_45px_rgba(58,26,22,0.08)] sm:rounded-[26px] sm:shadow-[0_20px_60px_rgba(58,26,22,0.10)]">
        <div
          id="receipt"
          className="px-4 py-5 text-[#3A1A16] sm:px-8 sm:py-8"
        >
          {/* =================================================
              BRAND
          ================================================= */}
          <div className="text-center">
            <div className="mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#F3E9DC] sm:mb-3 sm:h-10 sm:w-10">
              <Check
                size={15}
                strokeWidth={2}
                className="text-[#C93E2B] sm:h-[17px] sm:w-[17px]"
              />
            </div>

            <p className="font-display text-3xl font-medium leading-none sm:text-4xl">
              BhojanHub
            </p>

            <p className="mt-2 text-[8px] uppercase tracking-[0.16em] text-[#8D7C74] sm:text-[10px] sm:tracking-[0.2em]">
              Fresh food, thoughtfully served
            </p>

            <div className="mx-auto mt-4 inline-flex max-w-full flex-wrap items-center justify-center rounded-full bg-[#F3E9DC]/70 px-2.5 py-1.5 sm:mt-5 sm:px-3">
              <span className="text-[9px] font-semibold text-[#3A1A16] sm:text-[10px]">
                Order #{String(orderNo).padStart(4, "0")}
              </span>

              <span className="mx-1.5 text-[#9A8982] sm:mx-2">
                ·
              </span>

              <span className="text-[9px] text-[#665650] sm:text-[10px]">
                {date.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* =================================================
              ORDER DETAILS
          ================================================= */}
          <div className="my-5 border-y border-dashed border-[#3A1A16]/15 py-3.5 sm:my-6 sm:py-4">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[#C93E2B] sm:text-[9px] sm:tracking-[0.18em]">
                Order details
              </p>

              <span className="shrink-0 rounded-full border border-[#3A1A16]/10 px-2.5 py-1 text-[8px] font-semibold text-[#665650] sm:text-[9px]">
                {details.type}
              </span>
            </div>

            {details.table && (
              <p className="mt-2 text-[11px] text-[#665650] sm:text-xs">
                Table ·{" "}
                <span className="font-semibold text-[#3A1A16]">
                  {details.table}
                </span>
              </p>
            )}

            {details.type === "Delivery" && (
              <div className="mt-3 rounded-xl bg-[#F3E9DC]/50 p-2.5 sm:p-3">
                <p className="text-[11px] font-semibold text-[#3A1A16] sm:text-xs">
                  {details.delivery.name}
                </p>

                <p className="mt-1 text-[10px] text-[#665650] sm:text-[11px]">
                  {details.delivery.phone}
                </p>

                <p className="mt-1 break-words text-[10px] leading-4 text-[#665650] sm:text-[11px] sm:leading-5">
                  {details.delivery.address}
                </p>
              </div>
            )}
          </div>

          {/* =================================================
              ITEMS
          ================================================= */}
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[#C93E2B] sm:text-[9px] sm:tracking-[0.18em]">
                Items
              </p>

              <p className="shrink-0 text-[9px] text-[#8D7C74] sm:text-[10px]">
                {items.reduce(
                  (total, item) =>
                    total + item.quantity,
                  0,
                )}{" "}
                items
              </p>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex min-w-0 items-start justify-between gap-3 sm:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-[#3A1A16] sm:text-xs">
                      {item.name}
                    </p>

                    <p className="mt-0.5 text-[9px] text-[#8D7C74] sm:text-[10px]">
                      {formatCurrency(item.price)} ×{" "}
                      {item.quantity}
                    </p>
                  </div>

                  <span className="shrink-0 text-[11px] font-semibold text-[#3A1A16] sm:text-xs">
                    {formatCurrency(
                      item.price * item.quantity,
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* =================================================
              BILL SUMMARY
          ================================================= */}
          <div className="mt-5 border-t border-[#3A1A16]/10 pt-3.5 sm:mt-6 sm:pt-4">
            <div className="space-y-1.5 text-[10px] text-[#665650] sm:space-y-2 sm:text-xs">
              <Line
                label="Subtotal"
                value={bill.subtotal}
              />

              {bill.discountAmount > 0 && (
                <Line
                  label="Discount"
                  value={-bill.discountAmount}
                />
              )}

              <Line
                label="Tax"
                value={bill.taxAmount}
              />

              {bill.serviceCharge > 0 && (
                <Line
                  label="Service charge"
                  value={bill.serviceCharge}
                />
              )}
            </div>

            {/* GRAND TOTAL */}
            <div className="mt-3.5 rounded-xl bg-[#3A1A16] px-3.5 py-3.5 text-[#F3E9DC] sm:mt-4 sm:rounded-2xl sm:px-4 sm:py-4">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[#F3E9DC]/55 sm:text-[9px] sm:tracking-[0.18em]">
                    Grand total
                  </p>

                  <p className="mt-1 font-display text-xl leading-none sm:text-2xl">
                    {formatCurrency(bill.grandTotal)}
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-[#F3E9DC]/10 px-2.5 py-1 text-[8px] font-semibold text-[#F3E9DC] sm:text-[9px]">
                  {payment}
                </span>
              </div>
            </div>

            {/* CASH INFO */}
            {payment === "Cash" && (
              <div className="mt-3 rounded-xl bg-[#F3E9DC]/45 px-3 py-2.5 text-[10px] sm:mt-4 sm:px-3.5 sm:py-3 sm:text-xs">
                <div className="space-y-1.5 sm:space-y-2">
                  <Line
                    label="Cash received"
                    value={cashReceived}
                  />

                  <Line
                    label="Change"
                    value={change}
                  />
                </div>
              </div>
            )}
          </div>

          {/* =================================================
              FOOTER MESSAGE
          ================================================= */}
          <div className="mt-5 border-t border-[#3A1A16]/8 pt-4 text-center sm:mt-6 sm:pt-5">
            <p className="font-display text-base text-[#3A1A16] sm:text-lg">
              Thank you for dining with us.
            </p>

            <p className="mt-1 text-[8px] uppercase tracking-[0.13em] text-[#9A8982] sm:text-[9px] sm:tracking-[0.16em]">
              We look forward to serving you again
            </p>
          </div>
        </div>

        {/* =====================================================
            ACTIONS
        ===================================================== */}
        <div className="border-t border-[#3A1A16]/10 bg-[#F3E9DC]/35 p-3 sm:p-5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => window.print()}
              className="
                inline-flex
                min-h-10
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-[#3A1A16]/15
                bg-[#FFFCF9]
                px-3
                py-2.5
                text-[11px]
                font-semibold
                text-[#3A1A16]
                transition-all
                duration-200
                hover:border-[#3A1A16]/25
                hover:bg-white
                active:scale-[0.98]
                sm:min-h-11
                sm:px-4
                sm:py-3
                sm:text-xs
              "
            >
              <Printer size={14} className="sm:h-[15px] sm:w-[15px]" />
              Print Receipt
            </button>

            <button
              type="button"
              onClick={onNew}
              className="
                inline-flex
                min-h-10
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-[#C93E2B]
                px-3
                py-2.5
                text-[11px]
                font-semibold
                text-white
                shadow-sm
                transition-all
                duration-200
                hover:bg-[#A93324]
                hover:shadow-md
                active:scale-[0.98]
                sm:min-h-11
                sm:px-4
                sm:py-3
                sm:text-xs
              "
            >
              <PlusCircle
                size={14}
                className="sm:h-[15px] sm:w-[15px]"
              />
              New Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Line({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <span className="truncate">{label}</span>

      <span className="shrink-0 font-medium text-[#3A1A16]">
        {value < 0 ? "−" : ""}
        {formatCurrency(Math.abs(value))}
      </span>
    </div>
  );
}