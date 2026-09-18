
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Box,
  Link2,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import type {
  InventoryItem,
  InventoryResponse,
  MenuItem,
  MenuResponse,
} from "@/types/pos";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { ShortcutsHelpModal } from "@/components/shared/ShortcutsHelpModal";

type Filter = "all" | "low" | "out";

type NewItem = {
  name: string;
  unit: string;
  current_stock: string;
  low_stock_threshold: string;
};

const emptyNewItem: NewItem = {
  name: "",
  unit: "kg",
  current_stock: "",
  low_stock_threshold: "",
};

const stockStatus = (item: InventoryItem): "out" | "low" | "in" =>
  item.current_stock <= 0
    ? "out"
    : item.current_stock <= item.low_stock_threshold
      ? "low"
      : "in";

const statusLabel = (status: ReturnType<typeof stockStatus>) =>
  status === "out"
    ? "Out of Stock"
    : status === "low"
      ? "Low Stock"
      : "In Stock";

export default function InventoryDashboard() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [lowStock, setLowStock] = useState<InventoryItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [newItem, setNewItem] = useState<NewItem>(emptyNewItem);

  const [restock, setRestock] = useState<{
    id: string;
    amount: string;
  } | null>(null);

  const [link, setLink] = useState({
    inventoryId: "",
    menuItemId: "",
    quantity: "",
  });

  const [saving, setSaving] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        inventoryResponse,
        lowResponse,
        menuResponse,
      ] = await Promise.all([
        fetch("/api/inventory"),
        fetch("/api/inventory/low-stock"),
        fetch("/api/menu"),
      ]);

      if (
        !inventoryResponse.ok ||
        !lowResponse.ok ||
        !menuResponse.ok
      ) {
        throw new Error("Unable to load inventory data.");
      }

      const inventory =
        (await inventoryResponse.json()) as InventoryResponse;

      const low =
        (await lowResponse.json()) as InventoryResponse;

      const menu =
        (await menuResponse.json()) as MenuResponse;

      setItems(inventory.inventoryItems);
      setLowStock(low.inventoryItems);
      setMenuItems(menu.items);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load inventory data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveItem = async () => {
    const current_stock = Number(newItem.current_stock);
    const low_stock_threshold = Number(
      newItem.low_stock_threshold,
    );

    if (
      !newItem.name.trim() ||
      !newItem.unit.trim() ||
      !Number.isFinite(current_stock) ||
      current_stock < 0 ||
      !Number.isFinite(low_stock_threshold) ||
      low_stock_threshold < 0
    ) {
      setNotice(
        "Enter a name, unit, and valid non-negative stock values.",
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newItem.name.trim(),
          unit: newItem.unit.trim(),
          current_stock,
          low_stock_threshold,
          linked_menu_item_ids: [],
          ingredients: [],
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to add inventory item.");
      }

      setNewItem(emptyNewItem);
      setNotice("Inventory item added.");

      await load();
    } catch (saveError) {
      setNotice(
        saveError instanceof Error
          ? saveError.message
          : "Unable to add inventory item.",
      );
    } finally {
      setSaving(false);
    }
  };

  const restockItem = async () => {
    if (!restock) return;

    const item = items.find(
      (entry) => entry.id === restock.id,
    );

    const amount = Number(restock.amount);

    if (
      !item ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setNotice(
        "Enter a restock quantity greater than zero.",
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `/api/inventory/${item.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            current_stock: item.current_stock + amount,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Unable to restock item.");
      }

      setRestock(null);
      setNotice(`${item.name} restocked.`);

      await load();
    } catch (saveError) {
      setNotice(
        saveError instanceof Error
          ? saveError.message
          : "Unable to restock item.",
      );
    } finally {
      setSaving(false);
    }
  };

  const addLink = async () => {
    const item = items.find(
      (entry) => entry.id === link.inventoryId,
    );

    const quantity = Number(link.quantity);

    if (
      !item ||
      !link.menuItemId ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      setNotice(
        "Choose an inventory item, menu item, and quantity greater than zero.",
      );
      return;
    }

    const ingredients = [
      ...item.ingredients.filter(
        (entry) =>
          entry.menu_item_id !== link.menuItemId,
      ),
      {
        menu_item_id: link.menuItemId,
        inventory_item_id: item.id,
        quantity_used_per_order: quantity,
      },
    ];

    setSaving(true);

    try {
      const response = await fetch(
        `/api/inventory/${item.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ingredients,
            linked_menu_item_ids: ingredients.map(
              (entry) => entry.menu_item_id,
            ),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Unable to save menu link.");
      }

      setLink({
        inventoryId: "",
        menuItemId: "",
        quantity: "",
      });

      setNotice("Ingredient link saved.");

      await load();
    } catch (saveError) {
      setNotice(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save menu link.",
      );
    } finally {
      setSaving(false);
    }
  };

  const removeLink = async (
    item: InventoryItem,
    menuItemId: string,
  ) => {
    const ingredients = item.ingredients.filter(
      (entry) =>
        entry.menu_item_id !== menuItemId,
    );

    try {
      const response = await fetch(
        `/api/inventory/${item.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ingredients,
            linked_menu_item_ids: ingredients.map(
              (entry) => entry.menu_item_id,
            ),
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          "Unable to remove menu link.",
        );
      }

      setNotice("Ingredient link removed.");

      await load();
    } catch (removeError) {
      setNotice(
        removeError instanceof Error
          ? removeError.message
          : "Unable to remove menu link.",
      );
    }
  };

  const visibleItems = useMemo(
    () =>
      items.filter(
        (item) =>
          item.name
            .toLowerCase()
            .includes(search.toLowerCase()) &&
          (filter === "all" ||
            stockStatus(item) === filter),
      ),
    [items, search, filter],
  );

  const menuName = (id: string) =>
    menuItems.find((item) => item.id === id)?.name ??
    id;

  const shortcuts = [
    {
      key: "/",
      handler: () =>
        searchInputRef.current?.focus(),
      description: "Focus inventory search",
    },
    {
      key: "?",
      handler: () => setShowShortcuts(true),
      description: "Show keyboard shortcuts",
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#F3E9DC] px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
      <div className="flex h-full min-h-0 w-full flex-col">

        {/* HEADER */}
        <header className="mb-3 flex shrink-0 flex-col gap-3 sm:mb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[.22em] text-[#C93E2B] sm:text-[10px] sm:tracking-[.25em]">
              BhojanHub Operations
            </p>

            <h1 className="mt-1 font-display text-2xl leading-tight text-[#3A1A16] sm:text-4xl">
              Inventory management
            </h1>

            <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-[#665650] sm:text-xs">
              Keep stock levels and menu ingredient usage accurate.
            </p>

            <button
              type="button"
              onClick={() => setShowShortcuts(true)}
              className="mt-1.5 text-[10px] font-medium text-[#88756E] hover:text-[#C93E2B] sm:text-[11px]"
            >
              Press ? for shortcuts
            </button>
          </div>

          <button
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-[#3A1A16]/15 bg-[#FFFCF9] px-3.5 py-2.5 text-xs font-semibold text-[#3A1A16] sm:w-auto sm:py-2"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </header>

        {/* NOTICE */}
        {notice && (
          <div
            role="status"
            className="mb-3 flex shrink-0 items-start justify-between gap-3 rounded-xl border border-[#C93E2B]/20 bg-[#FCE4DE] px-3.5 py-2.5 text-[11px] leading-relaxed text-[#3A1A16] sm:px-4 sm:text-xs"
          >
            <span className="min-w-0">{notice}</span>

            <button
              onClick={() => setNotice("")}
              aria-label="Dismiss"
              className="shrink-0"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* BODY */}
        {error ? (
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-2xl border border-[#C93E2B]/25 bg-[#FFFCF9] p-6 text-center">
            <div>
              <p className="text-sm text-[#665650]">
                {error}
              </p>

              <button
                onClick={() => void load()}
                className="mt-4 rounded-xl bg-[#3A1A16] px-4 py-2 text-xs font-semibold text-[#F3E9DC]"
              >
                Retry
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[24px] border border-[#3A1A16]/10 bg-[#FFFCF9]">
            <div className="flex flex-col items-center px-5 text-center">
              <div className="mb-5 h-8 w-8 animate-spin rounded-full border-2 border-[#3A1A16]/10 border-t-[#C93E2B]" />

              <p className="font-display text-xl text-[#3A1A16]">
                Loading inventory
              </p>

              <p className="mt-1 font-sans text-[9px] uppercase tracking-[0.18em] text-[#88756E] sm:text-[10px] sm:tracking-[0.2em]">
                Preparing your workspace
              </p>
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-0.5 scrollbar-none sm:space-y-4">

            {/* STOCK ALERTS */}
            <section className="rounded-2xl border border-[#C93E2B]/20 bg-[#FFFCF9] p-3.5 shadow-sm sm:p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#FCE4DE] text-[#C93E2B]">
                  <AlertTriangle size={16} />
                </div>

                <div className="min-w-0">
                  <h2 className="font-display text-lg text-[#3A1A16] sm:text-xl">
                    Stock alerts{" "}
                    <span className="text-[#C93E2B]">
                      ({lowStock.length})
                    </span>
                  </h2>

                  <p className="mt-1 break-words text-[11px] leading-relaxed text-[#665650] sm:text-xs">
                    {lowStock.length
                      ? lowStock
                          .map(
                            (item) =>
                              `${item.name} (${Number(
                                item.current_stock.toFixed(2),
                              )} ${item.unit})`,
                          )
                          .join(" · ")
                      : "All tracked inventory is above its low-stock threshold."}
                  </p>
                </div>
              </div>
            </section>

            {/* STOCK + SIDE PANELS */}
            <div className="grid min-h-0 items-stretch gap-3 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-4">

              {/* STOCK OVERVIEW */}
              <section className="flex h-[520px] min-h-0 flex-col overflow-hidden rounded-2xl border border-[#3A1A16]/10 bg-[#FFFCF9] shadow-sm sm:h-[560px] lg:h-[600px] xl:h-[620px]">

                {/* STOCK HEADER */}
                <div className="shrink-0 border-b border-[#3A1A16]/10 p-3.5 sm:p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-[.16em] text-[#C93E2B] sm:text-[10px] sm:tracking-[.18em]">
                        Stock overview
                      </p>

                      <h2 className="font-display text-lg text-[#3A1A16] sm:text-xl">
                        All ingredients
                      </h2>
                    </div>

                    <span className="shrink-0 rounded-full bg-[#F3E9DC] px-2.5 py-1 text-[10px] font-semibold text-[#665650] sm:px-3 sm:text-[11px]">
                      {visibleItems.length} items
                    </span>
                  </div>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <label className="relative min-w-0 flex-1">
                      <Search
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8D7C74]"
                      />

                      <input
                        ref={searchInputRef}
                        value={search}
                        onChange={(event) =>
                          setSearch(event.target.value)
                        }
                        placeholder="Search inventory…"
                        className="w-full rounded-xl border border-[#3A1A16]/15 bg-white py-2.5 pl-8 pr-3 text-xs outline-none focus:border-[#C93E2B] sm:py-2"
                      />
                    </label>

                    <select
                      value={filter}
                      onChange={(event) =>
                        setFilter(
                          event.target.value as Filter,
                        )
                      }
                      className="w-full rounded-xl border border-[#3A1A16]/15 bg-white px-3 py-2.5 text-xs text-[#3A1A16] sm:w-auto sm:py-2"
                    >
                      <option value="all">
                        All statuses
                      </option>

                      <option value="low">
                        Low stock
                      </option>

                      <option value="out">
                        Out of stock
                      </option>
                    </select>
                  </div>
                </div>

                {/* ONLY STOCK TABLE AREA SCROLLS */}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-none">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-xs">
                      <thead className="sticky top-0 z-10 bg-[#F3E9DC] text-[9px] uppercase tracking-[.12em] text-[#8D7C74]">
                        <tr>
                          <th className="px-3 py-2.5 sm:px-4">
                            Item
                          </th>

                          <th className="px-3 py-2.5 sm:px-4">
                            Current stock
                          </th>

                          <th className="px-3 py-2.5 sm:px-4">
                            Threshold
                          </th>

                          <th className="px-3 py-2.5 sm:px-4">
                            Status
                          </th>

                          <th className="px-3 py-2.5 text-right sm:px-4">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {visibleItems.map((item) => {
                          const status =
                            stockStatus(item);

                          return (
                            <tr
                              key={item.id}
                              className="border-t border-[#3A1A16]/8"
                            >
                              <td className="px-3 py-2.5 sm:px-4">
                                <p className="font-semibold text-[#3A1A16]">
                                  {item.name}
                                </p>

                                <p className="text-[10px] text-[#8D7C74]">
                                  {item.unit}
                                </p>
                              </td>

                              <td className="px-3 py-2.5 font-semibold text-[#3A1A16] sm:px-4">
                                {Number(
                                  item.current_stock.toFixed(2),
                                )}{" "}
                                {item.unit}
                              </td>

                              <td className="px-3 py-2.5 text-[#665650] sm:px-4">
                                {Number(
                                  item.low_stock_threshold.toFixed(
                                    2,
                                  ),
                                )}{" "}
                                {item.unit}
                              </td>

                              <td className="px-3 py-2.5 sm:px-4">
                                <span
                                  className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                    status === "in"
                                      ? "bg-[#E8F3E7] text-[#3D6B3A]"
                                      : status === "low"
                                        ? "bg-[#FCE4DE] text-[#C93E2B]"
                                        : "bg-[#3A1A16] text-[#F3E9DC]"
                                  }`}
                                >
                                  {statusLabel(status)}
                                </span>
                              </td>

                              <td className="px-3 py-2.5 text-right sm:px-4">
                                <button
                                  onClick={() =>
                                    setRestock({
                                      id: item.id,
                                      amount: "",
                                    })
                                  }
                                  className="whitespace-nowrap rounded-lg border border-[#3A1A16]/15 px-2.5 py-1 text-[10px] font-semibold text-[#3A1A16]"
                                >
                                  Restock
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {!visibleItems.length && (
                      <p className="p-6 text-center text-xs text-[#665650]">
                        No inventory items match this filter.
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* SIDE PANELS */}
              <aside className="min-w-0 space-y-3 sm:space-y-4">

                {/* ADD INVENTORY */}
                <Panel
                  title="Add inventory item"
                  icon={<Plus size={14} />}
                >
                  <Field
                    label="Item name"
                    value={newItem.name}
                    onChange={(value) =>
                      setNewItem({
                        ...newItem,
                        name: value,
                      })
                    }
                  />

                  <Field
                    label="Unit"
                    value={newItem.unit}
                    onChange={(value) =>
                      setNewItem({
                        ...newItem,
                        unit: value,
                      })
                    }
                  />

                  <Field
                    label="Initial stock"
                    type="number"
                    value={newItem.current_stock}
                    onChange={(value) =>
                      setNewItem({
                        ...newItem,
                        current_stock: value,
                      })
                    }
                  />

                  <Field
                    label="Low-stock threshold"
                    type="number"
                    value={
                      newItem.low_stock_threshold
                    }
                    onChange={(value) =>
                      setNewItem({
                        ...newItem,
                        low_stock_threshold: value,
                      })
                    }
                  />

                  <button
                    onClick={() => void saveItem()}
                    disabled={saving}
                    className="w-full rounded-xl bg-[#3A1A16] px-4 py-2.5 text-xs font-semibold text-[#F3E9DC] sm:py-2"
                  >
                    Add item
                  </button>
                </Panel>

                {/* LINK MENU INGREDIENT */}
                <Panel
                  title="Link menu ingredient"
                  icon={<Link2 size={14} />}
                >
                  <Select
                    label="Inventory item"
                    value={link.inventoryId}
                    onChange={(value) =>
                      setLink({
                        ...link,
                        inventoryId: value,
                      })
                    }
                    options={items.map((item) => ({
                      value: item.id,
                      label: item.name,
                    }))}
                  />

                  <Select
                    label="Menu item"
                    value={link.menuItemId}
                    onChange={(value) =>
                      setLink({
                        ...link,
                        menuItemId: value,
                      })
                    }
                    options={menuItems.map((item) => ({
                      value: item.id,
                      label: item.name,
                    }))}
                  />

                  <Field
                    label="Quantity used per order"
                    type="number"
                    value={link.quantity}
                    onChange={(value) =>
                      setLink({
                        ...link,
                        quantity: value,
                      })
                    }
                  />

                  <button
                    onClick={() => void addLink()}
                    disabled={saving}
                    className="w-full rounded-xl bg-[#C93E2B] px-4 py-2.5 text-xs font-semibold text-white sm:py-2"
                  >
                    Save link
                  </button>
                </Panel>
              </aside>
            </div>

            {/* INGREDIENT LINKS */}
            <section className="rounded-2xl border border-[#3A1A16]/10 bg-[#FFFCF9] p-3.5 shadow-sm sm:p-4">
              <div className="flex items-center gap-2">
                <Box
                  size={15}
                  className="shrink-0 text-[#C93E2B]"
                />

                <div className="min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-[.16em] text-[#C93E2B] sm:text-[10px] sm:tracking-[.18em]">
                    Ingredient links
                  </p>

                  <h2 className="font-display text-lg text-[#3A1A16] sm:text-xl">
                    Menu consumption rules
                  </h2>
                </div>
              </div>

              <div className="mt-3 grid gap-2.5 lg:grid-cols-2">
                {items.flatMap((item) =>
                  item.ingredients.map(
                    (ingredient) => (
                      <div
                        key={`${item.id}-${ingredient.menu_item_id}`}
                        className="flex items-start justify-between gap-3 rounded-xl bg-[#F3E9DC]/65 p-2.5"
                      >
                        <p className="min-w-0 text-[11px] leading-relaxed text-[#3A1A16] sm:text-xs">
                          <span className="font-semibold">
                            {menuName(
                              ingredient.menu_item_id,
                            )}
                          </span>{" "}
                          uses{" "}
                          {Number(
                            ingredient.quantity_used_per_order.toFixed(
                              2,
                            ),
                          )}{" "}
                          {item.unit} of{" "}
                          {item.name}
                        </p>

                        <button
                          onClick={() =>
                            void removeLink(
                              item,
                              ingredient.menu_item_id,
                            )
                          }
                          className="shrink-0 text-[10px] font-semibold text-[#C93E2B] sm:text-[11px]"
                        >
                          Remove
                        </button>
                      </div>
                    ),
                  ),
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* RESTOCK MODAL */}
      {restock && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-[#3A1A16]/45 p-3 sm:p-4"
        >
          <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-[#FFFCF9] p-4 shadow-xl sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl text-[#3A1A16] sm:text-2xl">
                Restock item
              </h2>

              <button
                onClick={() => setRestock(null)}
                className="shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-[#665650] sm:text-sm">
              Add stock to{" "}
              {
                items.find(
                  (item) =>
                    item.id === restock.id,
                )?.name
              }
              .
            </p>

            <Field
              label="Quantity to add"
              type="number"
              value={restock.amount}
              onChange={(amount) =>
                setRestock({
                  ...restock,
                  amount,
                })
              }
            />

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => setRestock(null)}
                className="rounded-xl px-4 py-2.5 text-xs font-semibold sm:py-2"
              >
                Cancel
              </button>

              <button
                onClick={() => void restockItem()}
                disabled={saving}
                className="rounded-xl bg-[#C93E2B] px-4 py-2.5 text-xs font-semibold text-white sm:py-2"
              >
                Restock
              </button>
            </div>
          </div>
        </div>
      )}

      <ShortcutsHelpModal
        isOpen={showShortcuts}
        onClose={() =>
          setShowShortcuts(false)
        }
        shortcuts={shortcuts}
      />
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#3A1A16]/10 bg-[#FFFCF9] p-3.5 shadow-sm sm:p-4">
      <h2 className="flex items-center gap-2 font-display text-lg text-[#3A1A16] sm:text-xl">
        {icon}
        {title}
      </h2>

      <div className="mt-3 space-y-2.5">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
}) {
  return (
    <label className="block text-[11px] font-semibold text-[#665650]">
      {label}

      <input
        type={type}
        min={type === "number" ? "0" : undefined}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-1 w-full rounded-xl border border-[#3A1A16]/15 bg-white px-3 py-2.5 text-xs font-normal text-[#3A1A16] outline-none focus:border-[#C93E2B] sm:py-2"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
  }>;
}) {
  return (
    <label className="block text-[11px] font-semibold text-[#665650]">
      {label}

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-1 w-full rounded-xl border border-[#3A1A16]/15 bg-white px-3 py-2.5 text-xs font-normal text-[#3A1A16] outline-none focus:border-[#C93E2B] sm:py-2"
      >
        <option value="">Select…</option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}