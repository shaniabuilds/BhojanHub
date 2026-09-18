
"use client";

import { PaymentMethod } from "./types";
import { formatCurrency } from "./calculations";

interface Props {
  method: PaymentMethod;
  setMethod: (method: PaymentMethod) => void;
  received: string;
  setReceived: (value: string) => void;
  total: number;
  onComplete: () => void;
}

export function PaymentSection({
  method,
  setMethod,
  received,
  setReceived,
  total,
  onComplete,
}: Props) {
  const methods: PaymentMethod[] = ["Cash", "Card", "UPI"];

  const change = Math.max(
    0,
    Number(received || 0) - total,
  );

  return (
    <div className="mt-4 border-t border-[#3A1A16]/10 pt-4 sm:mt-5 sm:pt-4">
      {/* PAYMENT TITLE */}
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#C93E2B] sm:text-[10px] sm:tracking-[0.18em]">
        Payment
      </p>

      {/* PAYMENT METHODS */}
      <div className="mt-2 grid grid-cols-3 gap-1">
        {methods.map((entry) => {
          const isActive = method === entry;

          return (
            <button
              key={entry}
              type="button"
              onClick={() => setMethod(entry)}
              className={`
                min-w-0
                rounded-lg
                border
                px-1.5
                py-2
                text-[10px]
                font-semibold
                transition
                active:scale-[0.98]
                sm:px-2
                sm:text-xs
                ${
                  isActive
                    ? "border-[#C93E2B] bg-[#FCE4DE] text-[#7A3026]"
                    : "border-[#3A1A16]/10 bg-white text-[#665650] hover:border-[#3A1A16]/20 hover:bg-[#F3E9DC]/50"
                }
              `}
            >
              {entry}
            </button>
          );
        })}
      </div>

      {/* CASH */}
      {method === "Cash" && (
        <div className="mt-3">
          <input
            aria-label="Cash received"
            type="number"
            min="0"
            inputMode="decimal"
            value={received}
            onChange={(e) => setReceived(e.target.value)}
            placeholder="Cash received"
            className="
              h-10
              w-full
              min-w-0
              rounded-lg
              border
              border-[#3A1A16]/15
              bg-white
              px-2.5
              text-xs
              text-[#3A1A16]
              outline-none
              transition
              placeholder:text-[#8D7C74]
              focus:border-[#C93E2B]
              focus:ring-2
              focus:ring-[#C93E2B]/10
              sm:h-11
              sm:px-3
              sm:text-sm
            "
          />

          <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-[#665650] sm:text-xs">
            <span>Change</span>

            <strong className="shrink-0 text-[#3A1A16]">
              {formatCurrency(change)}
            </strong>
          </div>
        </div>
      )}

      {/* UPI */}
      {method === "UPI" && (
        <p className="mt-3 rounded-lg border border-[#3A1A16]/8 bg-[#F3E9DC] px-2.5 py-2 text-[10px] leading-4 text-[#665650] sm:text-xs sm:leading-5">
          UPI confirmation will be recorded when payment is
          completed.
        </p>
      )}

      {/* COMPLETE PAYMENT */}
      <button
        type="button"
        onClick={onComplete}
        className="
          mt-3
          flex
          min-h-11
          w-full
          items-center
          justify-center
          rounded-xl
          bg-[#3A1A16]
          px-3
          py-2.5
          text-center
          text-[11px]
          font-semibold
          leading-4
          text-[#F3E9DC]
          transition
          hover:bg-[#C93E2B]
          active:scale-[0.99]
          sm:mt-4
          sm:min-h-12
          sm:px-4
          sm:py-3
          sm:text-sm
        "
      >
        <span className="truncate">
          Complete Payment · {formatCurrency(total)}
        </span>
      </button>
    </div>
  );
}