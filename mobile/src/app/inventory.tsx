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
  InventoryItem,
  InventoryResponse,
  MenuItem,
  MenuResponse,
} from "../types/pos";

type StockFilter = "all" | "low" | "out";

export default function InventoryScreen() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filter, setFilter] = useState<StockFilter>("all");

  // Restock modal state
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [restockAmount, setRestockAmount] = useState<string>("");
  const [isRestocking, setIsRestocking] = useState<boolean>(false);

  // Add Item modal state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState<string>("");
  const [newItemUnit, setNewItemUnit] = useState<string>("kg");
  const [newItemStock, setNewItemStock] = useState<string>("");
  const [newItemThreshold, setNewItemThreshold] = useState<string>("");
  const [isAdding, setIsAdding] = useState<boolean>(false);

  // Load inventory & menu
  const loadData = useCallback(async () => {
    try {
      const [invRes, menuRes] = await Promise.all([
        apiFetch<InventoryResponse>("/api/inventory"),
        apiFetch<MenuResponse>("/api/menu"),
      ]);

      if (invRes?.inventoryItems) {
        setItems(invRes.inventoryItems);
      }
      if (menuRes?.items) {
        setMenuItems(menuRes.items);
      }
    } catch {
      // Fallback local mock data if offline
      if (items.length === 0) {
        setItems([
          {
            id: "inv-1",
            name: "Basmati Biryani Rice",
            unit: "kg",
            current_stock: 45.0,
            low_stock_threshold: 15.0,
            linked_menu_item_ids: ["chicken-biryani", "mutton-biryani"],
            ingredients: [],
          },
          {
            id: "inv-2",
            name: "Fresh Chicken Breast",
            unit: "kg",
            current_stock: 6.5,
            low_stock_threshold: 10.0,
            linked_menu_item_ids: ["butter-chicken", "chicken-tikka-masala"],
            ingredients: [],
          },
          {
            id: "inv-3",
            name: "Dairy Malai Paneer",
            unit: "kg",
            current_stock: 2.0,
            low_stock_threshold: 5.0,
            linked_menu_item_ids: ["paneer-butter-masala", "kadhai-paneer"],
            ingredients: [],
          },
          {
            id: "inv-4",
            name: "Refined Mustard Oil",
            unit: "L",
            current_stock: 0.0,
            low_stock_threshold: 8.0,
            linked_menu_item_ids: [],
            ingredients: [],
          },
          {
            id: "inv-5",
            name: "Fresh Amul Butter",
            unit: "kg",
            current_stock: 12.0,
            low_stock_threshold: 4.0,
            linked_menu_item_ids: ["butter-chicken", "dal-makhani"],
            ingredients: [],
          },
          {
            id: "inv-6",
            name: "Garam Masala Blend",
            unit: "kg",
            current_stock: 3.5,
            low_stock_threshold: 1.0,
            linked_menu_item_ids: [],
            ingredients: [],
          },
        ]);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [items.length]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    void loadData();
  };

  // Helper status
  const getItemStatus = (item: InventoryItem): "out" | "low" | "in" => {
    if (item.current_stock <= 0) return "out";
    if (item.current_stock <= item.low_stock_threshold) return "low";
    return "in";
  };

  // KPI counts
  const stats = useMemo(() => {
    return {
      total: items.length,
      low: items.filter((it) => it.current_stock > 0 && it.current_stock <= it.low_stock_threshold).length,
      out: items.filter((it) => it.current_stock <= 0).length,
    };
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const st = getItemStatus(it);
      const matchFilter =
        filter === "all" ||
        (filter === "low" && st === "low") ||
        (filter === "out" && st === "out");

      const q = searchQuery.trim().toLowerCase();
      const matchSearch = !q || it.name.toLowerCase().includes(q);

      return matchFilter && matchSearch;
    });
  }, [items, filter, searchQuery]);

  // Handle Restock Submit
  const handleRestockSubmit = async () => {
    if (!restockItem) return;
    const amount = parseFloat(restockAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Quantity", "Please enter a restock quantity greater than zero.");
      return;
    }

    setIsRestocking(true);
    const newStock = restockItem.current_stock + amount;

    try {
      await apiFetch(`/api/inventory/${encodeURIComponent(restockItem.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ current_stock: newStock }),
      });

      setItems((prev) =>
        prev.map((it) =>
          it.id === restockItem.id ? { ...it, current_stock: newStock } : it
        )
      );
      Alert.alert("Restocked", `Added +${amount} ${restockItem.unit} to ${restockItem.name}.`);
      setRestockItem(null);
      setRestockAmount("");
    } catch {
      // Optimistic local update
      setItems((prev) =>
        prev.map((it) =>
          it.id === restockItem.id ? { ...it, current_stock: newStock } : it
        )
      );
      setRestockItem(null);
      setRestockAmount("");
    } finally {
      setIsRestocking(false);
    }
  };

  // Handle Add Item Submit
  const handleAddItemSubmit = async () => {
    if (!newItemName.trim()) {
      Alert.alert("Required", "Please enter item name.");
      return;
    }

    const stock = parseFloat(newItemStock) || 0;
    const thresh = parseFloat(newItemThreshold) || 5;

    setIsAdding(true);
    try {
      const payload = {
        name: newItemName.trim(),
        unit: newItemUnit.trim() || "kg",
        current_stock: stock,
        low_stock_threshold: thresh,
        linked_menu_item_ids: [],
        ingredients: [],
      };

      await apiFetch("/api/inventory", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const newItem: InventoryItem = {
        id: `inv-${Date.now()}`,
        ...payload,
      };
      setItems((prev) => [newItem, ...prev]);

      setNewItemName("");
      setNewItemStock("");
      setNewItemThreshold("");
      setShowAddModal(false);
      Alert.alert("Added", `${newItem.name} has been added to inventory.`);
    } catch {
      setShowAddModal(false);
    } finally {
      setIsAdding(false);
      void loadData();
    }
  };

  return (
    <View style={styles.container}>
      <MobileHeader
        title="Inventory Management"
        subtitle="Stock Control & Supplier Inflow"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        rightAction={
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={styles.headerAddBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.headerAddBtnText}>+ New</Text>
          </TouchableOpacity>
        }
      />

      {/* KPI Stats Strip */}
      <View style={styles.statsStrip}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: "#ECC94B" }]}>{stats.low}</Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: "#E53E3E" }]}>{stats.out}</Text>
          <Text style={styles.statLabel}>Out of Stock</Text>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search raw ingredients & supplies..."
          placeholderTextColor="#998377"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        {(
          [
            { id: "all", label: "All Items" },
            { id: "low", label: "⚠️ Low Stock" },
            { id: "out", label: "🚨 Out of Stock" },
          ] as const
        ).map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterPill, filter === f.id && styles.filterPillActive]}
            onPress={() => setFilter(f.id)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.filterPillText,
                filter === f.id && styles.filterPillTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Inventory Items List */}
      <ScrollView
        style={styles.itemsScroll}
        contentContainerStyle={styles.itemsList}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.map((item) => {
          const st = getItemStatus(item);
          const isOut = st === "out";
          const isLow = st === "low";
          const progressPercent = Math.min(
            100,
            item.low_stock_threshold > 0
              ? (item.current_stock / (item.low_stock_threshold * 2)) * 100
              : 100
          );

          return (
            <View
              key={item.id}
              style={[
                styles.itemCard,
                isOut && styles.cardOut,
                isLow && styles.cardLow,
              ]}
            >
              <View style={styles.itemCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemUnits}>
                    Current:{" "}
                    <Text style={[styles.stockValue, isOut ? { color: "#E53E3E" } : isLow ? { color: "#ECC94B" } : { color: "#48BB78" }]}>
                      {item.current_stock} {item.unit}
                    </Text>{" "}
                    • Threshold: {item.low_stock_threshold} {item.unit}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusTag,
                    isOut
                      ? styles.tagOut
                      : isLow
                      ? styles.tagLow
                      : styles.tagIn,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusTagText,
                      isOut
                        ? { color: "#E53E3E" }
                        : isLow
                        ? { color: "#ECC94B" }
                        : { color: "#48BB78" },
                    ]}
                  >
                    {isOut ? "OUT OF STOCK" : isLow ? "LOW STOCK" : "IN STOCK"}
                  </Text>
                </View>
              </View>

              {/* Stock level bar */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${progressPercent}%`,
                      backgroundColor: isOut
                        ? "#E53E3E"
                        : isLow
                        ? "#ECC94B"
                        : "#48BB78",
                    },
                  ]}
                />
              </View>

              {/* Card Footer & Restock button */}
              <View style={styles.cardFooter}>
                <Text style={styles.linkedCount}>
                  {item.linked_menu_item_ids?.length || 0} linked recipe dishes
                </Text>
                <TouchableOpacity
                  style={styles.restockBtn}
                  onPress={() => {
                    setRestockItem(item);
                    setRestockAmount("10");
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.restockBtnText}>+ Restock 📦</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {filteredItems.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>No matching inventory items found.</Text>
          </View>
        )}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* RESTOCK MODAL */}
      <Modal visible={!!restockItem} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Restock Inventory</Text>
            <Text style={styles.modalSubtitle}>
              {restockItem?.name} (Current: {restockItem?.current_stock}{" "}
              {restockItem?.unit})
            </Text>

            {/* Quick add chips */}
            <Text style={styles.fieldHeading}>Quick Add Units:</Text>
            <View style={styles.quickUnitsRow}>
              {[5, 10, 25, 50].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[
                    styles.unitChip,
                    restockAmount === amt.toString() && styles.unitChipActive,
                  ]}
                  onPress={() => setRestockAmount(amt.toString())}
                >
                  <Text
                    style={[
                      styles.unitChipText,
                      restockAmount === amt.toString() && styles.unitChipTextActive,
                    ]}
                  >
                    +{amt} {restockItem?.unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldHeading}>Or Custom Amount:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={`Quantity in ${restockItem?.unit}`}
              placeholderTextColor="#998377"
              keyboardType="numeric"
              value={restockAmount}
              onChangeText={setRestockAmount}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRestockItem(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleRestockSubmit}
                disabled={isRestocking}
              >
                {isRestocking ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Confirm Restock</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ADD ITEM MODAL */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Inventory Item</Text>
            <Text style={styles.modalSubtitle}>Track raw material or ingredient</Text>

            <Text style={styles.fieldHeading}>Item Name *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Saffron / Kesar"
              placeholderTextColor="#998377"
              value={newItemName}
              onChangeText={setNewItemName}
            />

            <Text style={styles.fieldHeading}>Unit of Measurement</Text>
            <View style={styles.quickUnitsRow}>
              {["kg", "g", "L", "ml", "pcs"].map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[
                    styles.unitChip,
                    newItemUnit === u && styles.unitChipActive,
                  ]}
                  onPress={() => setNewItemUnit(u)}
                >
                  <Text
                    style={[
                      styles.unitChipText,
                      newItemUnit === u && styles.unitChipTextActive,
                    ]}
                  >
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldHeading}>Initial Stock Level</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 10"
              placeholderTextColor="#998377"
              keyboardType="numeric"
              value={newItemStock}
              onChangeText={setNewItemStock}
            />

            <Text style={styles.fieldHeading}>Low Stock Alert Threshold</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 3"
              placeholderTextColor="#998377"
              keyboardType="numeric"
              value={newItemThreshold}
              onChangeText={setNewItemThreshold}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleAddItemSubmit}
                disabled={isAdding}
              >
                {isAdding ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Add Item</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1F0E0C",
  },
  headerAddBtn: {
    backgroundColor: "#C93E2B",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  headerAddBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
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
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2C1411",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4A2520",
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 42,
    color: "#F3E9DC",
    fontSize: 14,
  },
  clearText: {
    color: "#BCA393",
    fontSize: 14,
    padding: 6,
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
  itemsScroll: {
    flex: 1,
  },
  itemsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  itemCard: {
    backgroundColor: "#2A1210",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#44211D",
  },
  cardLow: {
    borderLeftWidth: 4,
    borderLeftColor: "#ECC94B",
  },
  cardOut: {
    borderLeftWidth: 4,
    borderLeftColor: "#E53E3E",
  },
  itemCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F3E9DC",
  },
  itemUnits: {
    fontSize: 12,
    color: "#A88F80",
    marginTop: 4,
  },
  stockValue: {
    fontWeight: "700",
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagIn: {
    backgroundColor: "#1B3821",
  },
  tagLow: {
    backgroundColor: "#3A2E12",
  },
  tagOut: {
    backgroundColor: "#3E1715",
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: "800",
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: "#3A1A16",
    borderRadius: 3,
    marginVertical: 12,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  linkedCount: {
    fontSize: 11,
    color: "#8C7164",
  },
  restockBtn: {
    backgroundColor: "#3A1A16",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#C93E2B",
  },
  restockBtnText: {
    fontSize: 12,
    color: "#E29074",
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyText: {
    color: "#A88F80",
    fontSize: 14,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
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
  modalSubtitle: {
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
  quickUnitsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  unitChip: {
    flex: 1,
    backgroundColor: "#381714",
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4C241F",
  },
  unitChipActive: {
    backgroundColor: "#C93E2B",
    borderColor: "#C93E2B",
  },
  unitChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#BCA393",
  },
  unitChipTextActive: {
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
});

