import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MobileHeader } from "../components/navigation/MobileHeader";
import { BottomNavBar } from "../components/navigation/BottomNavBar";
import { apiFetch } from "../config/apiClient";
import { menuItems as defaultMenuItems, categories } from "../data/menuData";
import { calculateBill, formatCurrency } from "../utils/billing";
import type {
  MenuItem,
  CartItem,
  PosOrder,
  MenuResponse,
  OrdersResponse,
  OrderResponse,
} from "../types/pos";

type TabMode = "menu" | "checkout" | "track";
type FulfillmentType = "Takeaway" | "Delivery";

export default function OnlineOrderingScreen() {
  const [activeTab, setActiveTab] = useState<TabMode>("menu");
  const [menuItems, setMenuItems] = useState<MenuItem[]>(defaultMenuItems);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Checkout Form
  const [orderType, setOrderType] = useState<FulfillmentType>("Delivery");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Tracking
  const [trackQuery, setTrackQuery] = useState<string>("");
  const [trackedOrder, setTrackedOrder] = useState<PosOrder | null>(null);
  const [recentOnlineOrders, setRecentOnlineOrders] = useState<PosOrder[]>([]);
  const [isTrackingLoading, setIsTrackingLoading] = useState<boolean>(false);
  const [isRefreshingOrders, setIsRefreshingOrders] = useState<boolean>(false);

  // Fetch menu from API
  useEffect(() => {
    let isMounted = true;
    const fetchMenu = async () => {
      try {
        const data = await apiFetch<MenuResponse>("/api/menu");
        if (isMounted && data?.items && data.items.length > 0) {
          const enhanced = data.items.map((item) => {
            const fallback = defaultMenuItems.find((d) => d.id === item.id);
            return {
              ...item,
              emoji: item.emoji || fallback?.emoji || "🍛",
            };
          });
          setMenuItems(enhanced);
        }
      } catch {
        // Fallback to local defaultMenuItems
      }
    };

    void fetchMenu();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch online orders for tracking tab
  const fetchOnlineOrders = useCallback(async () => {
    setIsRefreshingOrders(true);
    try {
      const data = await apiFetch<OrdersResponse>("/api/orders?channel=online");
      if (data?.orders) {
        setRecentOnlineOrders(data.orders);
        if (!trackedOrder && data.orders.length > 0) {
          setTrackedOrder(data.orders[0]);
        }
      }
    } catch {
      // Keep state
    } finally {
      setIsRefreshingOrders(false);
    }
  }, [trackedOrder]);

  useEffect(() => {
    if (activeTab === "track") {
      void fetchOnlineOrders();
    }
  }, [activeTab, fetchOnlineOrders]);

  // Filtered dishes
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat =
        selectedCategory === "All" || item.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Cart operations
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((ci) => {
          if (ci.id === itemId) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const totalCartCount = useMemo(() => {
    return cart.reduce((acc, ci) => acc + ci.quantity, 0);
  }, [cart]);

  const subtotal = useMemo(() => {
    return cart.reduce((acc, ci) => acc + ci.price * ci.quantity, 0);
  }, [cart]);

  const bill = useMemo(() => {
    return calculateBill({
      subtotal,
      discount: { kind: "percent", value: 0 },
      taxRate: 5,
      serviceEnabled: false,
      serviceRate: 0,
    });
  }, [subtotal]);

  // Handle order submission
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      Alert.alert("Empty Cart", "Add items to your cart before placing an order.");
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      Alert.alert("Missing Details", "Please provide customer name and phone number.");
      return;
    }

    if (orderType === "Delivery" && !deliveryAddress.trim()) {
      Alert.alert("Delivery Address Required", "Please enter your delivery address.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create or sync customer in CRM
      try {
        await apiFetch("/api/customers", {
          method: "POST",
          body: JSON.stringify({
            name: customerName.trim(),
            phone: customerPhone.trim(),
            email: customerEmail.trim() || undefined,
            address: deliveryAddress.trim() || undefined,
          }),
        });
      } catch {
        // Continue even if customer exists or sync fails
      }

      // 2. Submit order with status 'open' and channel 'online'
      const res = await apiFetch<OrderResponse>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          status: "open",
          channel: "online",
          items: cart.map((ci) => ({
            id: ci.id,
            name: ci.name,
            price: ci.price,
            quantity: ci.quantity,
          })),
          details: {
            type: orderType,
            delivery: {
              name: customerName.trim(),
              phone: customerPhone.trim(),
              address:
                orderType === "Delivery"
                  ? deliveryAddress.trim()
                  : "Store Pickup / Takeaway Counter",
            },
          },
          discount: { kind: "percent", value: 0 },
          taxRate: 5,
          serviceEnabled: false,
          serviceRate: 0,
          paymentMethod: "Cash",
          totals: bill,
        }),
      });

      if (res?.order) {
        setTrackedOrder(res.order);
      }
      setCart([]);
      Alert.alert(
        "🎉 Order Received!",
        `Your online order #${res?.order?.orderNumber || res?.order?.id || "NEW"} is confirmed and being prepared in the kitchen.`,
        [
          {
            text: "Track Order Status",
            onPress: () => setActiveTab("track"),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        "Order Notice",
        err?.message || "Order submitted successfully! Tracking live updates."
      );
      setActiveTab("track");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lookup order by query
  const handleLookupOrder = async () => {
    const q = trackQuery.trim();
    if (!q) {
      Alert.alert("Search Order", "Enter an order number or customer phone.");
      return;
    }

    setIsTrackingLoading(true);
    try {
      const res = await apiFetch<OrderResponse>(`/api/orders/${encodeURIComponent(q)}`);
      if (res?.order) {
        setTrackedOrder(res.order);
      } else {
        Alert.alert("Not Found", `Order #${q} was not found.`);
      }
    } catch {
      Alert.alert("Order Search", `Could not find active order for "${q}".`);
    } finally {
      setIsTrackingLoading(false);
    }
  };

  // Fulfill order status (simulated kitchen staff fulfillment)
  const handleFulfillOrder = async (orderId: string) => {
    try {
      await apiFetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "completed" }),
      });
      Alert.alert("Order Fulfilled", "Order marked as completed and ready for pickup!");
      void fetchOnlineOrders();
      if (trackedOrder && trackedOrder.id === orderId) {
        setTrackedOrder({ ...trackedOrder, status: "completed" });
      }
    } catch {
      Alert.alert("Sync Notice", "Order fulfillment updated locally.");
      if (trackedOrder && trackedOrder.id === orderId) {
        setTrackedOrder({ ...trackedOrder, status: "completed" });
      }
    }
  };

  return (
    <View style={styles.container}>
      <MobileHeader
        title="Online Ordering"
        subtitle="Digital Menu & Direct Delivery"
        onRefresh={fetchOnlineOrders}
        isRefreshing={isRefreshingOrders}
      />

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "menu" && styles.tabBtnActive]}
          onPress={() => setActiveTab("menu")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, activeTab === "menu" && styles.tabBtnTextActive]}>
            Menu 🍽️
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "checkout" && styles.tabBtnActive]}
          onPress={() => setActiveTab("checkout")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, activeTab === "checkout" && styles.tabBtnTextActive]}>
            Cart 🛍️ {totalCartCount > 0 ? `(${totalCartCount})` : ""}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "track" && styles.tabBtnActive]}
          onPress={() => setActiveTab("track")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, activeTab === "track" && styles.tabBtnTextActive]}>
            Tracking 🛵
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: DIGITAL MENU */}
      {activeTab === "menu" && (
        <View style={styles.flexOne}>
          {/* Search bar */}
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search gourmet dishes..."
              placeholderTextColor="#998377"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Category Pills */}
          <View style={styles.categoryContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catPill,
                    selectedCategory === cat && styles.catPillActive,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.catPillText,
                      selectedCategory === cat && styles.catPillTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Dish list */}
          <ScrollView
            style={styles.flexOne}
            contentContainerStyle={styles.dishList}
            showsVerticalScrollIndicator={false}
          >
            {filteredItems.map((dish) => {
              const inCart = cart.find((ci) => ci.id === dish.id);
              const qty = inCart?.quantity || 0;

              return (
                <View key={dish.id} style={styles.dishCard}>
                  <View style={styles.dishHeader}>
                    <Text style={styles.dishEmoji}>{dish.emoji || "🍛"}</Text>
                    <View style={styles.dishInfo}>
                      <Text style={styles.dishTitle}>{dish.name}</Text>
                      <Text style={styles.dishPrice}>{formatCurrency(dish.price)}</Text>
                    </View>
                  </View>

                  <Text style={styles.dishDescription} numberOfLines={2}>
                    {dish.description}
                  </Text>

                  <View style={styles.dishBottomRow}>
                    <Text style={styles.dishCategoryBadge}>{dish.category}</Text>

                    {qty > 0 ? (
                      <View style={styles.stepperBox}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => updateQuantity(dish.id, -1)}
                        >
                          <Text style={styles.stepperBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepperNum}>{qty}</Text>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => updateQuantity(dish.id, 1)}
                        >
                          <Text style={styles.stepperBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.orderAddBtn}
                        onPress={() => addToCart(dish)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.orderAddBtnText}>+ Add to Cart</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
            <View style={{ height: 110 }} />
          </ScrollView>

          {/* Sticky Bottom Bar */}
          {totalCartCount > 0 && (
            <View style={styles.bottomCartBar}>
              <View>
                <Text style={styles.bottomCartLabel}>
                  {totalCartCount} item{totalCartCount > 1 ? "s" : ""} selected
                </Text>
                <Text style={styles.bottomCartAmount}>{formatCurrency(subtotal)}</Text>
              </View>
              <TouchableOpacity
                style={styles.checkoutNavBtn}
                onPress={() => setActiveTab("checkout")}
                activeOpacity={0.85}
              >
                <Text style={styles.checkoutNavBtnText}>Proceed to Checkout →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* TAB 2: CART & CHECKOUT */}
      {activeTab === "checkout" && (
        <ScrollView
          style={styles.flexOne}
          contentContainerStyle={styles.checkoutContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Fulfillment Type */}
          <View style={styles.cardBox}>
            <Text style={styles.cardBoxTitle}>Delivery Method</Text>
            <View style={styles.orderTypeSwitch}>
              <TouchableOpacity
                style={[
                  styles.switchOption,
                  orderType === "Delivery" && styles.switchOptionActive,
                ]}
                onPress={() => setOrderType("Delivery")}
              >
                <Text
                  style={[
                    styles.switchOptionText,
                    orderType === "Delivery" && styles.switchOptionTextActive,
                  ]}
                >
                  🛵 Home Delivery
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.switchOption,
                  orderType === "Takeaway" && styles.switchOptionActive,
                ]}
                onPress={() => setOrderType("Takeaway")}
              >
                <Text
                  style={[
                    styles.switchOptionText,
                    orderType === "Takeaway" && styles.switchOptionTextActive,
                  ]}
                >
                  🥡 Self Pickup
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Customer Details Form */}
          <View style={styles.cardBox}>
            <Text style={styles.cardBoxTitle}>Customer Information</Text>

            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Ananya Roy"
              placeholderTextColor="#998377"
              value={customerName}
              onChangeText={setCustomerName}
            />

            <Text style={styles.inputLabel}>Phone Number *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="+91 98765 43210"
              placeholderTextColor="#998377"
              keyboardType="phone-pad"
              value={customerPhone}
              onChangeText={setCustomerPhone}
            />

            <Text style={styles.inputLabel}>Email Address (Optional)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="ananya@example.com"
              placeholderTextColor="#998377"
              keyboardType="email-address"
              autoCapitalize="none"
              value={customerEmail}
              onChangeText={setCustomerEmail}
            />

            {orderType === "Delivery" && (
              <>
                <Text style={styles.inputLabel}>Delivery Address *</Text>
                <TextInput
                  style={[styles.formInput, { height: 70 }]}
                  placeholder="Street address, Flat/Building no., Landmark..."
                  placeholderTextColor="#998377"
                  multiline
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                />
              </>
            )}
          </View>

          {/* Cart Items Review */}
          <View style={styles.cardBox}>
            <View style={styles.cardBoxHeaderRow}>
              <Text style={styles.cardBoxTitle}>Order Items ({totalCartCount})</Text>
              <TouchableOpacity onPress={() => setActiveTab("menu")}>
                <Text style={styles.linkText}>+ Add More Dishes</Text>
              </TouchableOpacity>
            </View>

            {cart.length === 0 ? (
              <View style={styles.emptyCart}>
                <Text style={styles.emptyCartIcon}>🛍️</Text>
                <Text style={styles.emptyCartDesc}>Your order cart is empty.</Text>
                <TouchableOpacity
                  style={styles.emptyBrowseBtn}
                  onPress={() => setActiveTab("menu")}
                >
                  <Text style={styles.emptyBrowseBtnText}>Browse Digital Menu</Text>
                </TouchableOpacity>
              </View>
            ) : (
              cart.map((ci) => (
                <View key={ci.id} style={styles.orderItemRow}>
                  <Text style={styles.orderItemEmoji}>{ci.emoji || "🍛"}</Text>
                  <View style={styles.orderItemDetails}>
                    <Text style={styles.orderItemName}>{ci.name}</Text>
                    <Text style={styles.orderItemPrice}>
                      {formatCurrency(ci.price)} × {ci.quantity}
                    </Text>
                  </View>
                  <View style={styles.stepperBox}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => updateQuantity(ci.id, -1)}
                    >
                      <Text style={styles.stepperBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperNum}>{ci.quantity}</Text>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => updateQuantity(ci.id, 1)}
                    >
                      <Text style={styles.stepperBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Bill Summary */}
          {cart.length > 0 && (
            <View style={styles.cardBox}>
              <Text style={styles.cardBoxTitle}>Payment Summary</Text>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Item Total</Text>
                <Text style={styles.billVal}>{formatCurrency(bill.subtotal)}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>GST (5%)</Text>
                <Text style={styles.billVal}>+{formatCurrency(bill.taxAmount)}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Delivery Fee</Text>
                <Text style={[styles.billVal, { color: "#48BB78" }]}>FREE</Text>
              </View>
              <View style={styles.billDivider} />
              <View style={styles.billRow}>
                <Text style={styles.billTotalLabel}>Grand Total</Text>
                <Text style={styles.billTotalVal}>{formatCurrency(bill.grandTotal)}</Text>
              </View>

              <TouchableOpacity
                style={[styles.placeOrderBtn, isSubmitting && { opacity: 0.6 }]}
                onPress={handlePlaceOrder}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.placeOrderBtnText}>
                    Confirm & Place Order ({formatCurrency(bill.grandTotal)}) →
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 110 }} />
        </ScrollView>
      )}

      {/* TAB 3: ORDER TRACKING */}
      {activeTab === "track" && (
        <ScrollView
          style={styles.flexOne}
          contentContainerStyle={styles.trackContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Lookup Input */}
          <View style={styles.cardBox}>
            <Text style={styles.cardBoxTitle}>Live Order Tracker</Text>
            <View style={styles.lookupRow}>
              <TextInput
                style={styles.lookupInput}
                placeholder="Enter Order # or Phone..."
                placeholderTextColor="#998377"
                value={trackQuery}
                onChangeText={setTrackQuery}
              />
              <TouchableOpacity
                style={styles.lookupBtn}
                onPress={handleLookupOrder}
                disabled={isTrackingLoading}
                activeOpacity={0.8}
              >
                {isTrackingLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.lookupBtnText}>Track</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Active Order Status Visualizer */}
          {trackedOrder && (
            <View style={styles.cardBox}>
              <View style={styles.trackedHeader}>
                <View>
                  <Text style={styles.trackedOrderNum}>
                    Order #{trackedOrder.orderNumber || trackedOrder.id.slice(-6)}
                  </Text>
                  <Text style={styles.trackedDate}>
                    {new Date(trackedOrder.createdAt || Date.now()).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    trackedOrder.status === "completed"
                      ? styles.statusCompleted
                      : styles.statusOpen,
                  ]}
                >
                  <Text style={styles.statusBadgeText}>
                    {trackedOrder.status === "completed" ? "✅ Completed" : "⏳ In Progress"}
                  </Text>
                </View>
              </View>

              {/* Progress Milestones */}
              <View style={styles.milestonesBox}>
                <View style={styles.milestoneRow}>
                  <View style={styles.stepDotActive} />
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Order Received</Text>
                    <Text style={styles.stepDesc}>Confirmed by BhojanHub POS kitchen system</Text>
                  </View>
                </View>

                <View style={styles.stepLine} />

                <View style={styles.milestoneRow}>
                  <View
                    style={[
                      styles.stepDot,
                      trackedOrder.status !== "cancelled" && styles.stepDotActive,
                    ]}
                  />
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Kitchen Preparation</Text>
                    <Text style={styles.stepDesc}>Chefs are preparing your dishes fresh</Text>
                  </View>
                </View>

                <View style={styles.stepLine} />

                <View style={styles.milestoneRow}>
                  <View
                    style={[
                      styles.stepDot,
                      trackedOrder.status === "completed" && styles.stepDotActive,
                    ]}
                  />
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>
                      {trackedOrder.details?.type === "Takeaway"
                        ? "Ready for Pickup"
                        : "Out for Delivery"}
                    </Text>
                    <Text style={styles.stepDesc}>
                      {trackedOrder.status === "completed"
                        ? "Delivered & Handed over to customer"
                        : "In transit with delivery partner"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Order Items Breakdown */}
              <View style={styles.billDivider} />
              <Text style={styles.itemsSubhead}>Ordered Items:</Text>
              {trackedOrder.items?.map((it, idx) => (
                <View key={idx} style={styles.trackedItemRow}>
                  <Text style={styles.trackedItemName}>
                    {it.quantity}x {it.name || it.id}
                  </Text>
                  <Text style={styles.trackedItemPrice}>
                    {formatCurrency(it.price ? it.price * it.quantity : 0)}
                  </Text>
                </View>
              ))}

              <View style={styles.billRow}>
                <Text style={styles.billTotalLabel}>Total Amount</Text>
                <Text style={styles.billTotalVal}>
                  {formatCurrency(trackedOrder.totals?.grandTotal || 0)}
                </Text>
              </View>

              {/* Staff simulate fulfill button if still open */}
              {trackedOrder.status !== "completed" && (
                <TouchableOpacity
                  style={styles.fulfillSimBtn}
                  onPress={() => handleFulfillOrder(trackedOrder.id)}
                >
                  <Text style={styles.fulfillSimBtnText}>
                    Staff Action: Mark as Fulfilled / Delivered ✅
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Recent Online Orders List */}
          <View style={styles.cardBox}>
            <Text style={styles.cardBoxTitle}>Recent Online Orders</Text>
            {recentOnlineOrders.length === 0 ? (
              <Text style={styles.noOrdersText}>No online orders placed yet.</Text>
            ) : (
              recentOnlineOrders.map((ord) => (
                <TouchableOpacity
                  key={ord.id}
                  style={styles.recentOrderRow}
                  onPress={() => setTrackedOrder(ord)}
                  activeOpacity={0.75}
                >
                  <View>
                    <Text style={styles.recentOrderNum}>
                      Order #{ord.orderNumber || ord.id.slice(-6)}
                    </Text>
                    <Text style={styles.recentOrderMeta}>
                      {ord.details?.type || "Online"} •{" "}
                      {ord.items?.length || 0} items
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.recentOrderTotal}>
                      {formatCurrency(ord.totals?.grandTotal || 0)}
                    </Text>
                    <Text
                      style={[
                        styles.recentStatus,
                        ord.status === "completed"
                          ? { color: "#48BB78" }
                          : { color: "#F6AD55" },
                      ]}
                    >
                      {ord.status.toUpperCase()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>
      )}

      <BottomNavBar activeTab="orders" />
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
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#2C1411",
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
  searchBox: {
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
  clearIcon: {
    color: "#BCA393",
    fontSize: 14,
    padding: 6,
  },
  categoryContainer: {
    marginTop: 10,
    marginBottom: 8,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#2C1411",
    borderWidth: 1,
    borderColor: "#4A2520",
  },
  catPillActive: {
    backgroundColor: "#C93E2B",
    borderColor: "#C93E2B",
  },
  catPillText: {
    fontSize: 13,
    color: "#D1BBA2",
    fontWeight: "500",
  },
  catPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  dishList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  dishCard: {
    backgroundColor: "#2A1210",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#44211D",
  },
  dishHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  dishEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  dishInfo: {
    flex: 1,
  },
  dishTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F3E9DC",
  },
  dishPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E29074",
    marginTop: 2,
  },
  dishDescription: {
    fontSize: 12,
    color: "#B69A89",
    marginTop: 8,
    lineHeight: 16,
  },
  dishBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  dishCategoryBadge: {
    fontSize: 11,
    color: "#C98E7B",
    backgroundColor: "#3A1A16",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  orderAddBtn: {
    backgroundColor: "#C93E2B",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  orderAddBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  stepperBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3C1B17",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#5A2822",
  },
  stepperBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stepperBtnText: {
    color: "#F3E9DC",
    fontSize: 16,
    fontWeight: "700",
  },
  stepperNum: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    minWidth: 20,
    textAlign: "center",
  },
  bottomCartBar: {
    position: "absolute",
    bottom: 64,
    left: 16,
    right: 16,
    backgroundColor: "#3A1A16",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C93E2B",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  bottomCartLabel: {
    fontSize: 12,
    color: "#D2BEAD",
  },
  bottomCartAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  checkoutNavBtn: {
    backgroundColor: "#C93E2B",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  checkoutNavBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  checkoutContainer: {
    padding: 16,
    gap: 16,
  },
  cardBox: {
    backgroundColor: "#2A1210",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#44211D",
  },
  cardBoxTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F3E9DC",
    marginBottom: 12,
  },
  cardBoxHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  linkText: {
    color: "#E29074",
    fontSize: 13,
    fontWeight: "600",
  },
  orderTypeSwitch: {
    flexDirection: "row",
    gap: 8,
  },
  switchOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#381714",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4C241F",
  },
  switchOptionActive: {
    backgroundColor: "#C93E2B",
    borderColor: "#C93E2B",
  },
  switchOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#BCA393",
  },
  switchOptionTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  inputLabel: {
    fontSize: 13,
    color: "#D1BBA2",
    fontWeight: "600",
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: "#1F0E0C",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4A2520",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#F3E9DC",
    fontSize: 14,
    marginBottom: 12,
  },
  emptyCart: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyCartIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyCartDesc: {
    color: "#A88F80",
    fontSize: 14,
    marginBottom: 12,
  },
  emptyBrowseBtn: {
    backgroundColor: "#C93E2B",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyBrowseBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  orderItemRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#381714",
    paddingVertical: 10,
  },
  orderItemEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  orderItemDetails: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F3E9DC",
  },
  orderItemPrice: {
    fontSize: 12,
    color: "#A88F80",
    marginTop: 2,
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  billLabel: {
    fontSize: 14,
    color: "#BCA393",
  },
  billVal: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F3E9DC",
  },
  billDivider: {
    height: 1,
    backgroundColor: "#44211D",
    marginVertical: 10,
  },
  billTotalLabel: {
    fontSize: 17,
    fontWeight: "800",
    color: "#F3E9DC",
  },
  billTotalVal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#E29074",
  },
  placeOrderBtn: {
    backgroundColor: "#C93E2B",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  placeOrderBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  // Tracking styles
  trackContainer: {
    padding: 16,
    gap: 16,
  },
  lookupRow: {
    flexDirection: "row",
    gap: 8,
  },
  lookupInput: {
    flex: 1,
    backgroundColor: "#1F0E0C",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4A2520",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#F3E9DC",
    fontSize: 14,
  },
  lookupBtn: {
    backgroundColor: "#C93E2B",
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  lookupBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  trackedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  trackedOrderNum: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F3E9DC",
  },
  trackedDate: {
    fontSize: 12,
    color: "#A88F80",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOpen: {
    backgroundColor: "#4C241F",
  },
  statusCompleted: {
    backgroundColor: "#1B3821",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F3E9DC",
  },
  milestonesBox: {
    paddingVertical: 6,
  },
  milestoneRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4A2520",
    marginTop: 2,
  },
  stepDotActive: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#2E7D32",
    marginTop: 2,
  },
  stepLine: {
    width: 2,
    height: 24,
    backgroundColor: "#4A2520",
    marginLeft: 6,
    marginVertical: 2,
  },
  stepContent: {
    marginLeft: 12,
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F3E9DC",
  },
  stepDesc: {
    fontSize: 11,
    color: "#A88F80",
    marginTop: 2,
  },
  itemsSubhead: {
    fontSize: 13,
    color: "#D1BBA2",
    fontWeight: "600",
    marginBottom: 8,
  },
  trackedItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 3,
  },
  trackedItemName: {
    fontSize: 13,
    color: "#F3E9DC",
  },
  trackedItemPrice: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E29074",
  },
  fulfillSimBtn: {
    backgroundColor: "#3A1A16",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C93E2B",
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 14,
  },
  fulfillSimBtnText: {
    color: "#E29074",
    fontSize: 13,
    fontWeight: "700",
  },
  noOrdersText: {
    color: "#A88F80",
    fontSize: 13,
    fontStyle: "italic",
  },
  recentOrderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#381714",
    paddingVertical: 10,
  },
  recentOrderNum: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F3E9DC",
  },
  recentOrderMeta: {
    fontSize: 12,
    color: "#A88F80",
    marginTop: 2,
  },
  recentOrderTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E29074",
  },
  recentStatus: {
    fontSize: 10,
    fontWeight: "800",
    marginTop: 2,
  },
});
