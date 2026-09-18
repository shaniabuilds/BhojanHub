
"use client";

import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

import type { CartItem } from "./types";
import { formatCurrency } from "./calculations";

interface Props {
  items: CartItem[];
  changeQuantity: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
}

export function CartPanel({
  items,
  changeQuantity,
  removeItem,
}: Props) {
  if (!items.length) {
    return (
      <div className="flex min-h-[140px] flex-col items-center justify-center rounded-[14px] border border-dashed border-[#3A1A16]/12 bg-[#F3E9DC]/30 px-4 py-6 text-center">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-[#F3E9DC] text-[#C93E2B]">
          <ShoppingBag size={15} />
        </div>

        <p className="mt-2.5 font-display text-base text-[#3A1A16]">
          Your order is empty
        </p>

        <p className="mt-0.5 max-w-[220px] text-[10px] leading-4 text-[#76655F]">
          Add items from the menu to start building the order.
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[280px] space-y-1.5 overflow-y-auto pr-0.5 scrollbar-none sm:max-h-[320px]">
      {items.map((item) => (
        <div
          key={item.id}
          className="
            flex min-w-0 items-center gap-1.5
            rounded-[12px]
            border border-[#3A1A16]/8
            bg-white
            px-2 py-2
            sm:gap-2 sm:px-2.5
          "
        >
          {/* NAME + UNIT PRICE */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold leading-tight text-[#3A1A16] sm:text-[12.5px]">
              {item.name}
            </p>

            <p className="mt-0.5 truncate text-[9px] leading-tight text-[#8D7C74] sm:text-[10px]">
              {formatCurrency(item.price)} each
            </p>
          </div>

          {/* QTY STEPPER */}
          <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-[#3A1A16]/10 bg-[#F3E9DC]/60 px-0.5 py-0.5 sm:gap-1 sm:px-1 sm:py-1">
            <button
              type="button"
              onClick={() => changeQuantity(item.id, -1)}
              aria-label={`Decrease ${item.name} quantity`}
              className="
                grid h-5 w-5 place-items-center
                rounded-full
                text-[#3A1A16]
                transition
                hover:bg-white
                active:scale-90
                sm:h-6 sm:w-6
              "
            >
              <Minus
                size={10}
                strokeWidth={2.4}
                className="sm:hidden"
              />
              <Minus
                size={11}
                strokeWidth={2.4}
                className="hidden sm:block"
              />
            </button>

            <span className="w-3 text-center text-[10px] font-semibold text-[#3A1A16] sm:w-4 sm:text-[11px]">
              {item.quantity}
            </span>

            <button
              type="button"
              onClick={() => changeQuantity(item.id, 1)}
              aria-label={`Increase ${item.name} quantity`}
              className="
                grid h-5 w-5 place-items-center
                rounded-full
                text-[#3A1A16]
                transition
                hover:bg-white
                active:scale-90
                sm:h-6 sm:w-6
              "
            >
              <Plus
                size={10}
                strokeWidth={2.4}
                className="sm:hidden"
              />
              <Plus
                size={11}
                strokeWidth={2.4}
                className="hidden sm:block"
              />
            </button>
          </div>

          {/* LINE TOTAL */}
          <span className="w-12 shrink-0 truncate text-right text-[10.5px] font-semibold text-[#3A1A16] sm:w-14 sm:text-[12.5px]">
            {formatCurrency(item.price * item.quantity)}
          </span>

          {/* REMOVE */}
          <button
            type="button"
            onClick={() => removeItem(item.id)}
            aria-label={`Remove ${item.name}`}
            className="
              shrink-0 rounded-full p-1
              text-[#B5A79E]
              transition
              hover:bg-[#FCE4DE]
              hover:text-[#C93E2B]
              active:scale-90
            "
          >
            <Trash2 size={12} className="sm:hidden" />
            <Trash2 size={13} className="hidden sm:block" />
          </button>
        </div>
      ))}
    </div>
  );
}