import React, { useState, useEffect, useMemo } from "react";
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
import { menuItems as defaultMenuItems, categories } from "../data/menuData";
import { calculateBill, formatCurrency } from "../utils/billing";
import type {
  MenuItem,
  CartItem,
  OrderType,
  PaymentMethod,
  Discount,
  Table,
} from "../types/pos";

export default function PosScreen() {
  const [activeTab, setActiveTab] = useState<"menu" | "cart">("menu");
  const [menuItems, setMenuItems] = useState<MenuItem[]>(defaultMenuItems);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("Dine In");
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tables, setTables] = useState<Table[]>([]);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");

  // Billing parameters
  const [discount, setDiscount] = useState<Discount>({ kind: "percent", value: 0 });
  const [taxRate, setTaxRate] = useState<number>(5);
  const [serviceEnabled, setServiceEnabled] = useState<boolean>(true);
  const [serviceRate, setServiceRate] = useState<number>(5);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [cashReceived, setCashReceived] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Completed Receipt Modal
  const [showReceipt, setShowReceipt] = useState<boolean>(false);
  const [lastOrderDetails, setLastOrderDetails] = useState<{
    orderNumber: number;
    date: Date;
    items: CartItem[];
    bill: ReturnType<typeof calculateBill>;
    orderType: OrderType;
    paymentMethod: PaymentMethod;
    cashReceived: number;
    table?: string;
  } | null>(null);

  // Load menu & tables from backend
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const menuRes = await apiFetch<{ items?: MenuItem[] }>("/api/menu");
        if (isMounted && menuRes?.items && menuRes.items.length > 0) {
          // Merge emojis from defaultMenuItems if api items don't have them
          const enhanced = menuRes.items.map((item) => {
            const fallback = defaultMenuItems.find((d) => d.id === item.id);
            return {
              ...item,
              emoji: item.emoji || fallback?.emoji || "🍲",
            };
          });
          setMenuItems(enhanced);
        }
      } catch {
        // use default menu items
      }

      try {
        const tablesRes = await apiFetch<{ tables?: Table[] }>("/api/tables");
        if (isMounted && tablesRes?.tables) {
          setTables(tablesRes.tables);
        }
      } catch {
        // Fallback tables
        setTables([
          { id: "t-1", table_number: "Table 01", capacity: 2, status: "available", current_order_id: null },
          { id: "t-2", table_number: "Table 02", capacity: 4, status: "available", current_order_id: null },
          { id: "t-3", table_number: "Table 03", capacity: 4, status: "occupied", current_order_id: "ord-101" },
          { id: "t-4", table_number: "Table 04", capacity: 6, status: "available", current_order_id: null },
          { id: "t-5", table_number: "Table 05", capacity: 2, status: "reserved", current_order_id: null },
          { id: "t-6", table_number: "Table 06", capacity: 8, status: "available", current_order_id: null },
        ]);
      }
    };

    void loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat =
        selectedCategory === "All" || item.category === selectedCategory;
      const matchQuery =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
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
      discount,
      taxRate,
      serviceEnabled,
      serviceRate,
    });
  }, [subtotal, discount, taxRate, serviceEnabled, serviceRate]);

  const changeDue = useMemo(() => {
    if (paymentMethod !== "Cash") return 0;
    const rec = parseFloat(cashReceived) || 0;
    return Math.max(0, rec - bill.grandTotal);
  }, [paymentMethod, cashReceived, bill.grandTotal]);

  const resetOrder = () => {
    setCart([]);
    setSelectedTable("");
    setCustomerName("");
    setCustomerPhone("");
    setDeliveryAddress("");
    setCashReceived("");
    setDiscount({ kind: "percent", value: 0 });
    setActiveTab("menu");
  };

  // Submit Order
  const handleCheckout = async () => {
    if (cart.length === 0) {
      Alert.alert("Empty Cart", "Please add at least one item before checkout.");
      return;
    }

    if (orderType === "Dine In" && !selectedTable) {
      Alert.alert("Select Table", "Please choose a table for Dine In orders.");
      return;
    }

    if (orderType === "Delivery" && (!customerName || !customerPhone || !deliveryAddress)) {
      Alert.alert("Missing Details", "Please fill in delivery customer name, phone, and address.");
      return;
    }

    if (paymentMethod === "Cash") {
      const rec = parseFloat(cashReceived) || 0;
      if (rec < bill.grandTotal) {
        Alert.alert("Insufficient Cash", `Cash received (${formatCurrency(rec)}) must cover the total (${formatCurrency(bill.grandTotal)}).`);
        return;
      }
    }

    setIsSubmitting(true);
    const orderNumber = Math.floor(1000 + Math.random() * 9000);

    try {
      await apiFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          status: "completed",
          channel: "pos",
          orderNumber,
          items: cart.map((ci) => ({
            id: ci.id,
            name: ci.name,
            price: ci.price,
            quantity: ci.quantity,
          })),
          details: {
            type: orderType,
            table: selectedTable || undefined,
            delivery:
              orderType === "Delivery"
                ? { name: customerName, phone: customerPhone, address: deliveryAddress }
                : undefined,
            customer: customerName ? { name: customerName, phone: customerPhone } : undefined,
          },
          discount,
          taxRate,
          serviceEnabled,
          serviceRate,
          paymentMethod,
          cashReceived: paymentMethod === "Cash" ? parseFloat(cashReceived) || 0 : undefined,
          totals: bill,
        }),
      });
    } catch {
      // Proceed even if offline mode
    } finally {
      setIsSubmitting(false);
    }

    setLastOrderDetails({
      orderNumber,
      date: new Date(),
      items: [...cart],
      bill,
      orderType,
      paymentMethod,
      cashReceived: parseFloat(cashReceived) || bill.grandTotal,
      table: selectedTable,
    });
    setShowReceipt(true);
  };

  return (
    <View style={styles.container}>
      <MobileHeader
        title="Billing & POS"
        subtitle="Point of Sale Counter"
        rightAction={
          <TouchableOpacity
            onPress={() => {
              if (cart.length > 0) {
                Alert.alert("Reset Order", "Clear current cart and selections?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Clear", style: "destructive", onPress: resetOrder },
                ]);
              } else {
                resetOrder();
              }
            }}
            style={{ paddingHorizontal: 10, paddingVertical: 4 }}
          >
            <Text style={{ color: "#E29074", fontWeight: "700", fontSize: 13 }}>Reset</Text>
          </TouchableOpacity>
        }
      />

      {/* Top Tabs: Menu vs Cart */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "menu" && styles.tabButtonActive]}
          onPress={() => setActiveTab("menu")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabButtonText, activeTab === "menu" && styles.tabButtonTextActive]}>
            Menu Items 🍲
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "cart" && styles.tabButtonActive]}
          onPress={() => setActiveTab("cart")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabButtonText, activeTab === "cart" && styles.tabButtonTextActive]}>
            Cart & Checkout 🛒 {totalCartCount > 0 ? `(${totalCartCount})` : ""}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "menu" ? (
        /* MENU VIEW */
        <View style={styles.contentFlex}>
          {/* Search bar */}
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search dishes or ingredients..."
              placeholderTextColor="#998377"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearSearchBtn}
              >
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Category Horizontal Pills */}
          <View style={styles.categoryScrollWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryContent}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryPill,
                    selectedCategory === cat && styles.categoryPillActive,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      selectedCategory === cat && styles.categoryPillTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Dishes List */}
          <ScrollView
            style={styles.menuScroll}
            contentContainerStyle={styles.menuGrid}
            showsVerticalScrollIndicator={false}
          >
            {filteredItems.map((item) => {
              const inCartItem = cart.find((ci) => ci.id === item.id);
              const qty = inCartItem?.quantity || 0;

              return (
                <View key={item.id} style={styles.dishCard}>
                  <View style={styles.dishTopRow}>
                    <Text style={styles.dishEmoji}>{item.emoji || "🍛"}</Text>
                    <View style={styles.dishMeta}>
                      <Text style={styles.dishName}>{item.name}</Text>
                      <Text style={styles.dishPrice}>{formatCurrency(item.price)}</Text>
                    </View>
                  </View>

                  <Text style={styles.dishDesc} numberOfLines={2}>
                    {item.description}
                  </Text>

                  <View style={styles.dishActionRow}>
                    <Text style={styles.dishCatBadge}>{item.category}</Text>
                    {qty > 0 ? (
                      <View style={styles.stepperContainer}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => updateQuantity(item.id, -1)}
                        >
                          <Text style={styles.stepperBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepperCount}>{qty}</Text>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => updateQuantity(item.id, 1)}
                        >
                          <Text style={styles.stepperBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => addToCart(item)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.addBtnText}>+ Add</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}

            {filteredItems.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyText}>No dishes match your query.</Text>
              </View>
            )}
            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Sticky Quick Cart Bar if items in cart */}
          {totalCartCount > 0 && (
            <View style={styles.stickyCartBar}>
              <View>
                <Text style={styles.stickyCartCount}>
                  {totalCartCount} item{totalCartCount > 1 ? "s" : ""} in cart
                </Text>
                <Text style={styles.stickyCartTotal}>{formatCurrency(subtotal)}</Text>
              </View>
              <TouchableOpacity
                style={styles.stickyCartBtn}
                onPress={() => setActiveTab("cart")}
                activeOpacity={0.85}
              >
                <Text style={styles.stickyCartBtnText}>View Cart & Checkout →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        /* CART & CHECKOUT VIEW */
        <ScrollView
          style={styles.cartScroll}
          contentContainerStyle={styles.cartContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Order Type Selector */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Order Type</Text>
            <View style={styles.orderTypeRow}>
              {(["Dine In", "Takeaway", "Delivery"] as OrderType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.orderTypeBtn,
                    orderType === type && styles.orderTypeBtnActive,
                  ]}
                  onPress={() => setOrderType(type)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.orderTypeBtnText,
                      orderType === type && styles.orderTypeBtnTextActive,
                    ]}
                  >
                    {type === "Dine In" ? "🍽️ Dine In" : type === "Takeaway" ? "🥡 Takeaway" : "🛵 Delivery"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* If Dine In: Table selection */}
            {orderType === "Dine In" && (
              <View style={styles.tableSection}>
                <Text style={styles.fieldLabel}>Select Dining Table:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tableScroll}
                >
                  {tables.map((tbl) => {
                    const isSelected = selectedTable === tbl.table_number;
                    const isOccupied = tbl.status === "occupied";
                    const isReserved = tbl.status === "reserved";

                    return (
                      <TouchableOpacity
                        key={tbl.id}
                        style={[
                          styles.tableChip,
                          isSelected && styles.tableChipSelected,
                          isOccupied && styles.tableChipOccupied,
                          isReserved && styles.tableChipReserved,
                        ]}
                        onPress={() => {
                          if (isOccupied) {
                            Alert.alert(
                              "Table Occupied",
                              `${tbl.table_number} currently has an active order. Proceed anyway?`,
                              [
                                { text: "Cancel", style: "cancel" },
                                { text: "Use Table", onPress: () => setSelectedTable(tbl.table_number) },
                              ]
                            );
                          } else {
                            setSelectedTable(tbl.table_number);
                          }
                        }}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.tableNameText,
                            isSelected && styles.tableNameTextSelected,
                          ]}
                        >
                          {tbl.table_number}
                        </Text>
                        <Text style={styles.tableCapText}>{tbl.capacity} Seats</Text>
                        <Text style={styles.tableStatusText}>
                          {isOccupied ? "Occupied" : isReserved ? "Reserved" : "Free"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* If Delivery: Address inputs */}
            {orderType === "Delivery" && (
              <View style={styles.detailsForm}>
                <Text style={styles.fieldLabel}>Customer Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor="#998377"
                  value={customerName}
                  onChangeText={setCustomerName}
                />

                <Text style={styles.fieldLabel}>Contact Phone *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="+91 98765 43210"
                  placeholderTextColor="#998377"
                  keyboardType="phone-pad"
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                />

                <Text style={styles.fieldLabel}>Delivery Address *</Text>
                <TextInput
                  style={[styles.formInput, { height: 64 }]}
                  placeholder="Apartment, Street, Area..."
                  placeholderTextColor="#998377"
                  multiline
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                />
              </View>
            )}

            {orderType === "Takeaway" && (
              <View style={styles.detailsForm}>
                <Text style={styles.fieldLabel}>Customer Name (Optional)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Priya"
                  placeholderTextColor="#998377"
                  value={customerName}
                  onChangeText={setCustomerName}
                />
                <Text style={styles.fieldLabel}>Phone Number (Optional)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="+91 98765 43210"
                  placeholderTextColor="#998377"
                  keyboardType="phone-pad"
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                />
              </View>
            )}
          </View>

          {/* Cart Items List */}
          <View style={styles.sectionBox}>
            <View style={styles.cartHeaderRow}>
              <Text style={styles.sectionTitle}>Cart Items ({totalCartCount})</Text>
              <TouchableOpacity onPress={() => setActiveTab("menu")}>
                <Text style={styles.addMoreLink}>+ Add More Dishes</Text>
              </TouchableOpacity>
            </View>

            {cart.length === 0 ? (
              <View style={styles.emptyCartBox}>
                <Text style={styles.emptyCartEmoji}>🛒</Text>
                <Text style={styles.emptyCartText}>No items added to order yet.</Text>
                <TouchableOpacity
                  style={styles.browseBtn}
                  onPress={() => setActiveTab("menu")}
                >
                  <Text style={styles.browseBtnText}>Browse Full Menu</Text>
                </TouchableOpacity>
              </View>
            ) : (
              cart.map((ci) => (
                <View key={ci.id} style={styles.cartItemRow}>
                  <Text style={styles.cartItemEmoji}>{ci.emoji || "🍛"}</Text>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{ci.name}</Text>
                    <Text style={styles.cartItemSub}>
                      {formatCurrency(ci.price)} × {ci.quantity} ={" "}
                      <Text style={styles.cartItemTotalBold}>
                        {formatCurrency(ci.price * ci.quantity)}
                      </Text>
                    </Text>
                  </View>

                  <View style={styles.stepperContainer}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => updateQuantity(ci.id, -1)}
                    >
                      <Text style={styles.stepperBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperCount}>{ci.quantity}</Text>
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

          {/* Billing Controls: Discounts & Tax */}
          {cart.length > 0 && (
            <>
              <View style={styles.sectionBox}>
                <Text style={styles.sectionTitle}>Discounts & Charges</Text>

                {/* Discount options */}
                <Text style={styles.fieldLabel}>Discount Offer:</Text>
                <View style={styles.pillOptionsRow}>
                  {[0, 5, 10, 15, 20].map((val) => (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.discountPill,
                        discount.value === val && styles.discountPillActive,
                      ]}
                      onPress={() => setDiscount({ kind: "percent", value: val })}
                    >
                      <Text
                        style={[
                          styles.discountPillText,
                          discount.value === val && styles.discountPillTextActive,
                        ]}
                      >
                        {val === 0 ? "None" : `${val}%`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Tax Rate options */}
                <Text style={[styles.fieldLabel, { marginTop: 14 }]}>GST Tax Rate:</Text>
                <View style={styles.pillOptionsRow}>
                  {[0, 5, 12, 18].map((rate) => (
                    <TouchableOpacity
                      key={rate}
                      style={[
                        styles.discountPill,
                        taxRate === rate && styles.discountPillActive,
                      ]}
                      onPress={() => setTaxRate(rate)}
                    >
                      <Text
                        style={[
                          styles.discountPillText,
                          taxRate === rate && styles.discountPillTextActive,
                        ]}
                      >
                        {rate}% GST
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Service Charge toggle */}
                <View style={styles.toggleRow}>
                  <View>
                    <Text style={styles.toggleLabel}>Service Charge ({serviceRate}%)</Text>
                    <Text style={styles.toggleSub}>Staff & venue hospitality fee</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.switchBtn,
                      serviceEnabled && styles.switchBtnActive,
                    ]}
                    onPress={() => setServiceEnabled(!serviceEnabled)}
                  >
                    <Text style={styles.switchBtnText}>
                      {serviceEnabled ? "ON" : "OFF"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bill Summary */}
              <View style={styles.sectionBox}>
                <Text style={styles.sectionTitle}>Summary Breakdown</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(bill.subtotal)}</Text>
                </View>
                {bill.discountAmount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: "#48BB78" }]}>
                      Discount ({discount.value}%)
                    </Text>
                    <Text style={[styles.summaryValue, { color: "#48BB78" }]}>
                      −{formatCurrency(bill.discountAmount)}
                    </Text>
                  </View>
                )}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>GST ({taxRate}%)</Text>
                  <Text style={styles.summaryValue}>+{formatCurrency(bill.taxAmount)}</Text>
                </View>
                {bill.serviceCharge > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Service Charge ({serviceRate}%)</Text>
                    <Text style={styles.summaryValue}>+{formatCurrency(bill.serviceCharge)}</Text>
                  </View>
                )}
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.grandTotalLabel}>Grand Total</Text>
                  <Text style={styles.grandTotalValue}>
                    {formatCurrency(bill.grandTotal)}
                  </Text>
                </View>
              </View>

              {/* Payment Method */}
              <View style={styles.sectionBox}>
                <Text style={styles.sectionTitle}>Payment Method</Text>
                <View style={styles.orderTypeRow}>
                  {(["Cash", "UPI", "Card"] as PaymentMethod[]).map((pm) => (
                    <TouchableOpacity
                      key={pm}
                      style={[
                        styles.orderTypeBtn,
                        paymentMethod === pm && styles.orderTypeBtnActive,
                      ]}
                      onPress={() => setPaymentMethod(pm)}
                    >
                      <Text
                        style={[
                          styles.orderTypeBtnText,
                          paymentMethod === pm && styles.orderTypeBtnTextActive,
                        ]}
                      >
                        {pm === "Cash" ? "💵 Cash" : pm === "UPI" ? "📱 UPI" : "💳 Card"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {paymentMethod === "Cash" && (
                  <View style={styles.cashSection}>
                    <Text style={styles.fieldLabel}>Cash Received Amount:</Text>
                    <TextInput
                      style={styles.cashInput}
                      placeholder={`Min ${formatCurrency(bill.grandTotal)}`}
                      placeholderTextColor="#998377"
                      keyboardType="numeric"
                      value={cashReceived}
                      onChangeText={setCashReceived}
                    />

                    {/* Quick tender suggestions */}
                    <View style={styles.quickCashRow}>
                      {[
                        Math.ceil(bill.grandTotal),
                        Math.ceil(bill.grandTotal / 500) * 500,
                        Math.ceil(bill.grandTotal / 1000) * 1000,
                      ]
                        .filter((v, i, a) => a.indexOf(v) === i && v >= bill.grandTotal)
                        .map((suggested) => (
                          <TouchableOpacity
                            key={suggested}
                            style={styles.quickCashChip}
                            onPress={() => setCashReceived(suggested.toString())}
                          >
                            <Text style={styles.quickCashChipText}>
                              {formatCurrency(suggested)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                    </View>

                    {changeDue > 0 && (
                      <View style={styles.changeDueBox}>
                        <Text style={styles.changeDueLabel}>Change to Return:</Text>
                        <Text style={styles.changeDueValue}>
                          {formatCurrency(changeDue)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Pay Now Button */}
              <TouchableOpacity
                style={[styles.checkoutBtn, isSubmitting && { opacity: 0.6 }]}
                onPress={handleCheckout}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#F3E9DC" />
                ) : (
                  <Text style={styles.checkoutBtnText}>
                    Complete & Print Receipt ({formatCurrency(bill.grandTotal)}) →
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      {/* RECEIPT MODAL */}
      <Modal visible={showReceipt} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.receiptContainer}>
            <View style={styles.receiptPaper}>
              {/* Receipt Header */}
              <Text style={styles.receiptBrand}>BhojanHub</Text>
              <Text style={styles.receiptSub}>Gourmet Dining & Kitchen POS</Text>
              <View style={styles.receiptDivider} />

              <View style={styles.receiptMetaRow}>
                <Text style={styles.receiptMetaText}>
                  Order #{lastOrderDetails?.orderNumber}
                </Text>
                <Text style={styles.receiptMetaText}>
                  {lastOrderDetails?.date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              <View style={styles.receiptMetaRow}>
                <Text style={styles.receiptMetaText}>
                  Type: {lastOrderDetails?.orderType}
                </Text>
                {lastOrderDetails?.table ? (
                  <Text style={styles.receiptMetaText}>
                    {lastOrderDetails.table}
                  </Text>
                ) : null}
              </View>

              <View style={styles.receiptDivider} />

              {/* Items */}
              {lastOrderDetails?.items.map((ci) => (
                <View key={ci.id} style={styles.receiptItemRow}>
                  <Text style={styles.receiptItemQty}>{ci.quantity}x</Text>
                  <Text style={styles.receiptItemTitle}>{ci.name}</Text>
                  <Text style={styles.receiptItemPrice}>
                    {formatCurrency(ci.price * ci.quantity)}
                  </Text>
                </View>
              ))}

              <View style={styles.receiptDivider} />

              {/* Totals */}
              <View style={styles.receiptTotalRow}>
                <Text style={styles.receiptTotalLabel}>Subtotal</Text>
                <Text style={styles.receiptTotalValue}>
                  {formatCurrency(lastOrderDetails?.bill.subtotal || 0)}
                </Text>
              </View>
              {(lastOrderDetails?.bill.discountAmount || 0) > 0 && (
                <View style={styles.receiptTotalRow}>
                  <Text style={styles.receiptTotalLabel}>Discount</Text>
                  <Text style={styles.receiptTotalValue}>
                    −{formatCurrency(lastOrderDetails?.bill.discountAmount || 0)}
                  </Text>
                </View>
              )}
              <View style={styles.receiptTotalRow}>
                <Text style={styles.receiptTotalLabel}>Taxes (GST)</Text>
                <Text style={styles.receiptTotalValue}>
                  +{formatCurrency(lastOrderDetails?.bill.taxAmount || 0)}
                </Text>
              </View>
              {(lastOrderDetails?.bill.serviceCharge || 0) > 0 && (
                <View style={styles.receiptTotalRow}>
                  <Text style={styles.receiptTotalLabel}>Service Charge</Text>
                  <Text style={styles.receiptTotalValue}>
                    +{formatCurrency(lastOrderDetails?.bill.serviceCharge || 0)}
                  </Text>
                </View>
              )}

              <View style={styles.receiptDividerDashed} />

              <View style={styles.receiptTotalRow}>
                <Text style={styles.receiptGrandLabel}>TOTAL PAID</Text>
                <Text style={styles.receiptGrandValue}>
                  {formatCurrency(lastOrderDetails?.bill.grandTotal || 0)}
                </Text>
              </View>

              <View style={styles.receiptTotalRow}>
                <Text style={styles.receiptTotalLabel}>Payment Method</Text>
                <Text style={styles.receiptTotalValue}>
                  {lastOrderDetails?.paymentMethod}
                </Text>
              </View>

              {lastOrderDetails?.paymentMethod === "Cash" && (
                <View style={styles.receiptTotalRow}>
                  <Text style={styles.receiptTotalLabel}>Change Returned</Text>
                  <Text style={styles.receiptTotalValue}>
                    {formatCurrency(
                      Math.max(
                        0,
                        (lastOrderDetails?.cashReceived || 0) -
                          (lastOrderDetails?.bill.grandTotal || 0)
                      )
                    )}
                  </Text>
                </View>
              )}

              <Text style={styles.receiptFooterNote}>
                Thank you for dining with BhojanHub!
              </Text>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalNewBtn}
                onPress={() => {
                  setShowReceipt(false);
                  resetOrder();
                }}
              >
                <Text style={styles.modalNewBtnText}>Start New Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomNavBar activeTab="pos" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1F0E0C",
  },
  contentFlex: {
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
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: "#3A1A16",
    borderWidth: 1,
    borderColor: "#C93E2B",
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#BCA393",
  },
  tabButtonTextActive: {
    color: "#F3E9DC",
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
  clearSearchBtn: {
    padding: 6,
  },
  clearSearchText: {
    color: "#BCA393",
    fontSize: 14,
  },
  categoryScrollWrapper: {
    marginTop: 10,
    marginBottom: 8,
  },
  categoryContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#2C1411",
    borderWidth: 1,
    borderColor: "#4A2520",
  },
  categoryPillActive: {
    backgroundColor: "#C93E2B",
    borderColor: "#C93E2B",
  },
  categoryPillText: {
    fontSize: 13,
    color: "#D1BBA2",
    fontWeight: "500",
  },
  categoryPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  menuScroll: {
    flex: 1,
  },
  menuGrid: {
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
  dishTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dishEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  dishMeta: {
    flex: 1,
  },
  dishName: {
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
  dishDesc: {
    fontSize: 12,
    color: "#B69A89",
    marginTop: 8,
    lineHeight: 16,
  },
  dishActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  dishCatBadge: {
    fontSize: 11,
    color: "#C98E7B",
    backgroundColor: "#3A1A16",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  addBtn: {
    backgroundColor: "#C93E2B",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  stepperContainer: {
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
  stepperCount: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    minWidth: 20,
    textAlign: "center",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyText: {
    color: "#A88F80",
    fontSize: 15,
  },
  stickyCartBar: {
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
  stickyCartCount: {
    fontSize: 12,
    color: "#D2BEAD",
  },
  stickyCartTotal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  stickyCartBtn: {
    backgroundColor: "#C93E2B",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  stickyCartBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  cartScroll: {
    flex: 1,
  },
  cartContent: {
    padding: 16,
    gap: 16,
  },
  sectionBox: {
    backgroundColor: "#2A1210",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#44211D",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F3E9DC",
    marginBottom: 12,
  },
  orderTypeRow: {
    flexDirection: "row",
    gap: 8,
  },
  orderTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#381714",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4C241F",
  },
  orderTypeBtnActive: {
    backgroundColor: "#C93E2B",
    borderColor: "#C93E2B",
  },
  orderTypeBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#BCA393",
  },
  orderTypeBtnTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  tableSection: {
    marginTop: 14,
  },
  fieldLabel: {
    fontSize: 13,
    color: "#D1BBA2",
    fontWeight: "600",
    marginBottom: 6,
  },
  tableScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  tableChip: {
    backgroundColor: "#381714",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4C241F",
    minWidth: 84,
  },
  tableChipSelected: {
    borderColor: "#C93E2B",
    backgroundColor: "#4A1D17",
  },
  tableChipOccupied: {
    borderColor: "#E53E3E",
    opacity: 0.8,
  },
  tableChipReserved: {
    borderColor: "#D69E2E",
  },
  tableNameText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F3E9DC",
  },
  tableNameTextSelected: {
    color: "#FFFFFF",
  },
  tableCapText: {
    fontSize: 10,
    color: "#A88F80",
    marginTop: 2,
  },
  tableStatusText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#E29074",
    marginTop: 4,
  },
  detailsForm: {
    marginTop: 14,
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
    marginBottom: 10,
  },
  cartHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addMoreLink: {
    fontSize: 13,
    color: "#E29074",
    fontWeight: "600",
  },
  emptyCartBox: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyCartEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyCartText: {
    color: "#A88F80",
    fontSize: 14,
    marginBottom: 12,
  },
  browseBtn: {
    backgroundColor: "#C93E2B",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  browseBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  cartItemRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#381714",
    paddingVertical: 10,
  },
  cartItemEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F3E9DC",
  },
  cartItemSub: {
    fontSize: 12,
    color: "#A88F80",
    marginTop: 2,
  },
  cartItemTotalBold: {
    color: "#E29074",
    fontWeight: "700",
  },
  pillOptionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  discountPill: {
    flex: 1,
    backgroundColor: "#381714",
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4C241F",
  },
  discountPillActive: {
    backgroundColor: "#C93E2B",
    borderColor: "#C93E2B",
  },
  discountPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#BCA393",
  },
  discountPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F3E9DC",
  },
  toggleSub: {
    fontSize: 11,
    color: "#A88F80",
    marginTop: 2,
  },
  switchBtn: {
    backgroundColor: "#381714",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4C241F",
  },
  switchBtnActive: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  switchBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#BCA393",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F3E9DC",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#44211D",
    marginVertical: 8,
  },
  grandTotalLabel: {
    fontSize: 17,
    fontWeight: "800",
    color: "#F3E9DC",
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#E29074",
  },
  cashSection: {
    marginTop: 14,
  },
  cashInput: {
    backgroundColor: "#1F0E0C",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4A2520",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#F3E9DC",
    fontSize: 16,
    fontWeight: "700",
  },
  quickCashRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  quickCashChip: {
    flex: 1,
    backgroundColor: "#381714",
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4C241F",
  },
  quickCashChipText: {
    fontSize: 12,
    color: "#D1BBA2",
    fontWeight: "600",
  },
  changeDueBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1B3821",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#2E7D32",
  },
  changeDueLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#A7F3D0",
  },
  changeDueValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  checkoutBtn: {
    backgroundColor: "#C93E2B",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  checkoutBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    padding: 20,
  },
  receiptContainer: {
    backgroundColor: "#1E0D0B",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#4A2520",
  },
  receiptPaper: {
    backgroundColor: "#FAF6F0",
    borderRadius: 12,
    padding: 16,
  },
  receiptBrand: {
    fontSize: 22,
    fontWeight: "900",
    color: "#3A1A16",
    textAlign: "center",
  },
  receiptSub: {
    fontSize: 11,
    color: "#7D6258",
    textAlign: "center",
    marginTop: 2,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: "#DDD2C4",
    marginVertical: 10,
  },
  receiptDividerDashed: {
    height: 1,
    backgroundColor: "#3A1A16",
    marginVertical: 10,
    borderStyle: "dashed",
  },
  receiptMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 2,
  },
  receiptMetaText: {
    fontSize: 12,
    color: "#5C463F",
    fontWeight: "600",
  },
  receiptItemRow: {
    flexDirection: "row",
    marginVertical: 4,
  },
  receiptItemQty: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3A1A16",
    width: 28,
  },
  receiptItemTitle: {
    fontSize: 12,
    color: "#3A1A16",
    flex: 1,
  },
  receiptItemPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3A1A16",
  },
  receiptTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 2,
  },
  receiptTotalLabel: {
    fontSize: 12,
    color: "#5C463F",
  },
  receiptTotalValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3A1A16",
  },
  receiptGrandLabel: {
    fontSize: 15,
    fontWeight: "900",
    color: "#3A1A16",
  },
  receiptGrandValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#C93E2B",
  },
  receiptFooterNote: {
    fontSize: 11,
    color: "#7D6258",
    textAlign: "center",
    marginTop: 14,
    fontStyle: "italic",
  },
  modalActionRow: {
    marginTop: 16,
  },
  modalNewBtn: {
    backgroundColor: "#C93E2B",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalNewBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
