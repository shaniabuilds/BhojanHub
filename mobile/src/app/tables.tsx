import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MobileHeader } from "../components/navigation/MobileHeader";
import { BottomNavBar } from "../components/navigation/BottomNavBar";
import { apiFetch } from "../config/apiClient";
import type {
  Table,
  TableStatus,
  TablesResponse,
  WaitlistEntry,
  WaitlistResponse,
} from "../types/pos";

type FilterStatus = "all" | TableStatus;

export default function TableManagementScreen() {
  const [activeTab, setActiveTab] = useState<"floor" | "waitlist">("floor");
  const [tables, setTables] = useState<Table[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Edit Table Status Modal
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [editStatus, setEditStatus] = useState<TableStatus>("available");
  const [editNotes, setEditNotes] = useState<string>("");
  const [isSavingTable, setIsSavingTable] = useState<boolean>(false);

  // Add Waitlist Modal
  const [showAddWaitlist, setShowAddWaitlist] = useState<boolean>(false);
  const [waitlistName, setWaitlistName] = useState<string>("");
  const [waitlistPartySize, setWaitlistPartySize] = useState<string>("2");
  const [waitlistPhone, setWaitlistPhone] = useState<string>("");
  const [waitlistNotes, setWaitlistNotes] = useState<string>("");
  const [isAddingWaitlist, setIsAddingWaitlist] = useState<boolean>(false);

  // Seat Party Modal
  const [seatingParty, setSeatingParty] = useState<WaitlistEntry | null>(null);
  const [tableToSeat, setTableToSeat] = useState<string>("");
  const [isSeating, setIsSeating] = useState<boolean>(false);

  // Load tables & waitlist
  const loadData = useCallback(async () => {
    try {
      const [tblRes, waitRes] = await Promise.all([
        apiFetch<TablesResponse>("/api/tables"),
        apiFetch<WaitlistResponse>("/api/tables?waitlist=true"),
      ]);

      if (tblRes?.tables) {
        setTables(tblRes.tables);
      }
      if (waitRes?.waitlist) {
        setWaitlist(waitRes.waitlist);
      }
    } catch {
      // Fallback local data if offline
      if (tables.length === 0) {
        setTables([
          { id: "t-1", table_number: "Table 01", capacity: 2, status: "available", current_order_id: null },
          { id: "t-2", table_number: "Table 02", capacity: 4, status: "available", current_order_id: null },
          { id: "t-3", table_number: "Table 03", capacity: 4, status: "occupied", current_order_id: "ord-101", notes: "Family dinner" },
          { id: "t-4", table_number: "Table 04", capacity: 6, status: "available", current_order_id: null },
          { id: "t-5", table_number: "Table 05", capacity: 2, status: "reserved", current_order_id: null, notes: "Reserved 8:00 PM" },
          { id: "t-6", table_number: "Table 06", capacity: 8, status: "available", current_order_id: null },
        ]);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [tables.length]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    void loadData();
  };

  // KPI statistics
  const stats = useMemo(() => {
    return {
      total: tables.length,
      available: tables.filter((t) => t.status === "available").length,
      occupied: tables.filter((t) => t.status === "occupied").length,
      reserved: tables.filter((t) => t.status === "reserved").length,
    };
  }, [tables]);

  // Filtered tables
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      const matchFilter = filter === "all" || t.status === filter;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        t.table_number.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q));
      return matchFilter && matchSearch;
    });
  }, [tables, filter, searchQuery]);

  const availableTables = useMemo(() => {
    return tables.filter((t) => t.status === "available");
  }, [tables]);

  // Table Status Update
  const openTableEditor = (table: Table) => {
    setSelectedTable(table);
    setEditStatus(table.status);
    setEditNotes(table.notes || "");
  };

  const handleSaveTable = async () => {
    if (!selectedTable) return;
    setIsSavingTable(true);

    try {
      await apiFetch(`/api/tables/${encodeURIComponent(selectedTable.id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: editStatus,
          notes: editStatus === "available" ? null : editNotes.trim() || null,
        }),
      });

      // Update local state
      setTables((prev) =>
        prev.map((t) =>
          t.id === selectedTable.id
            ? {
                ...t,
                status: editStatus,
                notes: editStatus === "available" ? undefined : editNotes.trim() || undefined,
              }
            : t
        )
      );
      setSelectedTable(null);
      Alert.alert("Success", `${selectedTable.table_number} updated to ${editStatus}.`);
    } catch {
      // Local optimistic update
      setTables((prev) =>
        prev.map((t) =>
          t.id === selectedTable.id
            ? {
                ...t,
                status: editStatus,
                notes: editStatus === "available" ? undefined : editNotes.trim() || undefined,
              }
            : t
        )
      );
      setSelectedTable(null);
    } finally {
      setIsSavingTable(false);
    }
  };

  // Add Walk-in to Waitlist
  const handleAddWaitlist = async () => {
    if (!waitlistName.trim()) {
      Alert.alert("Required", "Please enter customer name.");
      return;
    }

    setIsAddingWaitlist(true);
    try {
      const partySizeNum = parseInt(waitlistPartySize) || 2;
      await apiFetch("/api/tables", {
        method: "POST",
        body: JSON.stringify({
          action: "add_waitlist",
          customer_name: waitlistName.trim(),
          party_size: partySizeNum,
          phone: waitlistPhone.trim() || undefined,
          notes: waitlistNotes.trim() || undefined,
        }),
      });

      // Optimistic local update
      const newEntry: WaitlistEntry = {
        id: `wl-${Date.now()}`,
        customer_name: waitlistName.trim(),
        party_size: partySizeNum,
        phone: waitlistPhone.trim() || undefined,
        notes: waitlistNotes.trim() || undefined,
        created_at: new Date().toISOString(),
      };
      setWaitlist((prev) => [newEntry, ...prev]);

      setWaitlistName("");
      setWaitlistPhone("");
      setWaitlistNotes("");
      setShowAddWaitlist(false);
      Alert.alert("Added to Queue", `${newEntry.customer_name} added to waitlist.`);
    } catch {
      setShowAddWaitlist(false);
    } finally {
      setIsAddingWaitlist(false);
      void loadData();
    }
  };

  // Remove from Waitlist
  const handleRemoveWaitlist = async (id: string) => {
    try {
      await apiFetch("/api/tables", {
        method: "POST",
        body: JSON.stringify({ action: "remove_waitlist", id }),
      });
      setWaitlist((prev) => prev.filter((w) => w.id !== id));
    } catch {
      setWaitlist((prev) => prev.filter((w) => w.id !== id));
    }
  };

  // Seat Party on Table
  const handleSeatParty = async () => {
    if (!seatingParty || !tableToSeat) {
      Alert.alert("Select Table", "Please select a table to seat the guest.");
      return;
    }

    setIsSeating(true);
    try {
      // 1. Mark table occupied
      await apiFetch(`/api/tables/${encodeURIComponent(tableToSeat)}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "occupied",
          notes: `Seated: ${seatingParty.customer_name} (${seatingParty.party_size} guests)`,
        }),
      });

      // 2. Remove from waitlist
      await handleRemoveWaitlist(seatingParty.id);

      // Optimistic updates
      setTables((prev) =>
        prev.map((t) =>
          t.id === tableToSeat
            ? {
                ...t,
                status: "occupied",
                notes: `Seated: ${seatingParty.customer_name} (${seatingParty.party_size} guests)`,
              }
            : t
        )
      );

      Alert.alert(
        "Party Seated",
        `${seatingParty.customer_name} has been seated successfully!`
      );
      setSeatingParty(null);
      setTableToSeat("");
    } catch {
      Alert.alert("Notice", "Table assigned locally.");
      setSeatingParty(null);
      setTableToSeat("");
    } finally {
      setIsSeating(false);
      void loadData();
    }
  };

  return (
    <View style={styles.container}>
      <MobileHeader
        title="Table Management"
        subtitle="Floor Plan & Host Stand"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* KPI Stats Strip */}
      <View style={styles.statsStrip}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: "#48BB78" }]}>{stats.available}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: "#E53E3E" }]}>{stats.occupied}</Text>
          <Text style={styles.statLabel}>Occupied</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: "#ECC94B" }]}>{stats.reserved}</Text>
          <Text style={styles.statLabel}>Reserved</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "floor" && styles.tabBtnActive]}
          onPress={() => setActiveTab("floor")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, activeTab === "floor" && styles.tabBtnTextActive]}>
            Floor Plan 🪑
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "waitlist" && styles.tabBtnActive]}
          onPress={() => setActiveTab("waitlist")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, activeTab === "waitlist" && styles.tabBtnTextActive]}>
            Waitlist Queue 📋 {waitlist.length > 0 ? `(${waitlist.length})` : ""}
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: FLOOR PLAN */}
      {activeTab === "floor" && (
        <View style={styles.flexOne}>
          {/* Search & Filter pills */}
          <View style={styles.filterRow}>
            {(["all", "available", "occupied", "reserved"] as FilterStatus[]).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterPill, filter === f && styles.filterPillActive]}
                onPress={() => setFilter(f)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    filter === f && styles.filterPillTextActive,
                  ]}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tables Grid */}
          <ScrollView
            style={styles.flexOne}
            contentContainerStyle={styles.tablesGrid}
            showsVerticalScrollIndicator={false}
          >
            {filteredTables.map((table) => {
              const isAvail = table.status === "available";
              const isOcc = table.status === "occupied";
              const isRes = table.status === "reserved";

              return (
                <View
                  key={table.id}
                  style={[
                    styles.tableCard,
                    isAvail && styles.cardAvail,
                    isOcc && styles.cardOcc,
                    isRes && styles.cardRes,
                  ]}
                >
                  <View style={styles.tableTopRow}>
                    <View>
                      <Text style={styles.tableNum}>{table.table_number}</Text>
                      <Text style={styles.tableCapacity}>👥 {table.capacity} Seats</Text>
                    </View>
                    <View
                      style={[
                        styles.statusTag,
                        isAvail
                          ? styles.statusTagAvail
                          : isOcc
                          ? styles.statusTagOcc
                          : styles.statusTagRes,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusTagText,
                          isAvail
                            ? { color: "#48BB78" }
                            : isOcc
                            ? { color: "#E53E3E" }
                            : { color: "#ECC94B" },
                        ]}
                      >
                        {table.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {table.notes ? (
                    <Text style={styles.tableNotes} numberOfLines={2}>
                      📝 {table.notes}
                    </Text>
                  ) : (
                    <Text style={styles.tableNotesEmpty}>No current active reservation</Text>
                  )}

                  <TouchableOpacity
                    style={styles.updateStatusBtn}
                    onPress={() => openTableEditor(table)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.updateStatusBtnText}>Update Table Status ⚙️</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
            <View style={{ height: 110 }} />
          </ScrollView>
        </View>
      )}

      {/* TAB 2: WAITLIST */}
      {activeTab === "waitlist" && (
        <View style={styles.flexOne}>
          <View style={styles.waitlistHeader}>
            <Text style={styles.waitlistCountText}>
              {waitlist.length} party{waitlist.length !== 1 ? "ies" : ""} waiting
            </Text>
            <TouchableOpacity
              style={styles.addPartyBtn}
              onPress={() => setShowAddWaitlist(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.addPartyBtnText}>+ Add Walk-In Guest</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.flexOne}
            contentContainerStyle={styles.waitlistContent}
            showsVerticalScrollIndicator={false}
          >
            {waitlist.length === 0 ? (
              <View style={styles.emptyWaitlist}>
                <Text style={styles.emptyWaitlistIcon}>📋</Text>
                <Text style={styles.emptyWaitlistTitle}>Waitlist is clear!</Text>
                <Text style={styles.emptyWaitlistDesc}>
                  Add walk-in guests when dining tables are full.
                </Text>
              </View>
            ) : (
              waitlist.map((w) => (
                <View key={w.id} style={styles.waitlistCard}>
                  <View style={styles.waitlistTop}>
                    <View>
                      <Text style={styles.waitlistGuestName}>{w.customer_name}</Text>
                      <Text style={styles.waitlistPartyMeta}>
                        👥 Party of {w.party_size} {w.phone ? `• 📞 ${w.phone}` : ""}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveWaitlist(w.id)}
                      style={styles.removeWaitlistBtn}
                    >
                      <Text style={styles.removeWaitlistText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  {w.notes ? (
                    <Text style={styles.waitlistNote}>Note: {w.notes}</Text>
                  ) : null}

                  <View style={styles.waitlistActionRow}>
                    <Text style={styles.waitlistTime}>
                      Waiting since{" "}
                      {new Date(w.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    <TouchableOpacity
                      style={styles.seatPartyBtn}
                      onPress={() => {
                        setSeatingParty(w);
                        if (availableTables.length > 0) {
                          setTableToSeat(availableTables[0].id);
                        }
                      }}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.seatPartyBtnText}>Seat Guest 🪑</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            <View style={{ height: 110 }} />
          </ScrollView>
        </View>
      )}

      {/* EDIT TABLE STATUS MODAL */}
      <Modal visible={!!selectedTable} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              Update {selectedTable?.table_number}
            </Text>
            <Text style={styles.modalSub}>
              Capacity: {selectedTable?.capacity} Guests
            </Text>

            <Text style={styles.fieldHeading}>Set Table Status:</Text>
            <View style={styles.statusOptions}>
              {(["available", "occupied", "reserved"] as TableStatus[]).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[
                    styles.statusChoiceBtn,
                    editStatus === st && styles.statusChoiceBtnActive,
                  ]}
                  onPress={() => setEditStatus(st)}
                >
                  <Text
                    style={[
                      styles.statusChoiceText,
                      editStatus === st && styles.statusChoiceTextActive,
                    ]}
                  >
                    {st === "available"
                      ? "🟢 Available"
                      : st === "occupied"
                      ? "🔴 Occupied"
                      : "🟡 Reserved"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {editStatus !== "available" && (
              <>
                <Text style={styles.fieldHeading}>Guest / Reservation Notes:</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Rahul party of 4, or 8:30 PM reservation"
                  placeholderTextColor="#998377"
                  value={editNotes}
                  onChangeText={setEditNotes}
                />
              </>
            )}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setSelectedTable(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveTable}
                disabled={isSavingTable}
              >
                {isSavingTable ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ADD WALK-IN MODAL */}
      <Modal visible={showAddWaitlist} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Walk-In Guest</Text>
            <Text style={styles.modalSub}>Add party to host stand queue</Text>

            <Text style={styles.fieldHeading}>Guest Name *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Vikram Seth"
              placeholderTextColor="#998377"
              value={waitlistName}
              onChangeText={setWaitlistName}
            />

            <Text style={styles.fieldHeading}>Party Size (Guests)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="2"
              placeholderTextColor="#998377"
              keyboardType="numeric"
              value={waitlistPartySize}
              onChangeText={setWaitlistPartySize}
            />

            <Text style={styles.fieldHeading}>Contact Phone</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="+91 98765 43210"
              placeholderTextColor="#998377"
              keyboardType="phone-pad"
              value={waitlistPhone}
              onChangeText={setWaitlistPhone}
            />

            <Text style={styles.fieldHeading}>Special Seating Requests</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Window seat, high chair"
              placeholderTextColor="#998377"
              value={waitlistNotes}
              onChangeText={setWaitlistNotes}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowAddWaitlist(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleAddWaitlist}
                disabled={isAddingWaitlist}
              >
                {isAddingWaitlist ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Add to Queue</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SEAT PARTY MODAL */}
      <Modal visible={!!seatingParty} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Seat {seatingParty?.customer_name}</Text>
            <Text style={styles.modalSub}>
              Party of {seatingParty?.party_size} guests
            </Text>

            <Text style={styles.fieldHeading}>Select Available Dining Table:</Text>
            {availableTables.length === 0 ? (
              <View style={styles.noTablesBox}>
                <Text style={styles.noTablesText}>
                  ⚠️ No tables currently available. Please free an occupied table first.
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.seatingTableList}
              >
                {availableTables.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.seatingTableChip,
                      tableToSeat === t.id && styles.seatingTableChipActive,
                    ]}
                    onPress={() => setTableToSeat(t.id)}
                  >
                    <Text
                      style={[
                        styles.seatingTableName,
                        tableToSeat === t.id && styles.seatingTableNameActive,
                      ]}
                    >
                      {t.table_number}
                    </Text>
                    <Text style={styles.seatingTableCap}>{t.capacity} Seats</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setSeatingParty(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalSaveBtn,
                  (!tableToSeat || availableTables.length === 0) && { opacity: 0.5 },
                ]}
                onPress={handleSeatParty}
                disabled={!tableToSeat || availableTables.length === 0 || isSeating}
              >
                {isSeating ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Confirm Seated</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomNavBar activeTab="tables" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1F0E0C",
  },
  flexOne: {
    flex: 1,
  },
  statsStrip: {
    flexDirection: "row",
    backgroundColor: "#2C1411",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#42201C",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statNum: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F3E9DC",
  },
  statLabel: {
    fontSize: 11,
    color: "#A88F80",
    marginTop: 2,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#26100E",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#42201C",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: "#3A1A16",
    borderWidth: 1,
    borderColor: "#C93E2B",
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#BCA393",
  },
  tabBtnTextActive: {
    color: "#F3E9DC",
    fontWeight: "700",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#2C1411",
    borderWidth: 1,
    borderColor: "#4A2520",
  },
  filterPillActive: {
    backgroundColor: "#C93E2B",
    borderColor: "#C93E2B",
  },
  filterPillText: {
    fontSize: 12,
    color: "#BCA393",
    fontWeight: "600",
  },
  filterPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  tablesGrid: {
    paddingHorizontal: 16,
    gap: 12,
  },
  tableCard: {
    backgroundColor: "#2A1210",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#44211D",
  },
  cardAvail: {
    borderLeftWidth: 4,
    borderLeftColor: "#48BB78",
  },
  cardOcc: {
    borderLeftWidth: 4,
    borderLeftColor: "#E53E3E",
  },
  cardRes: {
    borderLeftWidth: 4,
    borderLeftColor: "#ECC94B",
  },
  tableTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  tableNum: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F3E9DC",
  },
  tableCapacity: {
    fontSize: 12,
    color: "#A88F80",
    marginTop: 2,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusTagAvail: {
    backgroundColor: "#1B3821",
  },
  statusTagOcc: {
    backgroundColor: "#3E1715",
  },
  statusTagRes: {
    backgroundColor: "#3A2E12",
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: "800",
  },
  tableNotes: {
    fontSize: 12,
    color: "#D1BBA2",
    marginTop: 10,
    lineHeight: 16,
  },
  tableNotesEmpty: {
    fontSize: 12,
    color: "#7D6459",
    marginTop: 10,
    fontStyle: "italic",
  },
  updateStatusBtn: {
    backgroundColor: "#3A1A16",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#5A2822",
    paddingVertical: 9,
    alignItems: "center",
    marginTop: 12,
  },
  updateStatusBtnText: {
    fontSize: 12,
    color: "#E29074",
    fontWeight: "700",
  },
  waitlistHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  waitlistCountText: {
    fontSize: 14,
    color: "#D1BBA2",
    fontWeight: "600",
  },
  addPartyBtn: {
    backgroundColor: "#C93E2B",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addPartyBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  waitlistContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  emptyWaitlist: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyWaitlistIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyWaitlistTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F3E9DC",
  },
  emptyWaitlistDesc: {
    fontSize: 12,
    color: "#A88F80",
    marginTop: 4,
    textAlign: "center",
  },
  waitlistCard: {
    backgroundColor: "#2A1210",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#44211D",
  },
  waitlistTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  waitlistGuestName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F3E9DC",
  },
  waitlistPartyMeta: {
    fontSize: 12,
    color: "#A88F80",
    marginTop: 2,
  },
  removeWaitlistBtn: {
    padding: 6,
  },
  removeWaitlistText: {
    color: "#A88F80",
    fontSize: 14,
  },
  waitlistNote: {
    fontSize: 12,
    color: "#D1BBA2",
    marginTop: 8,
  },
  waitlistActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  waitlistTime: {
    fontSize: 11,
    color: "#8C7164",
  },
  seatPartyBtn: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  seatPartyBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: "#26100E",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#4A2520",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F3E9DC",
  },
  modalSub: {
    fontSize: 12,
    color: "#A88F80",
    marginTop: 2,
    marginBottom: 16,
  },
  fieldHeading: {
    fontSize: 13,
    color: "#D1BBA2",
    fontWeight: "600",
    marginBottom: 8,
  },
  statusOptions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  statusChoiceBtn: {
    flex: 1,
    backgroundColor: "#3A1A16",
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4A2520",
  },
  statusChoiceBtnActive: {
    borderColor: "#C93E2B",
    backgroundColor: "#4C1C16",
  },
  statusChoiceText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#BCA393",
  },
  statusChoiceTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  modalInput: {
    backgroundColor: "#1B0B09",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4A2520",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#F3E9DC",
    fontSize: 14,
    marginBottom: 14,
  },
  modalBtnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#381714",
  },
  modalCancelText: {
    color: "#BCA393",
    fontSize: 13,
    fontWeight: "600",
  },
  modalSaveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#C93E2B",
  },
  modalSaveText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  seatingTableList: {
    gap: 10,
    paddingVertical: 10,
  },
  seatingTableChip: {
    backgroundColor: "#381714",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4C241F",
  },
  seatingTableChipActive: {
    backgroundColor: "#2E7D32",
    borderColor: "#48BB78",
  },
  seatingTableName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F3E9DC",
  },
  seatingTableNameActive: {
    color: "#FFFFFF",
  },
  seatingTableCap: {
    fontSize: 11,
    color: "#A88F80",
    marginTop: 2,
  },
  noTablesBox: {
    backgroundColor: "#3A2113",
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
  },
  noTablesText: {
    fontSize: 12,
    color: "#F6AD55",
    lineHeight: 16,
  },
});

