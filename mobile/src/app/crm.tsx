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
  Linking,
} from "react-native";
import { MobileHeader } from "../components/navigation/MobileHeader";
import { BottomNavBar } from "../components/navigation/BottomNavBar";
import { apiFetch } from "../config/apiClient";
import { formatCurrency } from "../utils/billing";
import type {
  Customer,
  CustomersResponse,
  CustomerResponse,
  OrdersResponse,
  PosOrder,
} from "../types/pos";

type FilterTab = "all" | "regular" | "vip" | "with-orders";

const PRESET_TAGS = [
  "VIP",
  "Regular",
  "Family",
  "Corporate",
  "High Spender",
  "Vegetarian",
  "Weekend Diner",
];

export default function CrmScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<PosOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Customer Profile Sheet / Modal
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [notesInput, setNotesInput] = useState<string>("");
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  const [pointDeltaInput, setPointDeltaInput] = useState<string>("");
  const [isUpdatingPoints, setIsUpdatingPoints] = useState<boolean>(false);
  const [customTagInput, setCustomTagInput] = useState<string>("");
  const [isUpdatingTags, setIsUpdatingTags] = useState<boolean>(false);

  // Add Customer Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");
  const [newPhone, setNewPhone] = useState<string>("");
  const [newEmail, setNewEmail] = useState<string>("");
  const [newAddress, setNewAddress] = useState<string>("");
  const [newNotes, setNewNotes] = useState<string>("");
  const [newPoints, setNewPoints] = useState<string>("50");
  const [isCreatingCustomer, setIsCreatingCustomer] = useState<boolean>(false);

  // Fetch Customers & Orders
  const loadData = useCallback(async () => {
    try {
      const [custRes, ordRes] = await Promise.all([
        apiFetch<CustomersResponse>("/api/customers"),
        apiFetch<OrdersResponse>("/api/orders"),
      ]);

      if (custRes?.customers) {
        setCustomers(custRes.customers);
      }
      if (ordRes?.orders) {
        setOrders(ordRes.orders);
      }
    } catch {
      // Fallback local mock customers if offline
      if (customers.length === 0) {
        setCustomers([
          {
            id: "cust-1",
            name: "Rajesh Kumar",
            phone: "+91 98765 43210",
            email: "rajesh.kumar@example.com",
            address: "402, Lotus Residency, Mumbai",
            created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
            notes: "Prefers mild spice in curries. Regular weekend diner.",
            tags: ["VIP", "Regular", "Family"],
            loyalty_points: 340,
          },
          {
            id: "cust-2",
            name: "Ananya Deshmukh",
            phone: "+91 98220 12345",
            email: "ananya.d@example.com",
            address: "12/B Bandra West, Mumbai",
            created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
            notes: "Strictly vegetarian. Loves Dal Makhani and Paneer Tikka.",
            tags: ["Vegetarian", "Regular"],
            loyalty_points: 180,
          },
          {
            id: "cust-3",
            name: "Vikram Malhotra",
            phone: "+91 99887 76655",
            email: "vikram@techcorp.in",
            address: "Corporate Suites, BKC, Mumbai",
            created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
            notes: "Corporate accounts diner. Always requests table 04.",
            tags: ["Corporate", "High Spender", "VIP"],
            loyalty_points: 750,
          },
          {
            id: "cust-4",
            name: "Pooja Sharma",
            phone: "+91 97654 32100",
            email: "pooja.sharma@example.com",
            created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
            notes: "First time online order customer.",
            tags: ["Weekend Diner"],
            loyalty_points: 50,
          },
        ]);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [customers.length]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    void loadData();
  };

  // Correlate orders for a given customer
  const getOrdersForCustomer = useCallback(
    (customer: Customer): PosOrder[] => {
      const phoneDigits = customer.phone.replace(/\D/g, "");

      return orders
        .filter((order) => {
          if (order.customerId === customer.id) return true;

          if (phoneDigits) {
            const orderPhone = (
              order.details?.delivery?.phone ||
              (order.details as any)?.customer?.phone ||
              ""
            ).replace(/\D/g, "");

            if (
              orderPhone &&
              (orderPhone === phoneDigits ||
                (phoneDigits.length >= 6 &&
                  orderPhone.length >= 6 &&
                  (orderPhone.endsWith(phoneDigits) || phoneDigits.endsWith(orderPhone))))
            ) {
              return true;
            }
          }

          return false;
        })
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    },
    [orders]
  );

  // Customer stats map
  const customerStatsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        totalOrders: number;
        completedOrders: number;
        totalSpent: number;
        isRegular: boolean;
        isVip: boolean;
        lastOrder: PosOrder | null;
      }
    >();

    for (const cust of customers) {
      const custOrders = getOrdersForCustomer(cust);
      const completed = custOrders.filter((o) => o.status === "completed");
      const spent = completed.reduce(
        (sum, o) => sum + (o.totals?.grandTotal || 0),
        0
      );
      const isVip =
        (cust.tags || []).includes("VIP") ||
        (cust.tags || []).includes("High Spender") ||
        (cust.loyalty_points || 0) >= 300;

      map.set(cust.id, {
        totalOrders: custOrders.length,
        completedOrders: completed.length,
        totalSpent: spent,
        isRegular: completed.length >= 3 || (cust.tags || []).includes("Regular"),
        isVip,
        lastOrder: custOrders[0] || null,
      });
    }

    return map;
  }, [customers, getOrdersForCustomer]);

  // Overall CRM KPIs
  const overallStats = useMemo(() => {
    let regularCount = 0;
    let vipCount = 0;
    let totalPoints = 0;

    for (const cust of customers) {
      totalPoints += cust.loyalty_points || 0;
      const stats = customerStatsMap.get(cust.id);
      if (stats?.isRegular) regularCount++;
      if (stats?.isVip) vipCount++;
    }

    return {
      totalGuests: customers.length,
      regularCount,
      vipCount,
      totalPoints,
    };
  }, [customers, customerStatsMap]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      const stats = customerStatsMap.get(cust.id);

      // Tab filter
      if (activeTab === "regular" && !stats?.isRegular) return false;
      if (activeTab === "vip" && !stats?.isVip) return false;
      if (activeTab === "with-orders" && (!stats || stats.totalOrders === 0)) return false;

      // Tag filter
      if (selectedTag && !(cust.tags || []).includes(selectedTag)) return false;

      // Search query
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;

      return (
        cust.name.toLowerCase().includes(q) ||
        cust.phone.toLowerCase().includes(q) ||
        (cust.email && cust.email.toLowerCase().includes(q)) ||
        (cust.notes && cust.notes.toLowerCase().includes(q)) ||
        (cust.tags && cust.tags.some((t) => t.toLowerCase().includes(q)))
      );
    });
  }, [customers, customerStatsMap, activeTab, selectedTag, searchQuery]);

  // Select customer for profile sheet
  const handleOpenCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setNotesInput(customer.notes || "");
    setPointDeltaInput("");
    setCustomTagInput("");
  };

  // Save guest notes
  const handleSaveNotes = async () => {
    if (!selectedCustomer) return;
    setIsSavingNotes(true);

    try {
      const res = await apiFetch<CustomerResponse>(
        `/api/customers/${encodeURIComponent(selectedCustomer.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ notes: notesInput }),
        }
      );

      if (res?.customer) {
        setSelectedCustomer(res.customer);
        setCustomers((prev) =>
          prev.map((c) => (c.id === res.customer.id ? res.customer : c))
        );
      }
      Alert.alert("Notes Saved", "Guest preferences updated successfully.");
    } catch {
      // Optimistic update
      setSelectedCustomer((prev) => (prev ? { ...prev, notes: notesInput } : null));
      setCustomers((prev) =>
        prev.map((c) => (c.id === selectedCustomer.id ? { ...c, notes: notesInput } : c))
      );
      Alert.alert("Saved", "Guest notes updated locally.");
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Toggle tag
  const handleToggleTag = async (tag: string) => {
    if (!selectedCustomer || isUpdatingTags) return;
    setIsUpdatingTags(true);

    const currentTags = selectedCustomer.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];

    try {
      const res = await apiFetch<CustomerResponse>(
        `/api/customers/${encodeURIComponent(selectedCustomer.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ tags: newTags }),
        }
      );

      if (res?.customer) {
        setSelectedCustomer(res.customer);
        setCustomers((prev) =>
          prev.map((c) => (c.id === res.customer.id ? res.customer : c))
        );
      }
    } catch {
      // Optimistic update
      setSelectedCustomer((prev) => (prev ? { ...prev, tags: newTags } : null));
      setCustomers((prev) =>
        prev.map((c) => (c.id === selectedCustomer.id ? { ...c, tags: newTags } : c))
      );
    } finally {
      setIsUpdatingTags(false);
    }
  };

  // Add custom tag
  const handleAddCustomTag = async () => {
    if (!selectedCustomer || !customTagInput.trim() || isUpdatingTags) return;
    const cleanTag = customTagInput.trim();
    if ((selectedCustomer.tags || []).includes(cleanTag)) {
      setCustomTagInput("");
      return;
    }
    await handleToggleTag(cleanTag);
    setCustomTagInput("");
  };

  // Adjust loyalty points
  const handleAdjustPoints = async (delta: number) => {
    if (!selectedCustomer || isUpdatingPoints) return;
    const currentPoints = selectedCustomer.loyalty_points || 0;
    const newPoints = Math.max(0, currentPoints + delta);

    setIsUpdatingPoints(true);
    try {
      const res = await apiFetch<CustomerResponse>(
        `/api/customers/${encodeURIComponent(selectedCustomer.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ loyalty_points: newPoints }),
        }
      );

      if (res?.customer) {
        setSelectedCustomer(res.customer);
        setCustomers((prev) =>
          prev.map((c) => (c.id === res.customer.id ? res.customer : c))
        );
      }
      setPointDeltaInput("");
      Alert.alert("Loyalty Updated", `Guest now has ${newPoints} points.`);
    } catch {
      // Optimistic update
      setSelectedCustomer((prev) =>
        prev ? { ...prev, loyalty_points: newPoints } : null
      );
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === selectedCustomer.id ? { ...c, loyalty_points: newPoints } : c
        )
      );
      setPointDeltaInput("");
    } finally {
      setIsUpdatingPoints(false);
    }
  };

  // Create new customer
  const handleCreateCustomer = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      Alert.alert("Missing Fields", "Customer name and phone number are required.");
      return;
    }

    setIsCreatingCustomer(true);
    const initialPts = parseInt(newPoints.trim(), 10) || 50;

    try {
      const payload = {
        name: newName.trim(),
        phone: newPhone.trim(),
        email: newEmail.trim() || undefined,
        address: newAddress.trim() || undefined,
        notes: newNotes.trim() || undefined,
        tags: ["Regular"],
        loyalty_points: initialPts,
      };

      const res = await apiFetch<CustomerResponse>("/api/customers", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res?.customer) {
        setCustomers((prev) => [res.customer, ...prev]);
      } else {
        const localNew: Customer = {
          id: `cust-${Date.now()}`,
          ...payload,
          created_at: new Date().toISOString(),
        };
        setCustomers((prev) => [localNew, ...prev]);
      }

      setNewName("");
      setNewPhone("");
      setNewEmail("");
      setNewAddress("");
      setNewNotes("");
      setShowAddModal(false);
      Alert.alert("Guest Created", `${payload.name} has been enrolled in BhojanHub CRM!`);
    } catch {
      setShowAddModal(false);
    } finally {
      setIsCreatingCustomer(false);
      void loadData();
    }
  };

  return (
    <View style={styles.container}>
      <MobileHeader
        title="Guest CRM & Loyalty"
        subtitle="Customer Directory & VIP Relations"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        rightAction={
          <TouchableOpacity
            style={styles.headerAddBtn}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.headerAddBtnText}>+ Add Guest</Text>
          </TouchableOpacity>
        }
      />

      {/* KPI Stats Strip */}
      <View style={styles.kpiStrip}>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiValue}>{overallStats.totalGuests}</Text>
          <Text style={styles.kpiLabel}>Total Guests</Text>
        </View>
        <View style={styles.kpiBox}>
          <Text style={[styles.kpiValue, { color: "#48BB78" }]}>
            {overallStats.regularCount}
          </Text>
          <Text style={styles.kpiLabel}>Regulars</Text>
        </View>
        <View style={styles.kpiBox}>
          <Text style={[styles.kpiValue, { color: "#ECC94B" }]}>
            {overallStats.vipCount}
          </Text>
          <Text style={styles.kpiLabel}>VIP Members</Text>
        </View>
        <View style={styles.kpiBox}>
          <Text style={[styles.kpiValue, { color: "#E29074" }]}>
            {overallStats.totalPoints}
          </Text>
          <Text style={styles.kpiLabel}>Loyalty Pts</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, phone, email, or notes..."
          placeholderTextColor="#998377"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabRow}>
        {(
          [
            { id: "all", label: "All" },
            { id: "regular", label: "🌟 Regulars" },
            { id: "vip", label: "👑 VIP" },
            { id: "with-orders", label: "🧾 With Orders" },
          ] as const
        ).map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabChip, activeTab === tab.id && styles.tabChipActive]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.tabChipText,
                activeTab === tab.id && styles.tabChipTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Preset Tag Horizontal Pills */}
      <View style={styles.tagScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagScrollContent}
        >
          <TouchableOpacity
            style={[styles.tagPill, selectedTag === null && styles.tagPillActive]}
            onPress={() => setSelectedTag(null)}
          >
            <Text
              style={[
                styles.tagPillText,
                selectedTag === null && styles.tagPillTextActive,
              ]}
            >
              All Tags
            </Text>
          </TouchableOpacity>
          {PRESET_TAGS.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.tagPill, selectedTag === tag && styles.tagPillActive]}
              onPress={() => setSelectedTag(selectedTag === tag ? null : tag)}
            >
              <Text
                style={[
                  styles.tagPillText,
                  selectedTag === tag && styles.tagPillTextActive,
                ]}
              >
                #{tag}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Customers List */}
      <ScrollView
        style={styles.customerScroll}
        contentContainerStyle={styles.customerListContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredCustomers.map((cust) => {
          const stats = customerStatsMap.get(cust.id);
          const isVip = stats?.isVip;

          return (
            <TouchableOpacity
              key={cust.id}
              style={[styles.customerCard, isVip && styles.customerCardVip]}
              onPress={() => handleOpenCustomer(cust)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={styles.nameAvatarRow}>
                  <View
                    style={[
                      styles.avatarBadge,
                      isVip && { backgroundColor: "#ECC94B" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.avatarLetter,
                        isVip && { color: "#3A1A16" },
                      ]}
                    >
                      {cust.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.custName}>{cust.name}</Text>
                    <Text style={styles.custPhone}>📞 {cust.phone}</Text>
                  </View>
                </View>

                {/* Loyalty points badge */}
                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsBadgeText}>
                    ⭐ {cust.loyalty_points || 0} pts
                  </Text>
                </View>
              </View>

              {/* Tags Row */}
              {cust.tags && cust.tags.length > 0 && (
                <View style={styles.custTagsRow}>
                  {cust.tags.map((t) => (
                    <View key={t} style={styles.tagChip}>
                      <Text style={styles.tagChipText}>#{t}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Notes snippet */}
              {cust.notes ? (
                <Text style={styles.notesSnippet} numberOfLines={2}>
                  📝 {cust.notes}
                </Text>
              ) : null}

              {/* Order Stats summary */}
              <View style={styles.cardFooter}>
                <Text style={styles.orderStatText}>
                  {stats?.totalOrders || 0} orders • Total spent:{" "}
                  <Text style={styles.orderStatHighlight}>
                    {formatCurrency(stats?.totalSpent || 0)}
                  </Text>
                </Text>
                <Text style={styles.viewProfileArrow}>Profile →</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {filteredCustomers.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No guests found</Text>
            <Text style={styles.emptyDesc}>
              Try adjusting your search query or filter tags.
            </Text>
          </View>
        )}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* CUSTOMER DETAIL PROFILE MODAL */}
      <Modal visible={!!selectedCustomer} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.profileSheet}>
            <View style={styles.sheetTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetName}>{selectedCustomer?.name}</Text>
                <Text style={styles.sheetPhone}>
                  Member since{" "}
                  {selectedCustomer?.created_at
                    ? new Date(selectedCustomer.created_at).toLocaleDateString()
                    : "Recent"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedCustomer(null)}
                style={styles.sheetCloseBtn}
              >
                <Text style={styles.sheetCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.sheetScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Quick Contact Buttons */}
              <View style={styles.contactRow}>
                {selectedCustomer?.phone && (
                  <TouchableOpacity
                    style={styles.contactBtn}
                    onPress={() => Linking.openURL(`tel:${selectedCustomer.phone}`)}
                  >
                    <Text style={styles.contactBtnText}>
                      📞 Call {selectedCustomer.phone}
                    </Text>
                  </TouchableOpacity>
                )}
                {selectedCustomer?.email ? (
                  <TouchableOpacity
                    style={[styles.contactBtn, { backgroundColor: "#381714" }]}
                    onPress={() => Linking.openURL(`mailto:${selectedCustomer.email}`)}
                  >
                    <Text style={styles.contactBtnText}>
                      ✉️ {selectedCustomer.email}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Loyalty Points Section */}
              <View style={styles.sheetSection}>
                <View style={styles.sectionHeaderBetween}>
                  <Text style={styles.sheetSectionTitle}>Loyalty Rewards</Text>
                  <Text style={styles.sheetSectionPoints}>
                    ⭐ {selectedCustomer?.loyalty_points || 0} Points
                  </Text>
                </View>

                <Text style={styles.fieldLabel}>Quick Adjust Points:</Text>
                <View style={styles.pointsAdjustRow}>
                  {[+10, +25, +50, +100].map((pts) => (
                    <TouchableOpacity
                      key={pts}
                      style={styles.adjustPtsBtn}
                      onPress={() => handleAdjustPoints(pts)}
                      disabled={isUpdatingPoints}
                    >
                      <Text style={styles.adjustPtsText}>+{pts}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[styles.adjustPtsBtn, { backgroundColor: "#3E1715" }]}
                    onPress={() => handleAdjustPoints(-50)}
                    disabled={isUpdatingPoints}
                  >
                    <Text style={[styles.adjustPtsText, { color: "#E53E3E" }]}>
                      −50
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Tags Section */}
              <View style={styles.sheetSection}>
                <Text style={styles.sheetSectionTitle}>Tags & VIP Segments</Text>
                <View style={styles.toggleTagsContainer}>
                  {PRESET_TAGS.map((tag) => {
                    const active = (selectedCustomer?.tags || []).includes(tag);
                    return (
                      <TouchableOpacity
                        key={tag}
                        style={[styles.toggleTagChip, active && styles.toggleTagChipActive]}
                        onPress={() => handleToggleTag(tag)}
                        disabled={isUpdatingTags}
                      >
                        <Text
                          style={[
                            styles.toggleTagText,
                            active && styles.toggleTagTextActive,
                          ]}
                        >
                          {active ? "✓ " : "+ "}
                          {tag}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Custom Tag Input */}
                <View style={styles.customTagRow}>
                  <TextInput
                    style={styles.customTagInput}
                    placeholder="Add custom tag (e.g. Anniversary)..."
                    placeholderTextColor="#998377"
                    value={customTagInput}
                    onChangeText={setCustomTagInput}
                  />
                  <TouchableOpacity
                    style={styles.customTagBtn}
                    onPress={handleAddCustomTag}
                    disabled={!customTagInput.trim() || isUpdatingTags}
                  >
                    <Text style={styles.customTagBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Guest Notes Section */}
              <View style={styles.sheetSection}>
                <Text style={styles.sheetSectionTitle}>
                  Guest Preferences & Dietary Notes
                </Text>
                <TextInput
                  style={styles.notesTextarea}
                  placeholder="e.g. Favorite table, allergy alerts, birthday month..."
                  placeholderTextColor="#998377"
                  multiline
                  numberOfLines={4}
                  value={notesInput}
                  onChangeText={setNotesInput}
                />
                <TouchableOpacity
                  style={[styles.saveNotesBtn, isSavingNotes && { opacity: 0.6 }]}
                  onPress={handleSaveNotes}
                  disabled={isSavingNotes}
                >
                  {isSavingNotes ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.saveNotesBtnText}>Save Preferences</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Recent Orders Timeline */}
              {selectedCustomer && (
                <View style={styles.sheetSection}>
                  <Text style={styles.sheetSectionTitle}>
                    Order History (
                    {getOrdersForCustomer(selectedCustomer).length})
                  </Text>
                  {getOrdersForCustomer(selectedCustomer).length === 0 ? (
                    <Text style={styles.noOrdersText}>
                      No past dining transactions recorded for this guest.
                    </Text>
                  ) : (
                    getOrdersForCustomer(selectedCustomer).map((ord) => (
                      <View key={ord.id} style={styles.orderHistoryCard}>
                        <View style={styles.orderHistoryTop}>
                          <Text style={styles.orderHistoryNum}>
                            Order #{ord.orderNumber || ord.id.slice(-6)}
                          </Text>
                          <Text style={styles.orderHistoryTotal}>
                            {formatCurrency(ord.totals?.grandTotal || 0)}
                          </Text>
                        </View>
                        <Text style={styles.orderHistoryMeta}>
                          {ord.details?.type || "Dine In"} •{" "}
                          {new Date(ord.createdAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          • Status:{" "}
                          <Text
                            style={{
                              color:
                                ord.status === "completed"
                                  ? "#48BB78"
                                  : "#ECC94B",
                              fontWeight: "700",
                            }}
                          >
                            {ord.status.toUpperCase()}
                          </Text>
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ADD CUSTOMER MODAL */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.addModalCard}>
            <Text style={styles.modalHeaderTitle}>Add New Guest</Text>
            <Text style={styles.modalHeaderSub}>
              Enroll customer into BhojanHub loyalty & directory
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Full Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Suman Sharma"
                placeholderTextColor="#998377"
                value={newName}
                onChangeText={setNewName}
              />

              <Text style={styles.formLabel}>Contact Phone *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="+91 98765 43210"
                placeholderTextColor="#998377"
                keyboardType="phone-pad"
                value={newPhone}
                onChangeText={setNewPhone}
              />

              <Text style={styles.formLabel}>Email Address</Text>
              <TextInput
                style={styles.formInput}
                placeholder="suman@example.com"
                placeholderTextColor="#998377"
                keyboardType="email-address"
                autoCapitalize="none"
                value={newEmail}
                onChangeText={setNewEmail}
              />

              <Text style={styles.formLabel}>Home / Delivery Address</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Apartment, Street, Landmark..."
                placeholderTextColor="#998377"
                value={newAddress}
                onChangeText={setNewAddress}
              />

              <Text style={styles.formLabel}>Initial Loyalty Points</Text>
              <TextInput
                style={styles.formInput}
                placeholder="50"
                placeholderTextColor="#998377"
                keyboardType="numeric"
                value={newPoints}
                onChangeText={setNewPoints}
              />

              <Text style={styles.formLabel}>Dietary Preferences & Notes</Text>
              <TextInput
                style={[styles.formInput, { height: 60 }]}
                placeholder="Allergies, table preferences, family notes..."
                placeholderTextColor="#998377"
                multiline
                value={newNotes}
                onChangeText={setNewNotes}
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
                  onPress={handleCreateCustomer}
                  disabled={isCreatingCustomer}
                >
                  {isCreatingCustomer ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.modalSaveText}>Enroll Guest</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <BottomNavBar activeTab="crm" />
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
  kpiStrip: {
    flexDirection: "row",
    backgroundColor: "#2C1411",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#42201C",
  },
  kpiBox: {
    flex: 1,
    alignItems: "center",
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F3E9DC",
  },
  kpiLabel: {
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
  clearSearchText: {
    color: "#BCA393",
    fontSize: 14,
    padding: 6,
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#2C1411",
    borderWidth: 1,
    borderColor: "#4A2520",
  },
  tabChipActive: {
    backgroundColor: "#C93E2B",
    borderColor: "#C93E2B",
  },
  tabChipText: {
    fontSize: 12,
    color: "#BCA393",
    fontWeight: "600",
  },
  tabChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  tagScrollWrapper: {
    marginVertical: 10,
  },
  tagScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "#2C1411",
    borderWidth: 1,
    borderColor: "#4A2520",
  },
  tagPillActive: {
    backgroundColor: "#3A1A16",
    borderColor: "#E29074",
  },
  tagPillText: {
    fontSize: 11,
    color: "#A88F80",
    fontWeight: "500",
  },
  tagPillTextActive: {
    color: "#E29074",
    fontWeight: "700",
  },
  customerScroll: {
    flex: 1,
  },
  customerListContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  customerCard: {
    backgroundColor: "#2A1210",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#44211D",
  },
  customerCardVip: {
    borderColor: "#ECC94B",
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  nameAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#3A1A16",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#5A2822",
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F3E9DC",
  },
  custName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F3E9DC",
  },
  custPhone: {
    fontSize: 12,
    color: "#A88F80",
    marginTop: 2,
  },
  pointsBadge: {
    backgroundColor: "#381714",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#5A2822",
  },
  pointsBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ECC94B",
  },
  custTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  tagChip: {
    backgroundColor: "#3A1A16",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagChipText: {
    fontSize: 11,
    color: "#E29074",
    fontWeight: "600",
  },
  notesSnippet: {
    fontSize: 12,
    color: "#D1BBA2",
    marginTop: 8,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#381714",
  },
  orderStatText: {
    fontSize: 12,
    color: "#A88F80",
  },
  orderStatHighlight: {
    color: "#F3E9DC",
    fontWeight: "700",
  },
  viewProfileArrow: {
    fontSize: 12,
    fontWeight: "700",
    color: "#C93E2B",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F3E9DC",
  },
  emptyDesc: {
    fontSize: 12,
    color: "#A88F80",
    marginTop: 4,
  },
  // Modal / Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  profileSheet: {
    backgroundColor: "#26100E",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "88%",
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#4A2520",
  },
  sheetTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#3A1A16",
    paddingBottom: 12,
  },
  sheetName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F3E9DC",
  },
  sheetPhone: {
    fontSize: 12,
    color: "#A88F80",
    marginTop: 2,
  },
  sheetCloseBtn: {
    padding: 6,
  },
  sheetCloseText: {
    color: "#A88F80",
    fontSize: 18,
  },
  sheetScroll: {
    gap: 16,
    paddingBottom: 30,
  },
  contactRow: {
    flexDirection: "row",
    gap: 10,
  },
  contactBtn: {
    flex: 1,
    backgroundColor: "#2E7D32",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  contactBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  sheetSection: {
    backgroundColor: "#1F0E0C",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#3A1A16",
  },
  sectionHeaderBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sheetSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F3E9DC",
    marginBottom: 8,
  },
  sheetSectionPoints: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ECC94B",
  },
  fieldLabel: {
    fontSize: 12,
    color: "#A88F80",
    marginBottom: 6,
  },
  pointsAdjustRow: {
    flexDirection: "row",
    gap: 8,
  },
  adjustPtsBtn: {
    flex: 1,
    backgroundColor: "#3A1A16",
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4A2520",
  },
  adjustPtsText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ECC94B",
  },
  toggleTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 6,
  },
  toggleTagChip: {
    backgroundColor: "#381714",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4A2520",
  },
  toggleTagChipActive: {
    backgroundColor: "#C93E2B",
    borderColor: "#C93E2B",
  },
  toggleTagText: {
    fontSize: 12,
    color: "#D1BBA2",
  },
  toggleTagTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  customTagRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  customTagInput: {
    flex: 1,
    backgroundColor: "#2C1411",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4A2520",
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: "#F3E9DC",
    fontSize: 13,
  },
  customTagBtn: {
    backgroundColor: "#3A1A16",
    borderWidth: 1,
    borderColor: "#C93E2B",
    paddingHorizontal: 14,
    justifyContent: "center",
    borderRadius: 8,
  },
  customTagBtnText: {
    color: "#E29074",
    fontSize: 12,
    fontWeight: "700",
  },
  notesTextarea: {
    backgroundColor: "#2C1411",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4A2520",
    padding: 10,
    color: "#F3E9DC",
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: "top",
  },
  saveNotesBtn: {
    backgroundColor: "#C93E2B",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 10,
  },
  saveNotesBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  orderHistoryCard: {
    borderBottomWidth: 1,
    borderBottomColor: "#2C1411",
    paddingVertical: 8,
  },
  orderHistoryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  orderHistoryNum: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F3E9DC",
  },
  orderHistoryTotal: {
    fontSize: 13,
    fontWeight: "700",
    color: "#E29074",
  },
  orderHistoryMeta: {
    fontSize: 11,
    color: "#A88F80",
    marginTop: 2,
  },
  noOrdersText: {
    fontSize: 12,
    color: "#A88F80",
    fontStyle: "italic",
    paddingVertical: 8,
  },
  // Add Customer Modal
  addModalCard: {
    backgroundColor: "#26100E",
    borderRadius: 16,
    padding: 20,
    margin: 20,
    borderWidth: 1,
    borderColor: "#4A2520",
    maxHeight: "85%",
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F3E9DC",
  },
  modalHeaderSub: {
    fontSize: 12,
    color: "#A88F80",
    marginTop: 2,
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 12,
    color: "#D1BBA2",
    fontWeight: "600",
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: "#1F0E0C",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4A2520",
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#F3E9DC",
    fontSize: 13,
    marginBottom: 10,
  },
  modalBtnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 10,
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

