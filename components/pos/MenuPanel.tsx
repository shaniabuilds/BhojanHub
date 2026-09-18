
"use client";

import type { RefObject } from "react";
import {
  Search,
  Plus,
  UtensilsCrossed,
  Pizza,
  Beef,
  Soup,
  Coffee,
  CakeSlice,
  Salad,
  IceCream,
  Drumstick,
  GlassWater,
  Croissant,
  Flame,
  Egg,
  Sandwich,
} from "lucide-react";

import { Category, MenuItem } from "./types";
import { formatCurrency } from "./calculations";

interface Props {
  query: string;
  onQuery: (value: string) => void;
  category: Category;
  categories: Category[];
  onCategory: (value: Category) => void;
  items: MenuItem[];
  onAdd: (item: MenuItem) => void;
  searchInputRef?: RefObject<HTMLInputElement>;
  selectedIndex?: number;
}

/* =========================================================
   CATEGORY COLOR THEMES
========================================================= */

const categoryTheme: Record<
  string,
  { bg: string; iconBg: string; iconColor: string }
> = {
  Indian: { bg: "#FBEFE4", iconBg: "#F3D9BE", iconColor: "#B5541A" },
  Biryani: { bg: "#FDF0E2", iconBg: "#F4D9AE", iconColor: "#A85A15" },
  Chinese: { bg: "#FBECEC", iconBg: "#F3CFCF", iconColor: "#C0392B" },
  "Fast Food": { bg: "#FDF3E0", iconBg: "#F6DFA8", iconColor: "#B4780A" },
  Starters: { bg: "#F1F1E8", iconBg: "#D9DABC", iconColor: "#6B7A2E" },
  "South Indian": { bg: "#FDF3E5", iconBg: "#F4DCAF", iconColor: "#B06A16" },
  "Naan & Roti": { bg: "#F7EEE2", iconBg: "#E8D2B4", iconColor: "#8A5A2B" },
  Rice: { bg: "#F4F1E6", iconBg: "#E1DAB9", iconColor: "#7A6E2E" },
  Breakfast: { bg: "#FDF0E9", iconBg: "#F5D8C4", iconColor: "#B25E2C" },
  Combos: { bg: "#F2ECF7", iconBg: "#DCCBEC", iconColor: "#6E3F9E" },
  Drinks: { bg: "#E9F2F6", iconBg: "#C7E0EA", iconColor: "#1E7A9E" },
  Desserts: { bg: "#FBEAF0", iconBg: "#F4C9DA", iconColor: "#C0397D" },
};

const defaultTheme = {
  bg: "#F3E9DC",
  iconBg: "#E4D4C0",
  iconColor: "#7A3026",
};

function getCategoryTheme(category: string) {
  return categoryTheme[category] ?? defaultTheme;
}

/* =========================================================
   ICON HELPER
========================================================= */

function getItemIcon(item: MenuItem) {
  const text = `${item.name} ${item.category}`.toLowerCase();

  if (text.includes("pizza")) return Pizza;
  if (text.includes("burger")) return Beef;

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
    text.includes("chai")
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

/* =========================================================
   MENU PANEL
========================================================= */

export function MenuPanel({
  query,
  onQuery,
  category,
  categories,
  onCategory,
  items,
  onAdd,
  searchInputRef,
  selectedIndex,
}: Props) {
  return (
    <section className="flex h-[calc(100vh-20px)] min-h-0 min-w-0 flex-col overflow-hidden rounded-[20px] border border-[#3A1A16]/10 bg-[#FFFCF9] p-3.5 shadow-[0_10px_35px_rgba(58,26,22,0.04)] sm:h-[calc(100vh-32px)] sm:p-5 lg:h-full">
     {/* =====================================================
          FIXED MENU HEADER
      ===================================================== */}

      <div className="shrink-0">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C93E2B]" />

              <p className="text-[9px] font-semibold uppercase tracking-[.2em] text-[#C93E2B]">
                Menu
              </p>
            </div>

            <h1 className="mt-0.5 font-display text-2xl font-medium leading-tight text-[#3A1A16]">
              Build an order
            </h1>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-[#F3E9DC]/70 px-2.5 py-1">
            <UtensilsCrossed size={11} className="text-[#C93E2B]" />

            <span className="text-[9px] font-medium text-[#665650]">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          </div>
        </div>

        {/* SEARCH */}

        <label className="relative mt-3 block">
          <Search
            size={15}
            strokeWidth={1.8}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8D7C74]"
          />

          <input
            ref={searchInputRef}
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search menu items..."
            className="w-full rounded-lg border border-[#3A1A16]/12 bg-white py-2 pl-9 pr-3 text-xs text-[#3A1A16] outline-none transition placeholder:text-[#9A8982] hover:border-[#3A1A16]/20 focus:border-[#C93E2B] focus:ring-2 focus:ring-[#C93E2B]/8"
          />
        </label>

        {/* CATEGORIES */}

        <div className="-mx-1 mt-3 overflow-x-auto px-1 pb-1 scrollbar-none">
          <div className="flex w-max gap-1.5">
            {categories.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => onCategory(tab)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-semibold transition active:scale-[.97] ${
                  category === tab
                    ? "bg-[#3A1A16] text-[#F3E9DC] shadow-sm"
                    : "border border-[#3A1A16]/10 bg-white text-[#665650] hover:border-[#3A1A16]/20 hover:bg-[#F3E9DC]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* =====================================================
          SCROLLABLE MENU CARDS
      ===================================================== */}

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain px-0.5 pb-1 pt-1 scrollbar-none">
        {items.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item, index) => {
              const Icon = getItemIcon(item);
              const theme = getCategoryTheme(item.category);
              const isSelected = selectedIndex === index;
              const shortcutNumber = index < 9 ? index + 1 : null;

              return (
                <article
                  key={item.id}
                  className={`group relative flex flex-col overflow-hidden rounded-[14px] border bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C93E2B]/25 hover:shadow-[0_10px_24px_rgba(58,26,22,0.10)] ${
                    isSelected
                      ? "border-[#C93E2B] shadow-[0_0_0_2px_rgba(201,62,43,0.18)]"
                      : "border-[#3A1A16]/10"
                  }`}
                >
                  {shortcutNumber && (
                    <div className="absolute right-1.5 top-1.5 z-20 grid h-4 w-4 place-items-center rounded-full bg-[#3A1A16]/80 text-[8px] font-bold text-[#F3E9DC]">
                      {shortcutNumber}
                    </div>
                  )}

                  {/* ICON HEADER */}

                  <div
                    className="flex h-14 w-full items-center justify-start px-3"
                    style={{ backgroundColor: theme.bg }}
                  >
                    <div className="grid h-8 w-8 place-items-center rounded-lg">
                      <span className="text-4xl leading-none">
                        {item.emoji || item.image || "🍽️"}
                      </span>
                    </div>
                  </div>

                  {/* CONTENT */}

                  <div className="flex flex-1 flex-col gap-1.5 p-2.5">
                    <div>
                      <h2 className="truncate font-display text-[15px] font-medium leading-tight text-[#3A1A16]">
                        {item.name}
                      </h2>

                      <p className="mt-0.5 truncate text-[10px] leading-tight text-[#8D7C74]">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                      <span className="font-display text-sm font-semibold leading-none text-[#3A1A16]">
                        {formatCurrency(item.price)}
                      </span>

                      <button
                        type="button"
                        onClick={() => onAdd(item)}
                        aria-label={`Add ${item.name}`}
                        className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#3A1A16] text-[#F3E9DC] shadow-sm transition-all duration-150 hover:bg-[#C93E2B] active:scale-90"
                      >
                        <Plus size={13} strokeWidth={2.4} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[16px] border border-dashed border-[#3A1A16]/12 bg-[#F3E9DC]/30 px-6 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[#F3E9DC] text-[#C93E2B]">
              <Search size={16} />
            </div>

            <h2 className="mt-3 font-display text-lg text-[#3A1A16]">
              No menu items found
            </h2>

            <p className="mt-1 max-w-xs text-[10px] leading-5 text-[#76655F]">
              Try another search term or choose a different category.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}