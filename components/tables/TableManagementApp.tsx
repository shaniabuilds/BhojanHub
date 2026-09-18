
"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Search,
  UserCheck,
  UserPlus,
  Users,
  Utensils,
  X,
} from "lucide-react";
import type {
  Table,
  TableStatus,
  TablesResponse,
  WaitlistEntry,
  WaitlistResponse,
} from "@/types/pos";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { ShortcutsHelpModal } from "@/components/shared/ShortcutsHelpModal";

type FilterStatus = "all" | TableStatus;

export function TableManagementApp() {
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [showShortcuts, setShowShortcuts] = useState(false);
  const [tables, setTables] = useState<Table[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal / Selection State
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [editStatus, setEditStatus] =
    useState<TableStatus>("available");
  const [editNotes, setEditNotes] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Waitlist Form State
  const [showAddWaitlist, setShowAddWaitlist] = useState(false);
  const [waitlistForm, setWaitlistForm] = useState({
    customer_name: "",
    party_size: "2",
    phone: "",
    notes: "",
  });
  const [addingWaitlist, setAddingWaitlist] = useState(false);

  // Seat Party Modal State
  const [seatingParty, setSeatingParty] =
    useState<WaitlistEntry | null>(null);
  const [selectedTableToSeat, setSelectedTableToSeat] =
    useState<string>("");

  /* =====================================================
      FETCH TABLES & WAITLIST
  ===================================================== */

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [tablesRes, waitlistRes] = await Promise.all([
        fetch("/api/tables"),
        fetch("/api/tables?waitlist=true"),
      ]);

      if (!tablesRes.ok) {
        throw new Error("Failed to load restaurant floor plan.");
      }

      const tablesData = (await tablesRes.json()) as TablesResponse;
      setTables(tablesData.tables || []);

      if (waitlistRes.ok) {
        const waitlistData =
          (await waitlistRes.json()) as WaitlistResponse;

        setWaitlist(waitlistData.waitlist || []);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load table data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /* =====================================================
      STATS & FILTERING
  ===================================================== */

  const stats = useMemo(() => {
    const total = tables.length;

    const available = tables.filter(
      (t) => t.status === "available"
    ).length;

    const occupied = tables.filter(
      (t) => t.status === "occupied"
    ).length;

    const reserved = tables.filter(
      (t) => t.status === "reserved"
    ).length;

    return {
      total,
      available,
      occupied,
      reserved,
    };
  }, [tables]);

  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      const matchesFilter =
        filter === "all" || t.status === filter;

      const q = searchQuery.trim().toLowerCase();

      const matchesSearch =
        !q ||
        t.table_number.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q));

      return matchesFilter && matchesSearch;
    });
  }, [tables, filter, searchQuery]);

  const availableTables = useMemo(() => {
    return tables.filter((t) => t.status === "available");
  }, [tables]);

  /* =====================================================
      TABLE SELECTION / MODAL
  ===================================================== */

  const handleOpenTable = (table: Table) => {
    setSelectedTable(table);
    setEditStatus(table.status);
    setEditNotes(table.notes || "");
    setStatusMessage(null);
  };

  const handleCloseModal = () => {
    setSelectedTable(null);
    setStatusMessage(null);
  };

  const handleSaveTableStatus = async () => {
    if (!selectedTable) return;

    setSavingStatus(true);
    setStatusMessage(null);

    try {
      const res = await fetch(
        `/api/tables/${encodeURIComponent(selectedTable.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: editStatus,
            notes:
              editStatus === "available"
                ? null
                : editNotes.trim() || null,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update table status.");
      }

      await loadData();

      setStatusMessage({
        text: "Table status updated successfully.",
        type: "success",
      });

      setTimeout(() => {
        handleCloseModal();
      }, 700);
    } catch (err) {
      setStatusMessage({
        text:
          err instanceof Error
            ? err.message
            : "Update failed.",
        type: "error",
      });
    } finally {
      setSavingStatus(false);
    }
  };

  /* =====================================================
      WAITLIST ACTIONS
  ===================================================== */

  const handleAddWaitlist = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!waitlistForm.customer_name.trim()) return;

    setAddingWaitlist(true);

    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "add_waitlist",
          customer_name:
            waitlistForm.customer_name.trim(),
          party_size:
            Number(waitlistForm.party_size) || 2,
          phone:
            waitlistForm.phone.trim() || undefined,
          notes:
            waitlistForm.notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(
          "Failed to add guest to waitlist."
        );
      }

      setWaitlistForm({
        customer_name: "",
        party_size: "2",
        phone: "",
        notes: "",
      });

      setShowAddWaitlist(false);

      await loadData();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Error adding to waitlist."
      );
    } finally {
      setAddingWaitlist(false);
    }
  };

  const handleRemoveWaitlist = async (id: string) => {
    try {
      await fetch("/api/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "remove_waitlist",
          id,
        }),
      });

      await loadData();
    } catch (err) {
      console.error(
        "Failed to remove waitlist item:",
        err
      );
    }
  };

  const handleSeatWaitlistParty = async () => {
    if (!seatingParty || !selectedTableToSeat) return;

    try {
      // 1. Mark table occupied
      await fetch(
        `/api/tables/${encodeURIComponent(
          selectedTableToSeat
        )}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "occupied",
            notes: `Seated: ${seatingParty.customer_name} (${seatingParty.party_size} pax)`,
          }),
        }
      );

      // 2. Remove from waitlist
      await handleRemoveWaitlist(seatingParty.id);

      setSeatingParty(null);
      setSelectedTableToSeat("");

      await loadData();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to seat party."
      );
    }
  };

  /* =====================================================
      RENDER STATUS BADGES
  ===================================================== */

  const renderBadge = (status: TableStatus) => {
    switch (status) {
      case "available":
        return (
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-800 sm:px-2.5 sm:text-xs">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600 sm:h-2 sm:w-2" />
            Available
          </span>
        );

      case "occupied":
        return (
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-800 sm:px-2.5 sm:text-xs">
            <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-amber-600 sm:h-2 sm:w-2" />
            Occupied
          </span>
        );

      case "reserved":
        return (
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-1 text-[10px] font-semibold text-purple-800 sm:px-2.5 sm:text-xs">
            <Clock
              size={11}
              className="shrink-0 text-purple-600 sm:h-3 sm:w-3"
            />
            Reserved
          </span>
        );

      default:
        return null;
    }
  };

  const shortcuts = [
    {
      key: "/",
      handler: () => searchInputRef.current?.focus(),
      description: "Focus table search",
    },
    {
      key: "?",
      handler: () => setShowShortcuts(true),
      description: "Show keyboard shortcuts",
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#F3E9DC] px-3 py-3 font-sans text-[#3A1A16] sm:px-5 sm:py-4 lg:px-8 lg:py-5">
      <div className="flex h-full min-h-0 w-full flex-col">
        {/* =====================================================
            SCROLLABLE MANAGEMENT CONTENT
        ===================================================== */}

        <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 scrollbar-none">
          {/* COMPONENT HEADER */}

          <header className="mb-5 flex shrink-0 flex-col gap-4 border-b border-[#3A1A16]/10 pb-5 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C93E2B]/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#C93E2B] sm:text-[10px]">
                  <Utensils size={11} />
                  BhojanHub Hospitality
                </span>

                <span className="text-[10px] text-[#665650] sm:text-xs">
                  Live Floor Synchronization
                </span>
              </div>

              <h1 className="mt-1 font-display text-2xl font-medium tracking-tight text-[#3A1A16] sm:text-4xl">
                Table management & floor plan
              </h1>

              <p className="mt-1.5 max-w-2xl text-[11px] leading-5 text-[#665650] sm:text-xs">
                Monitor dining room occupancy, adjust seating
                assignments, and record reservations in real time.
              </p>

              <button
                type="button"
                onClick={() => setShowShortcuts(true)}
                className="mt-2 text-[10px] font-medium text-[#88756E] transition hover:text-[#C93E2B] sm:text-[11px]"
              >
                Press ? for shortcuts
              </button>
            </div>

            <div className="w-full sm:w-auto">
              <button
                type="button"
                onClick={() => void loadData()}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#3A1A16]/15 bg-[#FFFCF9] px-4 py-2.5 text-xs font-semibold text-[#3A1A16] shadow-sm transition hover:border-[#3A1A16]/25 hover:bg-white disabled:opacity-60 sm:w-auto"
              >
                <RefreshCw
                  size={14}
                  className={
                    loading ? "animate-spin" : ""
                  }
                />

                {loading
                  ? "Syncing..."
                  : "Refresh Floor"}
              </button>
            </div>
          </header>

          {/* ERROR STATE */}

          {error && (
            <div className="mb-5 flex shrink-0 flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="flex min-w-0 items-start gap-2">
                <AlertCircle
                  size={16}
                  className="mt-0.5 shrink-0"
                />

                <span className="break-words">{error}</span>
              </div>

              <button
                type="button"
                onClick={() => void loadData()}
                className="self-start font-bold underline sm:self-auto"
              >
                Retry
              </button>
            </div>
          )}

          {/* STATS OVERVIEW CARDS */}

          <div className="mb-5 grid shrink-0 grid-cols-2 gap-2.5 sm:mb-6 sm:grid-cols-4 sm:gap-3">
            <div className="rounded-2xl border border-[#3A1A16]/10 bg-[#FFFCF9] p-3 shadow-sm sm:p-4">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#8D7C74] sm:text-[10px]">
                Total Tables
              </span>

              <div className="mt-1 flex items-end justify-between gap-2">
                <span className="font-display text-2xl font-medium text-[#3A1A16] sm:text-3xl">
                  {stats.total}
                </span>

                <span className="hidden text-xs text-[#665650] sm:inline">
                  Dining Room
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#3A1A16]/10 bg-[#FFFCF9] p-3 shadow-sm sm:p-4">
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 sm:text-[10px]">
                Available
              </span>

              <div className="mt-1 flex items-end justify-between gap-2">
                <span className="font-display text-2xl font-medium text-emerald-700 sm:text-3xl">
                  {stats.available}
                </span>

                <span className="hidden text-xs text-[#665650] sm:inline">
                  Ready to Seat
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#3A1A16]/10 bg-[#FFFCF9] p-3 shadow-sm sm:p-4">
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 sm:text-[10px]">
                Occupied
              </span>

              <div className="mt-1 flex items-end justify-between gap-2">
                <span className="font-display text-2xl font-medium text-amber-700 sm:text-3xl">
                  {stats.occupied}
                </span>

                <span className="hidden text-xs text-[#665650] sm:inline">
                  Active Orders
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#3A1A16]/10 bg-[#FFFCF9] p-3 shadow-sm sm:p-4">
              <span className="text-[9px] font-bold uppercase tracking-wider text-purple-800 sm:text-[10px]">
                Reserved
              </span>

              <div className="mt-1 flex items-end justify-between gap-2">
                <span className="font-display text-2xl font-medium text-purple-700 sm:text-3xl">
                  {stats.reserved}
                </span>

                <span className="hidden text-xs text-[#665650] sm:inline">
                  Bookings
                </span>
              </div>
            </div>
          </div>

          {/* CONTROLS & FILTER BAR */}

          <div className="mb-5 flex shrink-0 flex-col gap-3">
            <div className="flex w-full flex-wrap items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`shrink-0 rounded-xl px-3 py-2 text-[10px] font-semibold transition sm:px-3.5 sm:text-xs ${
                  filter === "all"
                    ? "bg-[#3A1A16] text-[#F3E9DC] shadow-sm"
                    : "border border-[#3A1A16]/10 bg-[#FFFCF9] text-[#665650] hover:border-[#3A1A16]/25"
                }`}
              >
                All Tables ({stats.total})
              </button>

              <button
                type="button"
                onClick={() => setFilter("available")}
                className={`shrink-0 rounded-xl px-3 py-2 text-[10px] font-semibold transition sm:px-3.5 sm:text-xs ${
                  filter === "available"
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "border border-[#3A1A16]/10 bg-[#FFFCF9] text-[#665650] hover:border-emerald-300"
                }`}
              >
                Available ({stats.available})
              </button>

              <button
                type="button"
                onClick={() => setFilter("occupied")}
                className={`shrink-0 rounded-xl px-3 py-2 text-[10px] font-semibold transition sm:px-3.5 sm:text-xs ${
                  filter === "occupied"
                    ? "bg-amber-700 text-white shadow-sm"
                    : "border border-[#3A1A16]/10 bg-[#FFFCF9] text-[#665650] hover:border-amber-300"
                }`}
              >
                Occupied ({stats.occupied})
              </button>

              <button
                type="button"
                onClick={() => setFilter("reserved")}
                className={`shrink-0 rounded-xl px-3 py-2 text-[10px] font-semibold transition sm:px-3.5 sm:text-xs ${
                  filter === "reserved"
                    ? "bg-purple-700 text-white shadow-sm"
                    : "border border-[#3A1A16]/10 bg-[#FFFCF9] text-[#665650] hover:border-purple-300"
                }`}
              >
                Reserved ({stats.reserved})
              </button>
            </div>

            <div className="relative w-full sm:max-w-xs sm:self-end">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8D7C74]"
              />

              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                placeholder="Search table or notes…"
                className="w-full rounded-xl border border-[#3A1A16]/15 bg-[#FFFCF9] py-2.5 pl-9 pr-3 text-xs outline-none transition focus:border-[#C93E2B] focus:bg-white"
              />
            </div>
          </div>

          {/* FLOOR PLAN GRID */}

          {loading && tables.length === 0 ? (
            <div className="flex min-h-[300px] shrink-0 flex-col items-center justify-center rounded-2xl border border-[#3A1A16]/10 bg-[#FFFCF9] p-6 text-center sm:min-h-[360px] sm:p-8">
              <RefreshCw className="h-6 w-6 animate-spin text-[#C93E2B]" />

              <p className="mt-3 text-xs font-medium text-[#665650] sm:text-sm">
                Loading dining floor layout…
              </p>
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="flex min-h-[240px] shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed border-[#3A1A16]/20 bg-[#FFFCF9]/60 p-6 text-center sm:min-h-[260px] sm:p-8">
              <Utensils className="h-8 w-8 text-[#8D7C74]/50" />

              <p className="mt-3 text-sm font-semibold text-[#3A1A16] sm:text-base">
                No tables match your filter
              </p>

              <p className="mt-1 max-w-sm text-[11px] leading-5 text-[#665650] sm:text-xs">
                Try selecting another status tab or clearing your
                search.
              </p>
            </div>
          ) : (
            <div className="grid shrink-0 grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              {filteredTables.map((table) => {
                const isOccupied =
                  table.status === "occupied";

                const isReserved =
                  table.status === "reserved";

                return (
                  <div
                    key={table.id}
                    onClick={() => handleOpenTable(table)}
                    className={`group relative flex min-w-0 cursor-pointer flex-col justify-between rounded-2xl border p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${
                      isOccupied
                        ? "border-amber-400/40 bg-[#FFFDF9] hover:border-amber-500"
                        : isReserved
                          ? "border-purple-300 bg-[#FCFAFE] hover:border-purple-400"
                          : "border-[#3A1A16]/10 bg-[#FFFCF9] hover:border-emerald-400"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-start justify-between gap-1.5 sm:gap-2">
                        <div className="min-w-0">
                          <h2 className="truncate font-display text-xl font-medium tracking-tight text-[#3A1A16] sm:text-2xl">
                            {table.table_number}
                          </h2>

                          <div className="mt-1 flex items-center gap-1 text-[10px] text-[#665650] sm:text-xs">
                            <Users
                              size={12}
                              className="shrink-0 text-[#8D7C74] sm:h-[13px] sm:w-[13px]"
                            />

                            <span>
                              {table.capacity} Seats
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {renderBadge(table.status)}
                        </div>
                      </div>

                      <div className="mt-3 min-h-[54px] rounded-xl bg-[#F3E9DC]/40 p-2 sm:mt-4 sm:min-h-[44px] sm:p-2.5">
                        {isOccupied && (
                          <div className="space-y-0.5">
                            <p className="truncate text-[10px] font-semibold text-amber-900 sm:text-xs">
                              Active Dine-In Order
                            </p>

                            <p className="truncate text-[9px] text-[#665650] sm:text-[11px]">
                              {table.current_order_id
                                ? `ID: ${table.current_order_id.slice(
                                    0,
                                    8
                                  )}…`
                                : table.notes ||
                                  "Guests seated"}
                            </p>
                          </div>
                        )}

                        {isReserved && (
                          <div className="space-y-0.5">
                            <p className="truncate text-[10px] font-semibold text-purple-900 sm:text-xs">
                              Reserved Booking
                            </p>

                            <p className="line-clamp-2 text-[9px] text-purple-800 sm:text-[11px]">
                              {table.notes ||
                                "Reserved by host"}
                            </p>
                          </div>
                        )}

                        {table.status === "available" && (
                          <p className="line-clamp-2 text-[9px] leading-4 text-emerald-800 sm:text-[11px]">
                            Table is sanitized and ready for
                            seating.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex min-w-0 items-center justify-between gap-2 border-t border-[#3A1A16]/5 pt-3 sm:mt-4">
                      <span className="truncate text-[8px] font-semibold uppercase tracking-wider text-[#8D7C74] transition group-hover:text-[#C93E2B] sm:text-[10px]">
                        Manage Table
                      </span>

                      <span className="shrink-0 text-[10px] text-[#C93E2B] sm:text-xs">
                        Edit →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-[#3A1A16]/10 bg-[#FFFCF9] p-4 shadow-sm sm:mt-8 sm:p-6">
            <div className="flex flex-col gap-3 border-b border-[#3A1A16]/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#C93E2B] sm:text-[10px]">
                    Walk-In Queue
                  </span>

                  <span className="rounded-full bg-[#F3E9DC] px-2 py-0.5 text-[9px] font-semibold text-[#665650] sm:text-[10px]">
                    {waitlist.length} waiting
                  </span>
                </div>

                <h2 className="mt-1 font-display text-xl font-medium text-[#3A1A16] sm:text-2xl">
                  Guest Waitlist
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAddWaitlist(!showAddWaitlist)
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3A1A16] px-4 py-2.5 text-xs font-semibold text-[#F3E9DC] transition hover:bg-[#C93E2B] sm:w-auto"
              >
                <UserPlus size={14} />

                {showAddWaitlist
                  ? "Close Form"
                  : "Add Walk-In Party"}
              </button>
            </div>

            {/* Add to Waitlist Form */}

            {showAddWaitlist && (
              <form
                onSubmit={handleAddWaitlist}
                className="mt-4 rounded-xl border border-[#3A1A16]/10 bg-[#F3E9DC]/40 p-3 sm:p-4"
              >
                <h4 className="mb-3 text-xs font-semibold text-[#3A1A16]">
                  Register Waiting Guest
                </h4>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#3A1A16]">
                      Guest / Party Name *
                    </label>

                    <input
                      type="text"
                      required
                      value={waitlistForm.customer_name}
                      onChange={(e) =>
                        setWaitlistForm({
                          ...waitlistForm,
                          customer_name: e.target.value,
                        })
                      }
                      placeholder="e.g. Ramesh"
                      className="mt-1 w-full rounded-lg border border-[#3A1A16]/15 bg-white px-3 py-2 text-xs outline-none focus:border-[#C93E2B]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#3A1A16]">
                      Party Size *
                    </label>

                    <input
                      type="number"
                      min="1"
                      max="20"
                      required
                      value={waitlistForm.party_size}
                      onChange={(e) =>
                        setWaitlistForm({
                          ...waitlistForm,
                          party_size: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-[#3A1A16]/15 bg-white px-3 py-2 text-xs outline-none focus:border-[#C93E2B]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#3A1A16]">
                      Phone (Optional)
                    </label>

                    <input
                      type="tel"
                      value={waitlistForm.phone}
                      onChange={(e) =>
                        setWaitlistForm({
                          ...waitlistForm,
                          phone: e.target.value,
                        })
                      }
                      placeholder="e.g. 9876543210"
                      className="mt-1 w-full rounded-lg border border-[#3A1A16]/15 bg-white px-3 py-2 text-xs outline-none focus:border-[#C93E2B]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#3A1A16]">
                      Seating Note
                    </label>

                    <input
                      type="text"
                      value={waitlistForm.notes}
                      onChange={(e) =>
                        setWaitlistForm({
                          ...waitlistForm,
                          notes: e.target.value,
                        })
                      }
                      placeholder="e.g. High chair needed"
                      className="mt-1 w-full rounded-lg border border-[#3A1A16]/15 bg-white px-3 py-2 text-xs outline-none focus:border-[#C93E2B]"
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setShowAddWaitlist(false)
                    }
                    className="rounded-lg px-3 py-2 text-xs font-semibold text-[#665650]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={addingWaitlist}
                    className="rounded-lg bg-[#C93E2B] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#a82d1c] disabled:opacity-50"
                  >
                    {addingWaitlist
                      ? "Adding…"
                      : "Add to Queue"}
                  </button>
                </div>
              </form>
            )}

            {/* Waitlist Table / List */}

            <div className="mt-4">
              {waitlist.length === 0 ? (
                <p className="py-6 text-center text-xs text-[#665650]">
                  No guests currently waiting on the waitlist.
                </p>
              ) : (
                <div className="divide-y divide-[#3A1A16]/5">
                  {waitlist.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#F3E9DC] text-xs font-bold text-[#3A1A16]">
                          {index + 1}
                        </span>

                        <div className="min-w-0">
                          <h3 className="break-words text-xs font-semibold text-[#3A1A16]">
                            {entry.customer_name} (
                            {entry.party_size} guests)
                          </h3>

                          <p className="break-words text-[10px] leading-4 text-[#665650] sm:text-[11px]">
                            {entry.phone
                              ? `Phone: ${entry.phone} · `
                              : ""}
                            {entry.notes
                              ? `Note: ${entry.notes}`
                              : "Standard seating"}
                          </p>
                        </div>
                      </div>

                      <div className="flex w-full items-center gap-2 sm:w-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setSeatingParty(entry);
                            setSelectedTableToSeat(
                              availableTables[0]?.id || ""
                            );
                          }}
                          disabled={
                            availableTables.length === 0
                          }
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-40 sm:flex-none sm:py-1.5"
                        >
                          <UserCheck size={14} />
                          Seat Guest
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handleRemoveWaitlist(
                              entry.id
                            )
                          }
                          className="shrink-0 rounded-lg p-2 text-[#8D7C74] hover:text-red-600"
                          aria-label="Remove guest"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

     
      {selectedTable && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="table-dialog-title"
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#3A1A16]/50 p-3 backdrop-blur-xs sm:p-4"
        >
          <div className="my-auto max-h-[94vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#3A1A16]/15 bg-[#FFFCF9] p-4 shadow-2xl scrollbar-none sm:p-6">
            <div className="flex items-start justify-between gap-3 border-b border-[#3A1A16]/10 pb-3">
              <div className="min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#C93E2B] sm:text-[10px]">
                  Table Controls
                </span>

                <h3
                  id="table-dialog-title"
                  className="truncate font-display text-xl font-medium text-[#3A1A16] sm:text-2xl"
                >
                  {selectedTable.table_number}
                </h3>

                <p className="text-[11px] text-[#665650] sm:text-xs">
                  Capacity: {selectedTable.capacity} guests
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                aria-label="Close dialog"
                className="shrink-0 rounded-lg p-1 text-[#8D7C74] hover:text-[#3A1A16]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Status Switcher Buttons */}

            <div className="mt-4">
              <label className="mb-2 block text-xs font-semibold text-[#3A1A16]">
                Update Table Status:
              </label>

              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditStatus("available")
                  }
                  className={`rounded-xl border p-2 text-[10px] font-semibold transition sm:p-2.5 sm:text-xs ${
                    editStatus === "available"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm ring-1 ring-emerald-600"
                      : "border-[#3A1A16]/10 bg-white text-[#665650] hover:bg-[#F3E9DC]/30"
                  }`}
                >
                  Available
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setEditStatus("occupied")
                  }
                  className={`rounded-xl border p-2 text-[10px] font-semibold transition sm:p-2.5 sm:text-xs ${
                    editStatus === "occupied"
                      ? "border-amber-600 bg-amber-50 text-amber-900 shadow-sm ring-1 ring-amber-600"
                      : "border-[#3A1A16]/10 bg-white text-[#665650] hover:bg-[#F3E9DC]/30"
                  }`}
                >
                  Occupied
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setEditStatus("reserved")
                  }
                  className={`rounded-xl border p-2 text-[10px] font-semibold transition sm:p-2.5 sm:text-xs ${
                    editStatus === "reserved"
                      ? "border-purple-600 bg-purple-50 text-purple-900 shadow-sm ring-1 ring-purple-600"
                      : "border-[#3A1A16]/10 bg-white text-[#665650] hover:bg-[#F3E9DC]/30"
                  }`}
                >
                  Reserved
                </button>
              </div>
            </div>

            {/* Reservation Notes Input */}

            {editStatus === "reserved" && (
              <div className="mt-4">
                <label className="block text-xs font-semibold text-[#3A1A16]">
                  Reservation Note{" "}
                  <span className="text-[#C93E2B]">*</span>
                </label>

                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) =>
                    setEditNotes(e.target.value)
                  }
                  placeholder="e.g. Gupta party, 8:00 PM, 4 pax"
                  className="mt-1 w-full rounded-xl border border-[#3A1A16]/15 bg-white px-3 py-2.5 text-xs outline-none focus:border-[#C93E2B]"
                />

                <p className="mt-1 text-[10px] leading-4 text-[#665650] sm:text-[11px]">
                  This note will be shown to staff in the POS
                  when inspecting tables.
                </p>
              </div>
            )}

            {/* Occupied Notice / Warning */}

            {selectedTable.status === "occupied" &&
              editStatus === "available" && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-[11px] leading-4 text-amber-900 sm:text-xs">
                  <AlertTriangle
                    size={16}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />

                  <span>
                    <strong>Manual Override:</strong> This
                    table is currently occupied by an active
                    order. Setting it to Available will
                    release the table assignment.
                  </span>
                </div>
              )}

            {statusMessage && (
              <div
                className={`mt-4 rounded-xl border p-3 text-xs ${
                  statusMessage.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                {statusMessage.text}
              </div>
            )}

            <div className="mt-5 flex flex-col-reverse gap-2 border-t border-[#3A1A16]/10 pt-4 sm:mt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-xl px-4 py-2.5 text-xs font-semibold text-[#665650] hover:bg-[#F3E9DC]"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={savingStatus}
                onClick={() =>
                  void handleSaveTableStatus()
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3A1A16] px-5 py-2.5 text-xs font-semibold text-[#F3E9DC] shadow-sm transition hover:bg-[#C93E2B] disabled:opacity-50"
              >
                {savingStatus ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL 2: SEAT WAITLIST PARTY
      ===================================================== */}

      {seatingParty && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#3A1A16]/50 p-3 backdrop-blur-xs sm:p-4"
        >
          <div className="my-auto w-full max-w-sm rounded-2xl border border-[#3A1A16]/15 bg-[#FFFCF9] p-4 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display text-xl font-medium text-[#3A1A16] sm:text-2xl">
                  Seat Guest
                </h3>

                <p className="mt-1 text-[11px] leading-5 text-[#665650] sm:text-xs">
                  Assign{" "}
                  <strong>
                    {seatingParty.customer_name}
                  </strong>{" "}
                  (party of {seatingParty.party_size}) to an
                  available table:
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSeatingParty(null)}
                aria-label="Close dialog"
                className="shrink-0 rounded-lg p-1 text-[#8D7C74] hover:text-[#3A1A16]"
              >
                <X size={17} />
              </button>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-xs font-semibold text-[#3A1A16]">
                Choose Available Table:
              </label>

              <select
                value={selectedTableToSeat}
                onChange={(e) =>
                  setSelectedTableToSeat(e.target.value)
                }
                className="w-full rounded-xl border border-[#3A1A16]/15 bg-white p-2.5 text-xs text-[#3A1A16] outline-none focus:border-[#C93E2B]"
              >
                {availableTables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.table_number} ({t.capacity} seats)
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:mt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setSeatingParty(null)}
                className="rounded-xl px-4 py-2.5 text-xs font-semibold text-[#665650]"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!selectedTableToSeat}
                onClick={() =>
                  void handleSeatWaitlistParty()
                }
                className="rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50"
              >
                Confirm & Seat
              </button>
            </div>
          </div>
        </div>
      )}

      <ShortcutsHelpModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={shortcuts}
      />
    </div>
  );
}