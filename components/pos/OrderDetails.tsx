

"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Clock } from "lucide-react";
import { OrderDetails as Details, OrderType } from "./types";
import type { Table, TablesResponse } from "@/types/pos";

interface Props {
  details: Details;
  setDetails: (value: Details) => void;
}

const fallbackTables: Table[] = Array.from({ length: 8 }, (_, i) => ({
  id: `table-${i + 1}`,
  table_number: `Table ${String(i + 1).padStart(2, "0")}`,
  capacity: 4,
  status: "available",
  current_order_id: null,
}));

export function OrderDetails({ details, setDetails }: Props) {
  const types: OrderType[] = ["Dine In", "Takeaway", "Delivery"];

  const [tables, setTables] = useState<Table[]>(fallbackTables);
  const [loadingTables, setLoadingTables] = useState(false);

  const fetchTables = async () => {
    setLoadingTables(true);

    try {
      const res = await fetch("/api/tables");

      if (res.ok) {
        const data = (await res.json()) as TablesResponse;

        if (data.tables && data.tables.length > 0) {
          setTables(data.tables);
        }
      }
    } catch {
      // Keep existing tables on failure
    } finally {
      setLoadingTables(false);
    }
  };

  useEffect(() => {
    void fetchTables();
  }, []);

  const update = (
    key: "name" | "phone" | "address",
    value: string,
  ) =>
    setDetails({
      ...details,
      delivery: {
        ...details.delivery,
        [key]: value,
      },
    });

  const selectedTableObj = tables.find(
    (t) =>
      t.table_number.toLowerCase() ===
      details.table.toLowerCase(),
  );

  return (
    <div className="mt-4 border-t border-[#3A1A16]/10 pt-4 sm:mt-5 sm:pt-4">
      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#C93E2B] sm:text-[10px] sm:tracking-[0.18em]">
          Order type
        </p>

        {details.type === "Dine In" && (
          <button
            type="button"
            onClick={() => void fetchTables()}
            disabled={loadingTables}
            className="shrink-0 rounded-md px-1.5 py-1 text-[9px] font-medium text-[#665650] transition hover:bg-[#F3E9DC] hover:text-[#3A1A16] disabled:cursor-not-allowed disabled:opacity-50 sm:text-[10px]"
          >
            {loadingTables ? "Syncing..." : "Sync tables"}
          </button>
        )}
      </div>

      {/* =====================================================
          ORDER TYPE TABS
      ===================================================== */}
      <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-[#F3E9DC] p-1">
        {types.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() =>
              setDetails({
                ...details,
                type,
              })
            }
            className={`
              min-w-0
              rounded-lg
              px-1.5
              py-2
              text-[10px]
              font-semibold
              transition
              active:scale-[0.98]
              sm:px-2
              sm:text-xs
              ${
                details.type === type
                  ? "bg-white text-[#3A1A16] shadow-sm"
                  : "text-[#665650] hover:bg-white/50"
              }
            `}
          >
            <span className="block truncate">
              {type}
            </span>
          </button>
        ))}
      </div>

      {/* =====================================================
          DINE IN
      ===================================================== */}
      {details.type === "Dine In" && (
        <div className="mt-3 min-w-0">
          <select
            aria-label="Table"
            value={details.table}
            onFocus={() => void fetchTables()}
            onChange={(e) =>
              setDetails({
                ...details,
                table: e.target.value,
              })
            }
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
              focus:border-[#C93E2B]
              focus:ring-2
              focus:ring-[#C93E2B]/10
              sm:h-11
              sm:px-3
              sm:text-sm
            "
          >
            <option value="">Select table</option>

            {tables.map((table) => {
              const isCurrentSelected =
                details.table.toLowerCase() ===
                table.table_number.toLowerCase();

              const isOccupied =
                table.status === "occupied" &&
                !isCurrentSelected;

              const isReserved =
                table.status === "reserved";

              let label = `${table.table_number} (${table.capacity} seats)`;

              if (table.status === "occupied") {
                label = `${table.table_number} — (Occupied · Active Order)`;
              } else if (isReserved) {
                label = `${table.table_number} — (Reserved${
                  table.notes
                    ? `: ${table.notes}`
                    : ""
                })`;
              }

              return (
                <option
                  key={table.id}
                  value={table.table_number}
                  disabled={isOccupied}
                  className={
                    isOccupied
                      ? "bg-gray-50 text-gray-400"
                      : ""
                  }
                >
                  {label}
                </option>
              );
            })}
          </select>

          {/* Reserved guidance */}
          {selectedTableObj?.status === "reserved" && (
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-purple-200 bg-purple-50 p-2.5 text-[10px] leading-4 text-purple-900 sm:text-[11px] sm:leading-5">
              <Clock
                size={13}
                className="mt-0.5 shrink-0 text-purple-600 sm:h-[14px] sm:w-[14px]"
              />

              <span className="min-w-0">
                <strong>Reserved Table:</strong>{" "}
                {selectedTableObj.notes ||
                  "Marked reserved by host"}
                . Staff may seat guest if party matches.
              </span>
            </div>
          )}

          {/* Occupied guidance */}
          {selectedTableObj?.status === "occupied" && (
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[10px] leading-4 text-amber-900 sm:text-[11px] sm:leading-5">
              <AlertCircle
                size={13}
                className="mt-0.5 shrink-0 text-amber-600 sm:h-[14px] sm:w-[14px]"
              />

              <span className="min-w-0">
                Editing active order on{" "}
                <strong>
                  {selectedTableObj.table_number}
                </strong>
                .
              </span>
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          DELIVERY
      ===================================================== */}
      {details.type === "Delivery" && (
        <div className="mt-3 space-y-2">
          <input
            type="text"
            value={details.delivery.name}
            onChange={(e) =>
              update("name", e.target.value)
            }
            placeholder="Customer name"
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

          <input
            type="tel"
            value={details.delivery.phone}
            onChange={(e) =>
              update("phone", e.target.value)
            }
            placeholder="Phone number"
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

          <textarea
            value={details.delivery.address}
            onChange={(e) =>
              update("address", e.target.value)
            }
            placeholder="Delivery address"
            rows={2}
            className="
              min-h-[64px]
              w-full
              min-w-0
              resize-none
              rounded-lg
              border
              border-[#3A1A16]/15
              bg-white
              px-2.5
              py-2
              text-xs
              leading-5
              text-[#3A1A16]
              outline-none
              transition
              placeholder:text-[#8D7C74]
              focus:border-[#C93E2B]
              focus:ring-2
              focus:ring-[#C93E2B]/10
              sm:px-3
              sm:text-sm
            "
          />
        </div>
      )}
    </div>
  );
}