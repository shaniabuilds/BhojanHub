import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
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
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "../config/apiClient";
import { menuItems as defaultMenuItems, categories } from "../data/menuData";
import { formatCurrency } from "../utils/billing";
import type {
  MenuItem,
  CartItem,
  PosOrder,
  MenuResponse,
  OrderResponse,
} from "../types/pos";
import { useRoute, useRouter } from "expo-router";

type CustomerTab = "menu" | "cart" | "track" | "rewards" | "profile";

type PaymentMode = "UPI" | "Card" | "COD";

interface CustomerProfile {
  id?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  points: number;
  isLoggedIn: boolean;
}

const CUSTOMER_SESSION_KEY = "@bhojanhub_customer_session";

const CUSTOMER_PROFILE_PREFIX = "@bhojanhub_customer_profile:";

const CUSTOMER_ORDERS_PREFIX = "@bhojanhub_customer_orders:";

const CUSTOMER_REWARDS_PREFIX = "@bhojanhub_customer_rewards:";

const TRACKING_STAGES = [
  {
    key: "placed",
    title: "Order Placed",
    desc: "Your order has been sent to the restaurant.",
    emoji: "📋",
  },
  {
    key: "progress",
    title: "Order in Progress",
    desc: "The restaurant is preparing your order.",
    emoji: "👨‍🍳",
  },
  {
    key: "delivered",
    title: "Delivered",
    desc: "Your order has been delivered.",
    emoji: "🎉",
  },
] as const;

// =========================================================
// REWARD VOUCHER TYPES / CATALOG
// =========================================================

interface RedeemedReward {
  id: string;
  catalogId: string;
  title: string;
  cost: number;
  discountValue: number;
  status: "active" | "used";
  redeemedAt: string;
  usedOrderId?: string;
}

const REWARD_CATALOG = [
  {
    id: "reward-50-off",
    title: "₹50 Off Your Meal",
    cost: 500,
    discountValue: 50,
    emoji: "🏷️",
    desc: "Applicable on eligible orders.",
  },
  {
    id: "reward-free-dessert",
    title: "Free Dessert",
    cost: 1000,
    discountValue: 80,
    emoji: "🍮",
    desc: "Redeemable with eligible orders.",
  },
  {
    id: "reward-150-off",
    title: "₹150 Off Mega Feast",
    cost: 1500,
    discountValue: 150,
    emoji: "🎉",
    desc: "Available for qualifying orders.",
  },
] as const;

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}

function getProfileStorageKey(phone: string): string {
  return `${CUSTOMER_PROFILE_PREFIX}${normalizePhone(phone)}`;
}

function getOrdersStorageKey(phone: string): string {
  return `${CUSTOMER_ORDERS_PREFIX}${normalizePhone(phone)}`;
}

function getRewardsStorageKey(phone: string): string {
  return `${CUSTOMER_REWARDS_PREFIX}${normalizePhone(phone)}`;
}

function normalizeOrdersResponse(data: any): PosOrder[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.orders)) {
    return data.orders;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (data?.order) {
    return [data.order];
  }

  return [];
}

function getOrderPhone(order: PosOrder): string {
  const details = order.details as any;

  return normalizePhone(
    String(
      details?.delivery?.phone ||
        details?.customer?.phone ||
        details?.phone ||
        "",
    ),
  );
}

function getOrderStatusLabel(status?: string): string {
  switch (status) {
    case "completed":
      return "Delivered";

    case "cancelled":
      return "Cancelled";

    default:
      return "In Progress";
  }
}

function getTrackingStageIndex(status?: string): number {
  if (status === "completed") {
    return 2;
  }

  if (status === "cancelled") {
    return 0;
  }

  return 1;
}

function orderBelongsToCustomer(
  order: PosOrder,
  profile: CustomerProfile,
): boolean {
  const orderCustomerId = String((order as any).customerId || "");

  const profileCustomerId = String(profile.id || "");

  if (
    orderCustomerId &&
    profileCustomerId &&
    orderCustomerId === profileCustomerId
  ) {
    return true;
  }

  const orderPhone = getOrderPhone(order);
  const customerPhone = normalizePhone(profile.phone);

  return Boolean(orderPhone && customerPhone && orderPhone === customerPhone);
}

export default function CustomerScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CustomerTab>("menu");

  // =========================================================
  // CUSTOMER PROFILE
  // =========================================================

  const [customer, setCustomer] = useState<CustomerProfile>({
    name: "",
    phone: "",
    email: "",
    address: "",
    points: 0,
    isLoggedIn: false,
  });

  // =========================================================
  // CUSTOMER LOGIN
  // =========================================================

  const [showLoginModal, setShowLoginModal] = useState(false);

  const [loginPhone, setLoginPhone] = useState("");

  const [loginName, setLoginName] = useState("");

  // =========================================================
  // MENU
  // =========================================================

  const [menuItems, setMenuItems] = useState<MenuItem[]>(defaultMenuItems);

  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const [searchQuery, setSearchQuery] = useState("");

  const [pureVegOnly, setPureVegOnly] = useState(false);

  // CART / CHECKOUT

  const [cart, setCart] = useState<CartItem[]>([]);

  const [cookingInstructions, setCookingInstructions] = useState("");

  const [redeemPoints, setRedeemPoints] = useState(false);

  const [deliveryAddress, setDeliveryAddress] = useState("");

  const [deliveryPhone, setDeliveryPhone] = useState("");

  const [deliveryName, setDeliveryName] = useState("");

  const [paymentMode, setPaymentMode] = useState<PaymentMode>("UPI");

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const [isLocating, setIsLocating] = useState(false);

  // REWARD VOUCHERS

  const [redeemedRewards, setRedeemedRewards] = useState<RedeemedReward[]>([]);

  const [appliedRewardId, setAppliedRewardId] = useState<string | null>(null);

  const [currentOrder, setCurrentOrder] = useState<PosOrder | null>(null);

  const [myOrders, setMyOrders] = useState<PosOrder[]>([]);

  const [isRefreshingOrder, setIsRefreshingOrder] = useState(false);

  const [showCelebration, setShowCelebration] = useState(false);

  const [celebrationPointsEarned, setCelebrationPointsEarned] = useState(0);

  const previousOrderStatus = useRef<string | undefined>(undefined);

  // LOAD CUSTOMER SESSION

  useEffect(() => {
    let mounted = true;

    const loadCustomerSession = async () => {
      try {
        const session = await AsyncStorage.getItem(CUSTOMER_SESSION_KEY);

        if (!session) {
          if (mounted) {
            setShowLoginModal(true);
          }

          return;
        }

        let sessionData: any;

        try {
          sessionData = JSON.parse(session);
        } catch {
          sessionData = null;
        }

        const sessionPhone = normalizePhone(String(sessionData?.phone || ""));

        if (!sessionPhone) {
          await AsyncStorage.removeItem(CUSTOMER_SESSION_KEY);

          if (mounted) {
            setShowLoginModal(true);
          }

          return;
        }

        const profileRaw = await AsyncStorage.getItem(
          getProfileStorageKey(sessionPhone),
        );

        const ordersRaw = await AsyncStorage.getItem(
          getOrdersStorageKey(sessionPhone),
        );

        const rewardsRaw = await AsyncStorage.getItem(
          getRewardsStorageKey(sessionPhone),
        );

        if (!mounted) return;

        let profile: CustomerProfile = {
          name: String(sessionData?.name || ""),
          phone: sessionPhone,
          email: "",
          address: "",
          points: 0,
          isLoggedIn: true,
        };

        if (profileRaw) {
          try {
            const parsed = JSON.parse(profileRaw);

            profile = {
              id: parsed?.id,
              name: parsed?.name || profile.name || "BhojanHub Customer",
              phone: sessionPhone,
              email: parsed?.email || "",
              address: parsed?.address || "",
              points: 0,
              isLoggedIn: true,
            };
          } catch {}
        }

        let storedOrders: PosOrder[] = [];

        if (ordersRaw) {
          try {
            const parsed = JSON.parse(ordersRaw);

            if (Array.isArray(parsed)) {
              storedOrders = parsed.filter((order: PosOrder) =>
                orderBelongsToCustomer(order, profile),
              );
            }
          } catch {
            storedOrders = [];
          }
        }

        let storedRewards: RedeemedReward[] = [];

        if (rewardsRaw) {
          try {
            const parsed = JSON.parse(rewardsRaw);

            if (Array.isArray(parsed)) {
              storedRewards = parsed;
            }
          } catch {
            storedRewards = [];
          }
        }

        setCustomer(profile);
        setDeliveryName(profile.name);
        setDeliveryPhone(profile.phone);
        setDeliveryAddress(profile.address);
        setMyOrders(storedOrders);
        setRedeemedRewards(storedRewards);

        if (storedOrders.length > 0) {
          setCurrentOrder(storedOrders[0]);
        }

        setShowLoginModal(false);

        try {
          const response = await apiFetch<any>("/api/orders");

          const backendOrders = normalizeOrdersResponse(response);

          const customerOrders = backendOrders.filter((order) =>
            orderBelongsToCustomer(order, profile),
          );

          if (!mounted) return;

          if (customerOrders.length > 0) {
            const mergedOrders = [
              ...customerOrders,
              ...storedOrders.filter(
                (localOrder) =>
                  !customerOrders.some(
                    (backendOrder) => backendOrder.id === localOrder.id,
                  ),
              ),
            ];

            setMyOrders(mergedOrders);

            setCurrentOrder(mergedOrders[0]);

            await AsyncStorage.setItem(
              getOrdersStorageKey(sessionPhone),
              JSON.stringify(mergedOrders),
            );
          }
        } catch {
          // Local orders remain available.
        }
      } catch {
        if (mounted) {
          setShowLoginModal(true);
        }
      }
    };

    void loadCustomerSession();

    return () => {
      mounted = false;
    };
  }, []);

  // FETCH LIVE MENU

  useEffect(() => {
    let mounted = true;

    const fetchMenu = async () => {
      try {
        const response = await apiFetch<MenuResponse>("/api/menu");

        if (mounted && response?.items && response.items.length > 0) {
          const enhanced = response.items.map((item) => {
            const fallback = defaultMenuItems.find((d) => d.id === item.id);

            return {
              ...item,
              emoji: (item as any).emoji || (fallback as any)?.emoji || "🍛",
            };
          });

          setMenuItems(enhanced);
        }
      } catch {
        // Local menu remains as fallback.
      }
    };

    void fetchMenu();

    return () => {
      mounted = false;
    };
  }, []);

  // reward
  const earnedRewardPoints = useMemo(() => {
    return myOrders
      .filter((order) => order.status === "completed")
      .reduce((total, order) => {
        return total + Math.round(Number(order.totals?.grandTotal || 0));
      }, 0);
  }, [myOrders]);

  // =========================================================
  // REDEEMED REWARD VOUCHERS
  // =========================================================

  const totalRedeemedPointsCost = useMemo(() => {
    return redeemedRewards.reduce((total, reward) => total + reward.cost, 0);
  }, [redeemedRewards]);

  const customerPoints = Math.max(
    0,
    earnedRewardPoints - totalRedeemedPointsCost,
  );

  const activeRewardVouchers = useMemo(
    () => redeemedRewards.filter((reward) => reward.status === "active"),
    [redeemedRewards],
  );

  const appliedRewardVoucher = useMemo(
    () =>
      activeRewardVouchers.find((reward) => reward.id === appliedRewardId) ||
      null,
    [activeRewardVouchers, appliedRewardId],
  );

  useEffect(() => {
    setCustomer((previous) => {
      if (previous.points === customerPoints) {
        return previous;
      }

      return {
        ...previous,
        points: customerPoints,
      };
    });
  }, [customerPoints]);

  // =========================================================
  // VEGETARIAN DETECTION
  // =========================================================

  const isDishVeg = useCallback((item: MenuItem) => {
    const text = `${item.name} ${
      item.description
    } ${item.category}`.toLowerCase();

    if (
      text.includes("chicken") ||
      text.includes("mutton") ||
      text.includes("fish") ||
      text.includes("egg") ||
      text.includes("prawn") ||
      text.includes("meat") ||
      text.includes("kebab")
    ) {
      return false;
    }

    return true;
  }, []);

  // =========================================================
  // FILTERED MENU
  // =========================================================

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCategory =
        selectedCategory === "All" || item.category === selectedCategory;

      const query = searchQuery.trim().toLowerCase();

      const matchSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);

      const matchVeg = !pureVegOnly || isDishVeg(item);

      return matchCategory && matchSearch && matchVeg;
    });
  }, [menuItems, selectedCategory, searchQuery, pureVegOnly, isDishVeg]);

  // cart

  const addToCart = (dish: MenuItem) => {
    setCart((previous) => {
      const existing = previous.find((item) => item.id === dish.id);

      if (existing) {
        return previous.map((item) =>
          item.id === dish.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      return [
        ...previous,
        {
          ...dish,
          quantity: 1,
        },
      ];
    });
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(
      (previous) =>
        previous
          .map((item) => {
            if (item.id !== id) {
              return item;
            }

            const quantity = item.quantity + delta;

            return quantity > 0
              ? {
                  ...item,
                  quantity,
                }
              : null;
          })
          .filter(Boolean) as CartItem[],
    );
  };

  const totalCartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart],
  );

  const subtotal = useMemo(() => {
    const value = cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );

    return Math.round((value + Number.EPSILON) * 100) / 100;
  }, [cart]);

  // REWARD DISCOUNT (points % redemption)

  const pointsDiscountValue = useMemo(() => {
    if (!redeemPoints || customerPoints < 100) {
      return 0;
    }

    const maxDiscountAllowed = Math.floor(subtotal * 0.2);

    const pointsValue = Math.floor(customerPoints / 10);

    return Math.min(pointsValue, maxDiscountAllowed);
  }, [redeemPoints, customerPoints, subtotal]);

  // delivery fees

  const deliveryFee = useMemo(() => {
    if (subtotal === 0) {
      return 0;
    }

    return subtotal >= 199 ? 0 : 40;
  }, [subtotal]);

  // Bill
  const bill = useMemo(() => {
    const gstRate = 5;

    const voucherDiscountAmount = Math.min(
      Math.max(0, appliedRewardVoucher?.discountValue || 0),
      Math.max(0, subtotal - pointsDiscountValue),
    );

    const requestedDiscount = pointsDiscountValue + voucherDiscountAmount;

    const discountAmount =
      Math.round(Math.min(subtotal, requestedDiscount) * 100) / 100;

    const taxableAmount =
      Math.round(Math.max(0, subtotal - discountAmount) * 100) / 100;

    const taxAmount = Math.round(((taxableAmount * gstRate) / 100) * 100) / 100;

    const normalizedDeliveryFee =
      Math.round(Math.max(0, deliveryFee) * 100) / 100;

    const grandTotal =
      Math.round((taxableAmount + taxAmount + normalizedDeliveryFee) * 100) /
      100;

    return {
      subtotal,
      discountAmount,
      voucherDiscountAmount,
      taxableAmount,
      taxAmount,
      serviceCharge: 0,
      deliveryFee: normalizedDeliveryFee,
      grandTotal,
    };
  }, [subtotal, pointsDiscountValue, appliedRewardVoucher, deliveryFee]);

  // GPS

  const requestGPSLocation = () => {
    setIsLocating(true);

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          setDeliveryAddress(
            `Current GPS location: ${latitude.toFixed(6)}, ${longitude.toFixed(
              6,
            )}\n\nPlease enter your flat/house number, building and delivery details.`,
          );

          setIsLocating(false);

          Alert.alert(
            "Location Detected",
            "Your current GPS coordinates were detected. Please enter your complete delivery address below.",
          );
        },
        () => {
          setIsLocating(false);

          Alert.alert(
            "Location Permission Denied",
            "Please enter your complete delivery address manually.",
          );
        },
        {
          timeout: 8000,
          enableHighAccuracy: true,
        },
      );
    } else {
      setIsLocating(false);

      Alert.alert(
        "GPS Unavailable",
        "Current GPS is not available on this device. Please enter your delivery address manually.",
      );
    }
  };

  // SAVE CUSTOMER PROFILE

  const saveCustomerProfile = async (profile: CustomerProfile) => {
    const phone = normalizePhone(profile.phone);

    if (!phone) return;

    await AsyncStorage.setItem(
      CUSTOMER_SESSION_KEY,
      JSON.stringify({
        phone,
        name: profile.name,
      }),
    );

    await AsyncStorage.setItem(
      getProfileStorageKey(phone),
      JSON.stringify({
        ...profile,
        phone,
        points: 0,
        isLoggedIn: true,
      }),
    );
  };

  // SAVE REDEEMED REWARDS

  const persistRedeemedRewards = async (
    phone: string,
    rewards: RedeemedReward[],
  ) => {
    const cleanedPhone = normalizePhone(phone);

    if (!cleanedPhone) return;

    await AsyncStorage.setItem(
      getRewardsStorageKey(cleanedPhone),
      JSON.stringify(rewards),
    );
  };

  // REDEEM REWARD

  const handleRedeemReward = (reward: (typeof REWARD_CATALOG)[number]) => {
    if (customerPoints < reward.cost) {
      Alert.alert(
        "Reward Locked",
        `You need ${reward.cost} points to redeem this reward.`,
      );
      return;
    }

    Alert.alert(
      "Redeem Reward",
      `Redeem ${reward.title} for ${reward.cost} points?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Redeem",
          onPress: async () => {
            const newReward: RedeemedReward = {
              id: `redeemed-${Date.now()}`,
              catalogId: reward.id,
              title: reward.title,
              cost: reward.cost,
              discountValue: reward.discountValue,
              status: "active",
              redeemedAt: new Date().toISOString(),
            };

            const updatedRewards = [newReward, ...redeemedRewards];

            setRedeemedRewards(updatedRewards);

            await persistRedeemedRewards(customer.phone, updatedRewards);

            Alert.alert(
              "Reward Redeemed",
              `${reward.title} is ready. Apply it at checkout to get ${formatCurrency(
                reward.discountValue,
              )} off.`,
            );
          },
        },
      ],
    );
  };

  // PLACE ORDER

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      Alert.alert("Cart Empty", "Please add at least one dish to your cart.");
      return;
    }

    if (!deliveryName.trim() || !deliveryPhone.trim()) {
      Alert.alert(
        "Contact Details Required",
        "Please provide your name and mobile number.",
      );
      return;
    }

    const cleanedPhone = normalizePhone(deliveryPhone);

    if (cleanedPhone.length !== 10) {
      Alert.alert(
        "Invalid Mobile Number",
        "Please enter a valid 10-digit mobile number.",
      );
      return;
    }

    if (!deliveryAddress.trim()) {
      Alert.alert(
        "Delivery Address Required",
        "Please enter your complete delivery address.",
      );
      return;
    }

    if (normalizePhone(customer.phone) !== cleanedPhone) {
      Alert.alert(
        "Mobile Number Mismatch",
        "Please use the same mobile number as your customer account.",
      );
      return;
    }

    setIsPlacingOrder(true);

    const orderNumber = Math.floor(100000 + Math.random() * 900000);

    try {
      let customerId = customer.id || "";

      try {
        const customerResponse = await apiFetch<any>("/api/customers", {
          method: "POST",
          body: JSON.stringify({
            name: deliveryName.trim(),
            phone: cleanedPhone,
            email: customer.email || undefined,
            address: deliveryAddress.trim(),
            tags: ["Online Ordering", "Customer App"],
          }),
        });

        if (customerResponse?.customer?.id) {
          customerId = customerResponse.customer.id;
        }
      } catch {}

      const totalDiscountApplied = bill.discountAmount;

      const orderPayload = {
        status: "open",
        channel: "online",
        orderNumber,

        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),

        details: {
          type: "Delivery",

          delivery: {
            name: deliveryName.trim(),
            phone: cleanedPhone,
            address: deliveryAddress.trim(),
          },

          notes: cookingInstructions.trim() || undefined,

          reward: appliedRewardVoucher
            ? {
                id: appliedRewardVoucher.id,
                title: appliedRewardVoucher.title,
                discountValue: appliedRewardVoucher.discountValue,
              }
            : undefined,
        },

        discount:
          totalDiscountApplied > 0
            ? {
                kind: "fixed",
                value: totalDiscountApplied,
              }
            : {
                kind: "percent",
                value: 0,
              },

        taxRate: 5,
        serviceEnabled: false,
        serviceRate: 0,

        paymentMethod: paymentMode === "COD" ? "Cash" : paymentMode,

        totals: {
          subtotal: bill.subtotal,
          discountAmount: bill.discountAmount,
          taxableAmount: bill.taxableAmount,
          taxAmount: bill.taxAmount,
          serviceCharge: bill.serviceCharge,
          deliveryFee: bill.deliveryFee,
          grandTotal: bill.grandTotal,
        },

        customerId: customerId || undefined,
      };

      const response = await apiFetch<OrderResponse>("/api/orders", {
        method: "POST",
        body: JSON.stringify(orderPayload),
      });

      const placedOrder: PosOrder = response?.order || {
        id: `ord-${orderNumber}`,
        orderNumber,
        status: "open",
        items: [...cart],
        details: orderPayload.details as any,
        totals: bill as any,
        paymentMethod: paymentMode === "COD" ? "Cash" : paymentMode,
        channel: "online",
        customerId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // UPDATE CURRENT CUSTOMER

      const updatedCustomer: CustomerProfile = {
        ...customer,
        id: customerId || customer.id,
        name: deliveryName.trim(),
        phone: cleanedPhone,
        address: deliveryAddress.trim(),
        isLoggedIn: true,
        points: customerPoints,
      };

      setCustomer(updatedCustomer);

      await saveCustomerProfile(updatedCustomer);

      //SAVE ORDER UNDER THIS PHONE ONLY

      const updatedOrders = [
        placedOrder,
        ...myOrders.filter((order) => order.id !== placedOrder.id),
      ];

      setMyOrders(updatedOrders);

      await AsyncStorage.setItem(
        getOrdersStorageKey(cleanedPhone),
        JSON.stringify(updatedOrders),
      );

      if (appliedRewardVoucher) {
        const updatedRewards = redeemedRewards.map((reward) =>
          reward.id === appliedRewardVoucher.id
            ? {
                ...reward,
                status: "used" as const,
                usedOrderId: placedOrder.id,
              }
            : reward,
        );

        setRedeemedRewards(updatedRewards);

        await persistRedeemedRewards(cleanedPhone, updatedRewards);
      }

      // START TRACKING

      setCurrentOrder(placedOrder);

      previousOrderStatus.current = placedOrder.status;

      setCart([]);
      setCookingInstructions("");
      setRedeemPoints(false);
      setAppliedRewardId(null);
      setActiveTab("track");

      Alert.alert(
        "Order Confirmed",
        `Order #${
          placedOrder.orderNumber || placedOrder.id.slice(-6)
        } has been sent to the restaurant.`,
      );
    } catch (error: any) {
      Alert.alert(
        "Order Failed",
        error?.message || "Unable to place the order. Please try again.",
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // =========================================================
  // FETCH LIVE ORDER
  // =========================================================

  const fetchLiveOrder = useCallback(
    async (orderId: string) => {
      if (!orderId || !customer.isLoggedIn) {
        return;
      }

      setIsRefreshingOrder(true);

      try {
        let liveOrder: PosOrder | null = null;

        try {
          const response = await apiFetch<any>(
            `/api/orders/${encodeURIComponent(orderId)}`,
          );

          if (response?.order) {
            liveOrder = response.order;
          } else if (response?.id) {
            liveOrder = response;
          }
        } catch {
          // Fall back to order list.
        }

        if (!liveOrder) {
          try {
            const response = await apiFetch<any>("/api/orders");

            const orders = normalizeOrdersResponse(response);

            liveOrder =
              orders.find(
                (order) =>
                  order.id === orderId &&
                  orderBelongsToCustomer(order, customer),
              ) || null;
          } catch {
            // Keep local order.
          }
        }

        // Security check:
        // Never display another customer's order.
        if (liveOrder && !orderBelongsToCustomer(liveOrder, customer)) {
          liveOrder = null;
        }

        if (!liveOrder) {
          return;
        }

        const oldStatus = currentOrder?.status;

        setCurrentOrder(liveOrder);

        setMyOrders((previous) => {
          const filteredPrevious = previous.filter((order) =>
            orderBelongsToCustomer(order, customer),
          );

          const exists = filteredPrevious.some(
            (order) => order.id === liveOrder!.id,
          );

          const next = exists
            ? filteredPrevious.map((order) =>
                order.id === liveOrder!.id ? liveOrder! : order,
              )
            : [liveOrder!, ...filteredPrevious];

          void AsyncStorage.setItem(
            getOrdersStorageKey(customer.phone),
            JSON.stringify(next),
          );

          return next;
        });

        // Celebration happens only when the
        // backend changes the order to completed.
        if (oldStatus !== "completed" && liveOrder.status === "completed") {
          const earned = Math.round(Number(liveOrder.totals?.grandTotal || 0));

          if (earned > 0) {
            setCelebrationPointsEarned(earned);

            setShowCelebration(true);
          }
        }

        previousOrderStatus.current = liveOrder.status;
      } finally {
        setIsRefreshingOrder(false);
      }
    },
    [customer, currentOrder?.status],
  );

  // LIVE TRACKING POLLING

  useEffect(() => {
    if (
      !currentOrder?.id ||
      !customer.isLoggedIn ||
      currentOrder.status === "completed" ||
      currentOrder.status === "cancelled"
    ) {
      return;
    }

    void fetchLiveOrder(currentOrder.id);

    const interval = setInterval(() => {
      void fetchLiveOrder(currentOrder.id);
    }, 10000);

    return () => clearInterval(interval);
  }, [
    currentOrder?.id,
    currentOrder?.status,
    customer.isLoggedIn,
    fetchLiveOrder,
  ]);

  // CUSTOMER LOGIN

  const handleCustomerLogin = async () => {
    const cleanedPhone = normalizePhone(loginPhone);

    if (!loginName.trim()) {
      Alert.alert("Name Required", "Please enter your full name.");
      return;
    }

    if (cleanedPhone.length !== 10) {
      Alert.alert(
        "Invalid Mobile Number",
        "Please enter a valid 10-digit mobile number.",
      );
      return;
    }

    try {
      const profileKey = getProfileStorageKey(cleanedPhone);

      const ordersKey = getOrdersStorageKey(cleanedPhone);

      const rewardsKey = getRewardsStorageKey(cleanedPhone);

      // Load THIS customer's profile only.
      const storedProfile = await AsyncStorage.getItem(profileKey);

      let existingProfile: CustomerProfile | null = null;

      if (storedProfile) {
        try {
          existingProfile = JSON.parse(storedProfile);
        } catch {
          existingProfile = null;
        }
      }

      const newProfile: CustomerProfile = {
        id: existingProfile?.id,
        name: loginName.trim() || existingProfile?.name || "BhojanHub Customer",
        phone: cleanedPhone,
        email: existingProfile?.email || `${cleanedPhone}@bhojanhub.com`,
        address: existingProfile?.address || "",
        points: 0,
        isLoggedIn: true,
      };

      // Load ONLY orders belonging to this phone.
      let storedOrders: PosOrder[] = [];

      const storedOrdersRaw = await AsyncStorage.getItem(ordersKey);

      if (storedOrdersRaw) {
        try {
          const parsed = JSON.parse(storedOrdersRaw);

          if (Array.isArray(parsed)) {
            storedOrders = parsed.filter((order: PosOrder) =>
              orderBelongsToCustomer(order, newProfile),
            );
          }
        } catch {
          storedOrders = [];
        }
      }

      // Load ONLY reward vouchers belonging to this phone.
      let storedRewards: RedeemedReward[] = [];

      const storedRewardsRaw = await AsyncStorage.getItem(rewardsKey);

      if (storedRewardsRaw) {
        try {
          const parsed = JSON.parse(storedRewardsRaw);

          if (Array.isArray(parsed)) {
            storedRewards = parsed;
          }
        } catch {
          storedRewards = [];
        }
      }

      setCustomer(newProfile);

      setDeliveryName(newProfile.name);

      setDeliveryPhone(newProfile.phone);

      setDeliveryAddress(newProfile.address);

      setMyOrders(storedOrders);

      setRedeemedRewards(storedRewards);

      setAppliedRewardId(null);

      if (storedOrders.length > 0) {
        setCurrentOrder(storedOrders[0]);
      } else {
        setCurrentOrder(null);
      }

      await AsyncStorage.setItem(profileKey, JSON.stringify(newProfile));

      await AsyncStorage.setItem(
        CUSTOMER_SESSION_KEY,
        JSON.stringify({
          phone: cleanedPhone,
          name: newProfile.name,
        }),
      );

      // Refresh this customer's orders from backend.
      try {
        const response = await apiFetch<any>("/api/orders");

        const backendOrders = normalizeOrdersResponse(response);

        const customerOrders = backendOrders.filter((order) =>
          orderBelongsToCustomer(order, newProfile),
        );

        if (customerOrders.length > 0) {
          const mergedOrders = [
            ...customerOrders,
            ...storedOrders.filter(
              (localOrder) =>
                !customerOrders.some(
                  (backendOrder) => backendOrder.id === localOrder.id,
                ),
            ),
          ];

          setMyOrders(mergedOrders);

          setCurrentOrder(mergedOrders[0]);

          await AsyncStorage.setItem(ordersKey, JSON.stringify(mergedOrders));
        }
      } catch {
        // Local customer orders remain available.
      }

      setShowLoginModal(false);

      setLoginName("");
      setLoginPhone("");

      setActiveTab("menu");
    } catch {
      Alert.alert("Login Error", "Unable to save customer profile.");
    }
  };

  // =========================================================
  // CUSTOMER SIGN OUT / SWITCH CUSTOMER
  // =========================================================

  const handleCustomerSignOut = async () => {
    Alert.alert(
      "Switch Customer",
      "Do you want to sign out and continue with another customer account?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Continue",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem(CUSTOMER_SESSION_KEY);

            setCustomer({
              name: "",
              phone: "",
              email: "",
              address: "",
              points: 0,
              isLoggedIn: false,
            });

            setMyOrders([]);
            setCurrentOrder(null);
            setCart([]);
            setDeliveryName("");
            setDeliveryPhone("");
            setDeliveryAddress("");
            setRedeemedRewards([]);
            setAppliedRewardId(null);
            setActiveTab("menu");

            setLoginName("");
            setLoginPhone("");

            setShowLoginModal(true);
          },
        },
      ],
    );
  };

  const handleSwitchToRestaurant = () => {
    router.replace("/");
  };

  // =========================================================
  // TRACKING DATA
  // =========================================================

  const currentStageIdx = getTrackingStageIndex(currentOrder?.status);

  const currentStage = TRACKING_STAGES[currentStageIdx];

  const isCancelled = currentOrder?.status === "cancelled";

  const isCompleted = currentOrder?.status === "completed";

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <View style={styles.container}>
      {/* =====================================================
          CUSTOMER HEADER
      ===================================================== */}

      <View style={styles.topHeader}>
        <View style={styles.topHeaderLeft}>
          <TouchableOpacity
            style={styles.locationBar}
            onPress={() => setActiveTab("cart")}
            activeOpacity={0.8}
          >
            <Text style={styles.locationPin}>📍</Text>

            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text style={styles.locationTitle}>Delivering to Home</Text>

                <Text style={styles.locationArrow}> ▼</Text>
              </View>

              <Text style={styles.locationAddress} numberOfLines={1}>
                {deliveryAddress || "Add your delivery address"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.rewardsPill}
          onPress={() => setActiveTab("rewards")}
          activeOpacity={0.8}
        >
          <Text style={styles.rewardsPillText}>⭐ {customerPoints} pts</Text>
        </TouchableOpacity>
      </View>

      {/* =====================================================
          MENU
      ===================================================== */}

      {activeTab === "menu" && (
        <View style={styles.flexOne}>
          <View style={styles.searchVegRow}>
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>

              <TextInput
                style={styles.searchInput}
                placeholder="Dishes, biryanis, curries, desserts..."
                placeholderTextColor="#A88F80"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />

              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Text style={styles.searchClear}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.vegFilterBtn,
                pureVegOnly && styles.vegFilterBtnActive,
              ]}
              onPress={() => setPureVegOnly(!pureVegOnly)}
              activeOpacity={0.8}
            >
              <View
                style={[styles.vegDot, pureVegOnly && styles.vegDotActive]}
              />

              <Text
                style={[
                  styles.vegFilterText,
                  pureVegOnly && styles.vegFilterTextActive,
                ]}
              >
                Pure Veg
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoriesWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContent}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.catChip,
                    selectedCategory === category && styles.catChipActive,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      selectedCategory === category && styles.catChipTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView
            style={styles.flexOne}
            contentContainerStyle={styles.menuScrollList}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.heroPromo}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroPromoBadge}>BHOJANHUB DELIVERY</Text>

                <Text style={styles.heroPromoTitle}>
                  Authentic Indian Gourmet
                </Text>

                <Text style={styles.heroPromoSub}>
                  Earn 1 point for every ₹1 spent on delivered orders.
                </Text>
              </View>

              <Text style={styles.heroPromoEmoji}>🍲</Text>
            </View>

            {filteredItems.map((dish) => {
              const inCart = cart.find((item) => item.id === dish.id);

              const quantity = inCart?.quantity || 0;

              const isVeg = isDishVeg(dish);

              return (
                <View key={dish.id} style={styles.consumerDishCard}>
                  <View style={styles.dishDetailsCol}>
                    <View style={styles.vegIndicatorRow}>
                      <View
                        style={[
                          styles.vegSymbolBox,
                          isVeg
                            ? styles.vegSymbolBoxGreen
                            : styles.vegSymbolBoxRed,
                        ]}
                      >
                        <View
                          style={[
                            styles.vegSymbolDot,
                            isVeg
                              ? styles.vegSymbolDotGreen
                              : styles.vegSymbolDotRed,
                          ]}
                        />
                      </View>

                      <Text style={styles.dishCategoryTag}>
                        {dish.category}
                      </Text>
                    </View>

                    <Text style={styles.consumerDishTitle}>{dish.name}</Text>

                    <Text style={styles.consumerDishPrice}>
                      {formatCurrency(dish.price)}
                    </Text>

                    <Text style={styles.consumerDishDesc} numberOfLines={2}>
                      {dish.description}
                    </Text>
                  </View>

                  <View style={styles.dishVisualCol}>
                    <View style={styles.dishEmojiContainer}>
                      <Text style={styles.dishLargeEmoji}>
                        {(dish as any).emoji || "🍛"}
                      </Text>
                    </View>

                    {quantity > 0 ? (
                      <View style={styles.customerStepper}>
                        <TouchableOpacity
                          style={styles.customerStepperBtn}
                          onPress={() => updateCartQuantity(dish.id, -1)}
                        >
                          <Text style={styles.customerStepperText}>−</Text>
                        </TouchableOpacity>

                        <Text style={styles.customerStepperQty}>
                          {quantity}
                        </Text>

                        <TouchableOpacity
                          style={styles.customerStepperBtn}
                          onPress={() => updateCartQuantity(dish.id, 1)}
                        >
                          <Text style={styles.customerStepperText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.customerAddBtn}
                        onPress={() => addToCart(dish)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.customerAddBtnText}>ADD +</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}

            {filteredItems.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🔍</Text>

                <Text style={styles.emptyTitle}>No dishes found</Text>

                <Text style={styles.emptyDesc}>
                  Try another search or category.
                </Text>
              </View>
            )}

            <View style={{ height: 120 }} />
          </ScrollView>

          {totalCartCount > 0 && (
            <View style={styles.floatingCartBar}>
              <View>
                <Text style={styles.floatingCartQty}>
                  {totalCartCount} item
                  {totalCartCount > 1 ? "s" : ""} added
                </Text>

                <Text style={styles.floatingCartPrice}>
                  {formatCurrency(subtotal)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.floatingCheckoutBtn}
                onPress={() => setActiveTab("cart")}
                activeOpacity={0.85}
              >
                <Text style={styles.floatingCheckoutText}>View Cart →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* =====================================================
          CART / CHECKOUT
      ===================================================== */}

      {activeTab === "cart" && (
        <ScrollView
          style={styles.flexOne}
          contentContainerStyle={styles.checkoutScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {cart.length === 0 ? (
            <View style={styles.emptyCartBox}>
              <Text style={styles.emptyCartEmoji}>🛍️</Text>

              <Text style={styles.emptyCartTitle}>Your bag is empty</Text>

              <Text style={styles.emptyCartSub}>
                Add something delicious from the menu.
              </Text>

              <TouchableOpacity
                style={styles.backToMenuBtn}
                onPress={() => setActiveTab("menu")}
              >
                <Text style={styles.backToMenuBtnText}>Explore Menu</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.checkoutSectionCard}>
                <View style={styles.sectionCardHeader}>
                  <Text style={styles.sectionCardTitle}>Your Order</Text>

                  <TouchableOpacity onPress={() => setActiveTab("menu")}>
                    <Text style={styles.linkAddMore}>+ Add More</Text>
                  </TouchableOpacity>
                </View>

                {cart.map((item) => (
                  <View key={item.id} style={styles.basketItemRow}>
                    <Text style={styles.basketItemEmoji}>
                      {(item as any).emoji || "🍛"}
                    </Text>

                    <View
                      style={{
                        flex: 1,
                        marginLeft: 10,
                      }}
                    >
                      <Text style={styles.basketItemName}>{item.name}</Text>

                      <Text style={styles.basketItemPrice}>
                        {formatCurrency(item.price)}
                      </Text>
                    </View>

                    <View style={styles.customerStepper}>
                      <TouchableOpacity
                        style={styles.customerStepperBtn}
                        onPress={() => updateCartQuantity(item.id, -1)}
                      >
                        <Text style={styles.customerStepperText}>−</Text>
                      </TouchableOpacity>

                      <Text style={styles.customerStepperQty}>
                        {item.quantity}
                      </Text>

                      <TouchableOpacity
                        style={styles.customerStepperBtn}
                        onPress={() => updateCartQuantity(item.id, 1)}
                      >
                        <Text style={styles.customerStepperText}>+</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.basketItemTotal}>
                      {formatCurrency(item.price * item.quantity)}
                    </Text>
                  </View>
                ))}

                <View style={styles.cookingNotesBox}>
                  <Text style={styles.cookingNotesLabel}>
                    Cooking Instructions
                  </Text>

                  <TextInput
                    style={styles.cookingNotesInput}
                    placeholder="Less spicy, extra onions, etc."
                    placeholderTextColor="#998377"
                    value={cookingInstructions}
                    onChangeText={setCookingInstructions}
                  />
                </View>
              </View>

              {/* DELIVERY */}
              <View style={styles.checkoutSectionCard}>
                <View style={styles.sectionCardHeader}>
                  <Text style={styles.sectionCardTitle}>Delivery Details</Text>

                  <TouchableOpacity
                    style={styles.gpsButton}
                    onPress={requestGPSLocation}
                    disabled={isLocating}
                  >
                    {isLocating ? (
                      <ActivityIndicator size="small" color="#E29074" />
                    ) : (
                      <Text style={styles.gpsButtonText}>📍 Use GPS</Text>
                    )}
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputFieldLabel}>Full Name *</Text>

                <TextInput
                  style={styles.checkoutInput}
                  placeholder="Your full name"
                  placeholderTextColor="#998377"
                  value={deliveryName}
                  onChangeText={setDeliveryName}
                />

                <Text style={styles.inputFieldLabel}>Mobile Number *</Text>

                <TextInput
                  style={styles.checkoutInput}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#998377"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={deliveryPhone}
                  onChangeText={setDeliveryPhone}
                />

                <Text style={styles.inputFieldLabel}>
                  Complete Delivery Address *
                </Text>

                <TextInput
                  style={[
                    styles.checkoutInput,
                    {
                      height: 80,
                      textAlignVertical: "top",
                    },
                  ]}
                  placeholder="Flat / House no., Building, Street, Area, Landmark..."
                  placeholderTextColor="#998377"
                  multiline
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                />
              </View>

              {/* REWARDS */}
              <View style={styles.checkoutSectionCard}>
                <View style={styles.sectionCardHeader}>
                  <Text style={styles.sectionCardTitle}>BhojanHub Rewards</Text>

                  <Text style={styles.rewardsBalanceBadge}>
                    ⭐ {customerPoints}
                  </Text>
                </View>

                {customerPoints >= 100 ? (
                  <TouchableOpacity
                    style={[
                      styles.redeemPointsRow,
                      redeemPoints && styles.redeemPointsRowActive,
                    ]}
                    onPress={() => setRedeemPoints(!redeemPoints)}
                  >
                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <Text style={styles.redeemTitle}>
                        {redeemPoints
                          ? "✓ Discount Applied"
                          : "Redeem Reward Points"}
                      </Text>

                      <Text style={styles.redeemSub}>
                        Save ₹{pointsDiscountValue} on this order.
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.redeemSwitch,
                        redeemPoints && styles.redeemSwitchActive,
                      ]}
                    >
                      <Text style={styles.redeemSwitchText}>
                        {redeemPoints ? "ON" : "OFF"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.notEnoughPointsText}>
                    Earn 1 point for every ₹1 spent on delivered orders.
                  </Text>
                )}
              </View>

              {/* REWARD VOUCHER */}
              {activeRewardVouchers.length > 0 && (
                <View style={styles.checkoutSectionCard}>
                  <View style={styles.sectionCardHeader}>
                    <Text style={styles.sectionCardTitle}>
                      Apply a Reward Voucher
                    </Text>
                  </View>

                  {activeRewardVouchers.map((reward) => {
                    const isApplied = appliedRewardId === reward.id;

                    return (
                      <TouchableOpacity
                        key={reward.id}
                        style={[
                          styles.redeemPointsRow,
                          isApplied && styles.redeemPointsRowActive,
                          { marginBottom: 8 },
                        ]}
                        onPress={() =>
                          setAppliedRewardId(isApplied ? null : reward.id)
                        }
                      >
                        <View
                          style={{
                            flex: 1,
                          }}
                        >
                          <Text style={styles.redeemTitle}>
                            {isApplied ? "✓ Applied" : reward.title}
                          </Text>

                          <Text style={styles.redeemSub}>
                            Save {formatCurrency(reward.discountValue)} on this
                            order.
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.redeemSwitch,
                            isApplied && styles.redeemSwitchActive,
                          ]}
                        >
                          <Text style={styles.redeemSwitchText}>
                            {isApplied ? "ON" : "APPLY"}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* PAYMENT */}
              <View style={styles.checkoutSectionCard}>
                <Text style={styles.sectionCardTitle}>Payment Method</Text>

                <Text style={styles.demoPaymentText}>Demo payment only</Text>

                <View style={styles.paymentMethodRow}>
                  {(
                    [
                      {
                        id: "UPI",
                        label: "📱 UPI / QR",
                      },
                      {
                        id: "Card",
                        label: "💳 Card",
                      },
                      {
                        id: "COD",
                        label: "💵 COD",
                      },
                    ] as const
                  ).map((method) => (
                    <TouchableOpacity
                      key={method.id}
                      style={[
                        styles.paymentChip,
                        paymentMode === method.id && styles.paymentChipActive,
                      ]}
                      onPress={() => setPaymentMode(method.id)}
                    >
                      <Text
                        style={[
                          styles.paymentChipText,
                          paymentMode === method.id &&
                            styles.paymentChipTextActive,
                        ]}
                      >
                        {method.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* BILL */}
              <View style={styles.checkoutSectionCard}>
                <Text style={styles.sectionCardTitle}>Bill Summary</Text>

                <View style={styles.billLine}>
                  <Text style={styles.billLabel}>Item Total</Text>

                  <Text style={styles.billValue}>
                    {formatCurrency(bill.subtotal)}
                  </Text>
                </View>

                {pointsDiscountValue > 0 && (
                  <View style={styles.billLine}>
                    <Text
                      style={[
                        styles.billLabel,
                        {
                          color: "#48BB78",
                        },
                      ]}
                    >
                      Rewards Discount
                    </Text>

                    <Text
                      style={[
                        styles.billValue,
                        {
                          color: "#48BB78",
                        },
                      ]}
                    >
                      −{formatCurrency(pointsDiscountValue)}
                    </Text>
                  </View>
                )}

                {bill.voucherDiscountAmount > 0 && (
                  <View style={styles.billLine}>
                    <Text
                      style={[
                        styles.billLabel,
                        {
                          color: "#48BB78",
                        },
                      ]}
                    >
                      Voucher Discount
                    </Text>

                    <Text
                      style={[
                        styles.billValue,
                        {
                          color: "#48BB78",
                        },
                      ]}
                    >
                      −{formatCurrency(bill.voucherDiscountAmount)}
                    </Text>
                  </View>
                )}

                <View style={styles.billLine}>
                  <Text style={styles.billLabel}>Delivery Fee</Text>

                  <Text
                    style={[
                      styles.billValue,
                      deliveryFee === 0 && {
                        color: "#48BB78",
                      },
                    ]}
                  >
                    {deliveryFee === 0 ? "FREE" : formatCurrency(deliveryFee)}
                  </Text>
                </View>

                <View style={styles.billLine}>
                  <Text style={styles.billLabel}>Restaurant GST (5%)</Text>

                  <Text style={styles.billValue}>
                    +{formatCurrency(bill.taxAmount)}
                  </Text>
                </View>

                <View style={styles.billDivider} />

                <View style={styles.billLine}>
                  <Text style={styles.billGrandLabel}>To Pay</Text>

                  <Text style={styles.billGrandValue}>
                    {formatCurrency(bill.grandTotal)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.payNowBtn,
                    isPlacingOrder && {
                      opacity: 0.6,
                    },
                  ]}
                  onPress={handlePlaceOrder}
                  disabled={isPlacingOrder}
                  activeOpacity={0.85}
                >
                  {isPlacingOrder ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.payNowBtnText}>
                      Place Order • {formatCurrency(bill.grandTotal)} →
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={{ height: 110 }} />
        </ScrollView>
      )}

      {/* =====================================================
          TRACKING
      ===================================================== */}

      {activeTab === "track" && (
        <ScrollView
          style={styles.flexOne}
          contentContainerStyle={styles.trackScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {currentOrder ? (
            <>
              <View style={styles.trackingHeroCard}>
                <View style={styles.trackingHeroTop}>
                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text style={styles.trackingOrderNum}>
                      Order #
                      {currentOrder.orderNumber || currentOrder.id.slice(-6)}
                    </Text>

                    <Text style={styles.trackingDate}>
                      {currentOrder.createdAt
                        ? new Date(currentOrder.createdAt).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </Text>
                  </View>

                  <View style={styles.stageEmojiBadge}>
                    <Text
                      style={{
                        fontSize: 28,
                      }}
                    >
                      {isCancelled ? "❌" : currentStage.emoji}
                    </Text>
                  </View>
                </View>

                <Text style={styles.currentStageTitle}>
                  {isCancelled ? "Order Cancelled" : currentStage.title}
                </Text>

                <Text style={styles.currentStageDesc}>
                  {isCancelled
                    ? "This order was cancelled by the restaurant."
                    : currentStage.desc}
                </Text>

                {!isCancelled && (
                  <View style={styles.stageTrackBar}>
                    <View
                      style={[
                        styles.stageFillBar,
                        {
                          width: `${
                            ((currentStageIdx + 1) / TRACKING_STAGES.length) *
                            100
                          }%`,
                        },
                      ]}
                    />
                  </View>
                )}

                <View style={styles.liveStatusRow}>
                  <View style={styles.liveStatusDot} />

                  <Text style={styles.liveStatusText}>
                    {isRefreshingOrder
                      ? "Updating order status..."
                      : `Live status: ${getOrderStatusLabel(
                          currentOrder.status,
                        )}`}
                  </Text>
                </View>

                <View style={styles.trackingActionRow}>
                  <TouchableOpacity
                    style={styles.refreshOrderBtn}
                    onPress={() => void fetchLiveOrder(currentOrder.id)}
                    disabled={isRefreshingOrder}
                  >
                    {isRefreshingOrder ? (
                      <ActivityIndicator size="small" color="#E29074" />
                    ) : (
                      <Text style={styles.refreshOrderText}>
                        ↻ Refresh Status
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.backToMenuOutlineBtn}
                    onPress={() => setActiveTab("menu")}
                  >
                    <Text style={styles.backToMenuOutlineText}>← Menu</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* TIMELINE */}
              <View style={styles.timelineCard}>
                <Text style={styles.timelineTitle}>Order Progress</Text>

                {TRACKING_STAGES.map((stage, index) => {
                  const isDone = !isCancelled && index <= currentStageIdx;

                  const isCurrent = !isCancelled && index === currentStageIdx;

                  return (
                    <View key={stage.key} style={styles.milestoneRow}>
                      <View style={styles.milestoneLeft}>
                        <View
                          style={[
                            styles.milestoneDot,
                            isDone && styles.milestoneDotDone,
                            isCurrent && styles.milestoneDotCurrent,
                          ]}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              color: "#FFFFFF",
                            }}
                          >
                            {isDone ? "✓" : ""}
                          </Text>
                        </View>

                        {index < TRACKING_STAGES.length - 1 && (
                          <View
                            style={[
                              styles.milestoneConnector,
                              index < currentStageIdx &&
                                styles.milestoneConnectorDone,
                            ]}
                          />
                        )}
                      </View>

                      <View style={styles.milestoneRight}>
                        <Text
                          style={[
                            styles.milestoneLabel,
                            isDone && styles.milestoneLabelDone,
                            isCurrent && styles.milestoneLabelCurrent,
                          ]}
                        >
                          {stage.title} {stage.emoji}
                        </Text>

                        <Text style={styles.milestoneDesc}>{stage.desc}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* DELIVERY ADDRESS */}
              <View style={styles.timelineCard}>
                <Text style={styles.timelineTitle}>Delivery Address</Text>

                <Text style={styles.deliveryAddressTrack}>
                  📍{" "}
                  {(currentOrder.details as any)?.delivery?.address ||
                    deliveryAddress ||
                    "Address not available"}
                </Text>
              </View>

              {/* ORDER ITEMS */}
              <View style={styles.timelineCard}>
                <Text style={styles.timelineTitle}>Ordered Items</Text>

                {currentOrder.items?.map((item, index) => (
                  <View key={index} style={styles.trackItemRow}>
                    <Text style={styles.trackItemName}>
                      {item.quantity}x {item.name || item.id}
                    </Text>

                    <Text style={styles.trackItemPrice}>
                      {formatCurrency((item.price || 0) * (item.quantity || 1))}
                    </Text>
                  </View>
                ))}

                <View style={styles.billDivider} />

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={styles.billGrandLabel}>Total</Text>

                  <Text style={styles.billGrandValue}>
                    {formatCurrency(currentOrder.totals?.grandTotal || 0)}
                  </Text>
                </View>
              </View>

              {isCompleted && (
                <View style={styles.completedMessageCard}>
                  <Text style={styles.completedEmoji}>🎉</Text>

                  <Text style={styles.completedTitle}>Order Delivered</Text>

                  <Text style={styles.completedDesc}>
                    Your order has been marked completed by the restaurant.
                    Reward points are based on this delivered order.
                  </Text>
                </View>
              )}

              {isCancelled && (
                <View style={styles.cancelledMessageCard}>
                  <Text style={styles.completedEmoji}>❌</Text>

                  <Text style={styles.completedTitle}>Order Cancelled</Text>

                  <Text style={styles.completedDesc}>
                    This order is no longer active.
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🛵</Text>

              <Text style={styles.emptyTitle}>No order to track</Text>

              <Text style={styles.emptyDesc}>
                Place an order from the menu and it will appear here.
              </Text>

              <TouchableOpacity
                style={styles.backToMenuBtn}
                onPress={() => setActiveTab("menu")}
              >
                <Text style={styles.backToMenuBtnText}>Order Food</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 110 }} />
        </ScrollView>
      )}

      {/* =====================================================
          REWARDS
      ===================================================== */}

      {activeTab === "rewards" && (
        <ScrollView
          style={styles.flexOne}
          contentContainerStyle={styles.rewardsScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.rewardsHeroCard}>
            <Text style={styles.rewardsHeroBadge}>BHOJANHUB REWARDS</Text>

            <Text style={styles.rewardsHeroPoints}>⭐ {customerPoints}</Text>

            <Text style={styles.rewardsHeroSub}>Total earned points</Text>

            <View style={styles.rewardsRuleBox}>
              <Text style={styles.rewardsRuleText}>
                💡 ₹1 spent = 1 point on completed orders.
              </Text>
            </View>
          </View>

          <View style={styles.rewardsInfoCard}>
            <Text style={styles.rewardsInfoTitle}>
              Your points are based on delivered orders
            </Text>

            <Text style={styles.rewardsInfoText}>
              Points are calculated from orders that are marked completed by the
              restaurant. You cannot manually add or complete an order from the
              customer app.
            </Text>
          </View>

          <View style={styles.rewardsCatalogSection}>
            <Text style={styles.catalogSectionTitle}>Reward Options</Text>

            {REWARD_CATALOG.map((reward) => {
              const canRedeem = customerPoints >= reward.cost;

              return (
                <View key={reward.id} style={styles.voucherCard}>
                  <View style={styles.voucherIconBox}>
                    <Text
                      style={{
                        fontSize: 26,
                      }}
                    >
                      {reward.emoji}
                    </Text>
                  </View>

                  <View
                    style={{
                      flex: 1,
                      marginLeft: 12,
                    }}
                  >
                    <Text style={styles.voucherTitle}>{reward.title}</Text>

                    <Text style={styles.voucherDesc}>{reward.desc}</Text>

                    <Text style={styles.voucherCost}>
                      ⭐ {reward.cost} points
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.voucherRedeemBtn,
                      !canRedeem && styles.voucherRedeemBtnDisabled,
                    ]}
                    onPress={() => handleRedeemReward(reward)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.voucherRedeemText}>
                      {canRedeem ? "Available" : "Locked"}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {redeemedRewards.length > 0 && (
            <View style={styles.rewardsCatalogSection}>
              <Text style={styles.catalogSectionTitle}>My Vouchers</Text>

              {redeemedRewards.map((reward) => (
                <View key={reward.id} style={styles.voucherCard}>
                  <View style={styles.voucherIconBox}>
                    <Text
                      style={{
                        fontSize: 22,
                      }}
                    >
                      🎟️
                    </Text>
                  </View>

                  <View
                    style={{
                      flex: 1,
                      marginLeft: 12,
                    }}
                  >
                    <Text style={styles.voucherTitle}>{reward.title}</Text>

                    <Text style={styles.voucherDesc}>
                      {reward.status === "used"
                        ? "Used on a previous order."
                        : "Ready — apply it at checkout."}
                    </Text>

                    <Text style={styles.voucherCost}>
                      {formatCurrency(reward.discountValue)} value
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.voucherRedeemBtn,
                      reward.status === "used" &&
                        styles.voucherRedeemBtnDisabled,
                    ]}
                  >
                    <Text style={styles.voucherRedeemText}>
                      {reward.status === "used" ? "Used" : "Active"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 110 }} />
        </ScrollView>
      )}

      {/* =====================================================
          PROFILE
      ===================================================== */}

      {activeTab === "profile" && (
        <ScrollView
          style={styles.flexOne}
          contentContainerStyle={styles.profileScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.customerProfileCard}>
            <View style={styles.profileAvatarBox}>
              <Text
                style={{
                  fontSize: 30,
                }}
              >
                👤
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                marginLeft: 14,
              }}
            >
              <Text style={styles.profileName}>
                {customer.name || "BhojanHub Customer"}
              </Text>

              <Text style={styles.profilePhone}>
                {customer.phone
                  ? `+91 ${customer.phone}`
                  : "Mobile number not added"}
              </Text>

              <Text style={styles.profileAddress} numberOfLines={2}>
                📍 {customer.address || "Delivery address not added"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => {
                setLoginName(customer.name);
                setLoginPhone(customer.phone);
                setShowLoginModal(true);
              }}
            >
              <Text style={styles.editProfileBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.customerStatsRow}>
            <View style={styles.cStatBox}>
              <Text style={styles.cStatVal}>{myOrders.length}</Text>

              <Text style={styles.cStatLbl}>Orders</Text>
            </View>

            <View style={styles.cStatBox}>
              <Text
                style={[
                  styles.cStatVal,
                  {
                    color: "#ECC94B",
                  },
                ]}
              >
                ⭐ {customerPoints}
              </Text>

              <Text style={styles.cStatLbl}>Reward Points</Text>
            </View>
          </View>

          {/* ORDER HISTORY */}
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>Your Orders</Text>

            {myOrders.length === 0 ? (
              <Text style={styles.noHistoryText}>
                You haven't placed any orders yet.
              </Text>
            ) : (
              myOrders.map((order) => (
                <View key={order.id} style={styles.historyItemRow}>
                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text style={styles.historyItemNum}>
                      Order #{order.orderNumber || order.id.slice(-6)}
                    </Text>

                    <Text style={styles.historyItemMeta}>
                      {order.items?.length || 0} items •{" "}
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })
                        : ""}
                    </Text>

                    <Text style={styles.historyItemStatus}>
                      Status:{" "}
                      <Text
                        style={{
                          color:
                            order.status === "completed"
                              ? "#48BB78"
                              : order.status === "cancelled"
                                ? "#E53E3E"
                                : "#ECC94B",
                          fontWeight: "700",
                        }}
                      >
                        {getOrderStatusLabel(order.status).toUpperCase()}
                      </Text>
                    </Text>
                  </View>

                  <View
                    style={{
                      alignItems: "flex-end",
                    }}
                  >
                    <Text style={styles.historyItemTotal}>
                      {formatCurrency(order.totals?.grandTotal || 0)}
                    </Text>

                    <TouchableOpacity
                      style={styles.trackOrderMiniBtn}
                      onPress={() => {
                        setCurrentOrder(order);

                        setActiveTab("track");
                      }}
                    >
                      <Text style={styles.trackOrderMiniBtnText}>Track →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* CUSTOMER ACCOUNT */}
          <View style={styles.accountActionCard}>
            <Text style={styles.accountActionTitle}>Customer Account</Text>

            <Text style={styles.accountActionDescription}>
              Sign out if you want to continue with another customer mobile
              number.
            </Text>

            <TouchableOpacity
              style={styles.switchCustomerBtn}
              onPress={handleCustomerSignOut}
            >
              <Text style={styles.switchCustomerBtnText}>Switch Customer</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.restaurantButton}
            onPress={handleSwitchToRestaurant}
            activeOpacity={0.85}
          >
            <Text style={styles.restaurantButtonText}>
              Switch to Restaurant
            </Text>
          </TouchableOpacity>

          <View style={{ height: 110 }} />
        </ScrollView>
      )}

      {/* =====================================================
          CUSTOMER BOTTOM NAVIGATION
      ===================================================== */}

      <View style={styles.customerBottomNav}>
        <TouchableOpacity
          style={styles.navTabBtn}
          onPress={() => setActiveTab("menu")}
        >
          <Text
            style={[
              styles.navTabIcon,
              activeTab === "menu" && styles.navTabActive,
            ]}
          >
            🍽️
          </Text>

          <Text
            style={[
              styles.navTabLabel,
              activeTab === "menu" && styles.navTabActive,
            ]}
          >
            Menu
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTabBtn}
          onPress={() => setActiveTab("cart")}
        >
          <View>
            <Text
              style={[
                styles.navTabIcon,
                activeTab === "cart" && styles.navTabActive,
              ]}
            >
              🛍️
            </Text>

            {totalCartCount > 0 && (
              <View style={styles.navBadge}>
                <Text style={styles.navBadgeText}>{totalCartCount}</Text>
              </View>
            )}
          </View>

          <Text
            style={[
              styles.navTabLabel,
              activeTab === "cart" && styles.navTabActive,
            ]}
          >
            Cart
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTabBtn}
          onPress={() => setActiveTab("track")}
        >
          <Text
            style={[
              styles.navTabIcon,
              activeTab === "track" && styles.navTabActive,
            ]}
          >
            🛵
          </Text>

          <Text
            style={[
              styles.navTabLabel,
              activeTab === "track" && styles.navTabActive,
            ]}
          >
            Orders
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTabBtn}
          onPress={() => setActiveTab("rewards")}
        >
          <Text
            style={[
              styles.navTabIcon,
              activeTab === "rewards" && styles.navTabActive,
            ]}
          >
            🎁
          </Text>

          <Text
            style={[
              styles.navTabLabel,
              activeTab === "rewards" && styles.navTabActive,
            ]}
          >
            Rewards
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTabBtn}
          onPress={() => setActiveTab("profile")}
        >
          <Text
            style={[
              styles.navTabIcon,
              activeTab === "profile" && styles.navTabActive,
            ]}
          >
            👤
          </Text>

          <Text
            style={[
              styles.navTabLabel,
              activeTab === "profile" && styles.navTabActive,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* =====================================================
          DELIVERY CELEBRATION
      ===================================================== */}

      <Modal
        visible={showCelebration}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCelebration(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.celebrationCard}>
            <Text style={styles.celebrationEmoji}>🎉 🍽️ 🎁</Text>

            <Text style={styles.celebrationTitle}>Order Delivered!</Text>

            <Text style={styles.celebrationSub}>
              Your restaurant order has been marked completed.
            </Text>

            <View style={styles.pointsEarnedBox}>
              <Text style={styles.pointsEarnedLabel}>POINTS EARNED</Text>

              <Text style={styles.pointsEarnedNumber}>
                +{celebrationPointsEarned}
              </Text>

              <Text style={styles.pointsEarnedSub}>
                Based on this delivered order ⭐
              </Text>
            </View>

            <TouchableOpacity
              style={styles.claimPointsBtn}
              onPress={() => {
                setShowCelebration(false);
                setActiveTab("rewards");
              }}
            >
              <Text style={styles.claimPointsBtnText}>View Rewards</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* =====================================================
          CUSTOMER LOGIN
      ===================================================== */}

      <Modal
        visible={showLoginModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (customer.isLoggedIn) {
            setShowLoginModal(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.loginCard}>
            <View style={styles.loginBrandIcon}>
              <Text
                style={{
                  fontSize: 22,
                }}
              >
                🍽️
              </Text>
            </View>

            <Text style={styles.loginTitle}>Welcome to BhojanHub</Text>

            <Text style={styles.loginSubtitle}>
              Enter your name and mobile number to order food and track your
              orders.
            </Text>

            <Text style={styles.fieldLabel}>Full Name</Text>

            <TextInput
              style={styles.loginInput}
              placeholder="Your full name"
              placeholderTextColor="#998377"
              value={loginName}
              onChangeText={setLoginName}
              editable
              autoCapitalize="words"
            />

            <Text style={styles.fieldLabel}>Mobile Number</Text>

            <TextInput
              style={styles.loginInput}
              placeholder="10-digit mobile number"
              placeholderTextColor="#998377"
              keyboardType="phone-pad"
              maxLength={10}
              value={loginPhone}
              onChangeText={setLoginPhone}
            />

            <View style={styles.modalActionRow}>
              {customer.isLoggedIn && (
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => {
                    setShowLoginModal(false);

                    setLoginName("");
                    setLoginPhone("");
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleCustomerLogin}
              >
                <Text style={styles.modalConfirmText}>Continue →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  // =========================================================
  // HEADER
  // =========================================================

  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2C1411",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 44 : 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#42201C",
  },

  topHeaderLeft: {
    flex: 1,
    marginRight: 10,
  },

  locationBar: {
    flexDirection: "row",
    alignItems: "center",
  },

  locationPin: {
    fontSize: 20,
    marginRight: 8,
  },

  locationTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#F3E9DC",
  },

  locationArrow: {
    fontSize: 11,
    color: "#E29074",
  },

  locationAddress: {
    fontSize: 11,
    color: "#A88F80",
    marginTop: 1,
  },

  rewardsPill: {
    backgroundColor: "#3A1A16",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ECC94B",
  },

  rewardsPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#ECC94B",
  },

  // =========================================================
  // MENU
  // =========================================================

  searchVegRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 10,
  },

  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2C1411",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4A2520",
    paddingHorizontal: 10,
    height: 40,
  },

  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },

  searchInput: {
    flex: 1,
    color: "#F3E9DC",
    fontSize: 13,
  },

  searchClear: {
    color: "#BCA393",
    padding: 4,
  },

  vegFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2C1411",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4A2520",
  },

  vegFilterBtnActive: {
    backgroundColor: "#1B3821",
    borderColor: "#48BB78",
  },

  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#A88F80",
    marginRight: 6,
  },

  vegDotActive: {
    backgroundColor: "#48BB78",
  },

  vegFilterText: {
    fontSize: 11,
    color: "#BCA393",
    fontWeight: "600",
  },

  vegFilterTextActive: {
    color: "#48BB78",
    fontWeight: "700",
  },

  categoriesWrapper: {
    marginTop: 8,
  },

  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },

  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: "#2C1411",
    borderWidth: 1,
    borderColor: "#4A2520",
  },

  catChipActive: {
    backgroundColor: "#C93E2B",
    borderColor: "#C93E2B",
  },

  catChipText: {
    fontSize: 12,
    color: "#D1BBA2",
    fontWeight: "500",
  },

  catChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  menuScrollList: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 12,
  },

  heroPromo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3A1A16",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#C93E2B",
    marginBottom: 4,
  },

  heroPromoBadge: {
    fontSize: 10,
    fontWeight: "900",
    color: "#ECC94B",
    letterSpacing: 0.5,
  },

  heroPromoTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#F3E9DC",
    marginTop: 2,
  },

  heroPromoSub: {
    fontSize: 11,
    color: "#D1BBA2",
    marginTop: 2,
  },

  heroPromoEmoji: {
    fontSize: 38,
    marginLeft: 8,
  },

  consumerDishCard: {
    flexDirection: "row",
    backgroundColor: "#2A1210",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#44211D",
  },

  dishDetailsCol: {
    flex: 1,
    marginRight: 12,
  },

  vegIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },

  vegSymbolBox: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },

  vegSymbolBoxGreen: {
    borderColor: "#48BB78",
  },

  vegSymbolBoxRed: {
    borderColor: "#E53E3E",
  },

  vegSymbolDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  vegSymbolDotGreen: {
    backgroundColor: "#48BB78",
  },

  vegSymbolDotRed: {
    backgroundColor: "#E53E3E",
  },

  dishCategoryTag: {
    fontSize: 11,
    color: "#E29074",
    fontWeight: "600",
  },

  consumerDishTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F3E9DC",
  },

  consumerDishPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 4,
  },

  consumerDishDesc: {
    fontSize: 12,
    color: "#A88F80",
    marginTop: 4,
    lineHeight: 16,
  },

  dishVisualCol: {
    width: 90,
    alignItems: "center",
    justifyContent: "space-between",
  },

  dishEmojiContainer: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: "#3A1A16",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#4A2520",
  },

  dishLargeEmoji: {
    fontSize: 38,
  },

  customerAddBtn: {
    backgroundColor: "#3A1A16",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C93E2B",
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 8,
  },

  customerAddBtnText: {
    color: "#E29074",
    fontSize: 12,
    fontWeight: "800",
  },

  customerStepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3A1A16",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C93E2B",
    marginTop: 8,
  },

  customerStepperBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  customerStepperText: {
    color: "#F3E9DC",
    fontSize: 15,
    fontWeight: "700",
  },

  customerStepperQty: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    minWidth: 16,
    textAlign: "center",
  },

  floatingCartBar: {
    position: "absolute",
    bottom: 74,
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
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },

  floatingCartQty: {
    fontSize: 11,
    color: "#D1BBA2",
  },

  floatingCartPrice: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  floatingCheckoutBtn: {
    backgroundColor: "#C93E2B",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },

  floatingCheckoutText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  // =========================================================
  // CHECKOUT
  // =========================================================

  checkoutScrollContent: {
    padding: 16,
    gap: 16,
  },

  checkoutSectionCard: {
    backgroundColor: "#2A1210",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#44211D",
  },

  sectionCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F3E9DC",
  },

  linkAddMore: {
    color: "#E29074",
    fontSize: 12,
    fontWeight: "600",
  },

  basketItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#381714",
  },

  basketItemEmoji: {
    fontSize: 26,
  },

  basketItemName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F3E9DC",
  },

  basketItemPrice: {
    fontSize: 11,
    color: "#A88F80",
    marginTop: 2,
  },

  basketItemTotal: {
    fontSize: 13,
    fontWeight: "700",
    color: "#E29074",
    marginLeft: 10,
    minWidth: 50,
    textAlign: "right",
  },

  cookingNotesBox: {
    marginTop: 12,
  },

  cookingNotesLabel: {
    fontSize: 12,
    color: "#D1BBA2",
    marginBottom: 6,
  },

  cookingNotesInput: {
    backgroundColor: "#1F0E0C",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4A2520",
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: "#F3E9DC",
    fontSize: 12,
  },

  gpsButton: {
    backgroundColor: "#3A1A16",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#C93E2B",
  },

  gpsButtonText: {
    color: "#E29074",
    fontSize: 11,
    fontWeight: "700",
  },

  inputFieldLabel: {
    fontSize: 12,
    color: "#D1BBA2",
    marginTop: 8,
    marginBottom: 4,
  },

  checkoutInput: {
    backgroundColor: "#1F0E0C",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4A2520",
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#F3E9DC",
    fontSize: 13,
  },

  rewardsBalanceBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ECC94B",
  },

  redeemPointsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#381714",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4A2520",
  },

  redeemPointsRowActive: {
    borderColor: "#2E7D32",
    backgroundColor: "#1B3821",
  },

  redeemTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F3E9DC",
  },

  redeemSub: {
    fontSize: 11,
    color: "#A88F80",
    marginTop: 2,
  },

  redeemSwitch: {
    backgroundColor: "#3A1A16",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },

  redeemSwitchActive: {
    backgroundColor: "#2E7D32",
  },

  redeemSwitchText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },

  notEnoughPointsText: {
    fontSize: 12,
    color: "#A88F80",
    lineHeight: 16,
  },

  demoPaymentText: {
    fontSize: 11,
    color: "#A88F80",
    marginTop: 3,
    marginBottom: 6,
  },

  paymentMethodRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },

  paymentChip: {
    flex: 1,
    backgroundColor: "#381714",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4A2520",
  },

  paymentChipActive: {
    backgroundColor: "#C93E2B",
    borderColor: "#C93E2B",
  },

  paymentChipText: {
    fontSize: 11,
    color: "#BCA393",
    fontWeight: "600",
  },

  paymentChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  billLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },

  billLabel: {
    fontSize: 13,
    color: "#A88F80",
  },

  billValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#F3E9DC",
  },

  billDivider: {
    height: 1,
    backgroundColor: "#3A1A16",
    marginVertical: 8,
  },

  billGrandLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F3E9DC",
  },

  billGrandValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#E29074",
  },

  payNowBtn: {
    backgroundColor: "#C93E2B",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 14,
  },

  payNowBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  emptyCartBox: {
    alignItems: "center",
    paddingVertical: 60,
  },

  emptyCartEmoji: {
    fontSize: 50,
    marginBottom: 10,
  },

  emptyCartTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F3E9DC",
  },

  emptyCartSub: {
    fontSize: 13,
    color: "#A88F80",
    marginTop: 4,
    textAlign: "center",
    maxWidth: "80%",
  },

  backToMenuBtn: {
    backgroundColor: "#C93E2B",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 16,
  },

  backToMenuBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  // for switching into restuarant mode
  restaurantButton: {
    marginTop: 12,
    marginBottom: 20,
    backgroundColor: "#3A1A16",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },

  restaurantButtonText: {
    color: "#F3E9DC",
    fontSize: 14,
    fontWeight: "700",
  },

  // =========================================================
  // TRACKING
  // =========================================================

  trackScrollContent: {
    padding: 16,
    gap: 16,
  },

  trackingHeroCard: {
    backgroundColor: "#2A1210",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#44211D",
  },

  trackingHeroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  trackingOrderNum: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F3E9DC",
  },

  trackingDate: {
    fontSize: 11,
    color: "#A88F80",
    marginTop: 3,
  },

  stageEmojiBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3A1A16",
    alignItems: "center",
    justifyContent: "center",
  },

  currentStageTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#E29074",
    marginTop: 12,
  },

  currentStageDesc: {
    fontSize: 12,
    color: "#A88F80",
    marginTop: 2,
    lineHeight: 17,
  },

  stageTrackBar: {
    height: 6,
    backgroundColor: "#3A1A16",
    borderRadius: 3,
    marginTop: 14,
    overflow: "hidden",
  },

  stageFillBar: {
    height: "100%",
    backgroundColor: "#C93E2B",
    borderRadius: 3,
  },

  liveStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },

  liveStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#48BB78",
    marginRight: 7,
  },

  liveStatusText: {
    fontSize: 11,
    color: "#D1BBA2",
    fontWeight: "600",
  },

  trackingActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },

  refreshOrderBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#381714",
    borderWidth: 1,
    borderColor: "#C93E2B",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  refreshOrderText: {
    color: "#E29074",
    fontSize: 11,
    fontWeight: "700",
  },

  backToMenuOutlineBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#2A1210",
    borderWidth: 1,
    borderColor: "#4A2520",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  backToMenuOutlineText: {
    color: "#D1BBA2",
    fontSize: 11,
    fontWeight: "700",
  },

  timelineCard: {
    backgroundColor: "#2A1210",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#44211D",
  },

  timelineTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F3E9DC",
    marginBottom: 14,
  },

  milestoneRow: {
    flexDirection: "row",
    minHeight: 62,
  },

  milestoneLeft: {
    alignItems: "center",
    width: 24,
  },

  milestoneDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#381714",
    borderWidth: 1,
    borderColor: "#4A2520",
    alignItems: "center",
    justifyContent: "center",
  },

  milestoneDotDone: {
    backgroundColor: "#2E7D32",
    borderColor: "#48BB78",
  },

  milestoneDotCurrent: {
    borderColor: "#ECC94B",
    backgroundColor: "#C93E2B",
  },

  milestoneConnector: {
    width: 2,
    flex: 1,
    backgroundColor: "#381714",
    marginVertical: 2,
  },

  milestoneConnectorDone: {
    backgroundColor: "#2E7D32",
  },

  milestoneRight: {
    flex: 1,
    marginLeft: 10,
    paddingBottom: 10,
  },

  milestoneLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#7D6258",
  },

  milestoneLabelDone: {
    color: "#F3E9DC",
  },

  milestoneLabelCurrent: {
    color: "#E29074",
    fontWeight: "800",
  },

  milestoneDesc: {
    fontSize: 11,
    color: "#A88F80",
    marginTop: 1,
    lineHeight: 16,
  },

  deliveryAddressTrack: {
    fontSize: 13,
    color: "#D1BBA2",
    lineHeight: 19,
  },

  trackItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 3,
  },

  trackItemName: {
    fontSize: 13,
    color: "#F3E9DC",
    flex: 1,
  },

  trackItemPrice: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E29074",
  },

  completedMessageCard: {
    backgroundColor: "#18351F",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#48BB78",
  },

  cancelledMessageCard: {
    backgroundColor: "#351717",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E53E3E",
  },

  completedEmoji: {
    fontSize: 38,
    marginBottom: 6,
  },

  completedTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F3E9DC",
  },

  completedDesc: {
    fontSize: 12,
    color: "#D1BBA2",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 17,
  },

  // =========================================================
  // REWARDS
  // =========================================================

  rewardsScrollContent: {
    padding: 16,
    gap: 16,
  },

  rewardsHeroCard: {
    backgroundColor: "#2A1210",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ECC94B",
  },

  rewardsHeroBadge: {
    fontSize: 11,
    fontWeight: "800",
    color: "#ECC94B",
    letterSpacing: 1,
  },

  rewardsHeroPoints: {
    fontSize: 42,
    fontWeight: "900",
    color: "#F3E9DC",
    marginTop: 6,
  },

  rewardsHeroSub: {
    fontSize: 12,
    color: "#A88F80",
    marginTop: 2,
  },

  rewardsRuleBox: {
    backgroundColor: "#3A1A16",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 14,
  },

  rewardsRuleText: {
    fontSize: 12,
    color: "#F3E9DC",
    fontWeight: "600",
  },

  rewardsInfoCard: {
    backgroundColor: "#2A1210",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#44211D",
  },

  rewardsInfoTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#F3E9DC",
  },

  rewardsInfoText: {
    fontSize: 12,
    color: "#A88F80",
    marginTop: 5,
    lineHeight: 18,
  },

  rewardsCatalogSection: {
    gap: 12,
  },

  catalogSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F3E9DC",
  },

  voucherCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A1210",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#44211D",
  },

  voucherIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#3A1A16",
    alignItems: "center",
    justifyContent: "center",
  },

  voucherTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F3E9DC",
  },

  voucherDesc: {
    fontSize: 11,
    color: "#A88F80",
    marginTop: 2,
  },

  voucherCost: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ECC94B",
    marginTop: 4,
  },

  voucherRedeemBtn: {
    backgroundColor: "#C93E2B",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },

  voucherRedeemBtnDisabled: {
    backgroundColor: "#381714",
  },

  voucherRedeemText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },

  // =========================================================
  // PROFILE
  // =========================================================

  profileScrollContent: {
    padding: 16,
    gap: 16,
  },

  customerProfileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A1210",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#44211D",
  },

  profileAvatarBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#3A1A16",
    alignItems: "center",
    justifyContent: "center",
  },

  profileName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F3E9DC",
  },

  profilePhone: {
    fontSize: 12,
    color: "#A88F80",
    marginTop: 2,
  },

  profileAddress: {
    fontSize: 11,
    color: "#D1BBA2",
    marginTop: 4,
  },

  editProfileBtn: {
    backgroundColor: "#381714",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },

  editProfileBtnText: {
    color: "#E29074",
    fontSize: 11,
    fontWeight: "700",
  },

  customerStatsRow: {
    flexDirection: "row",
    gap: 12,
  },

  cStatBox: {
    flex: 1,
    backgroundColor: "#2A1210",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#44211D",
  },

  cStatVal: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F3E9DC",
  },

  cStatLbl: {
    fontSize: 11,
    color: "#A88F80",
    marginTop: 2,
  },

  historyCard: {
    backgroundColor: "#2A1210",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#44211D",
  },

  historyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F3E9DC",
    marginBottom: 10,
  },

  noHistoryText: {
    fontSize: 12,
    color: "#A88F80",
    fontStyle: "italic",
    paddingVertical: 10,
  },

  historyItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#381714",
  },

  historyItemNum: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F3E9DC",
  },

  historyItemMeta: {
    fontSize: 11,
    color: "#A88F80",
    marginTop: 2,
  },

  historyItemStatus: {
    fontSize: 11,
    color: "#D1BBA2",
    marginTop: 2,
  },

  historyItemTotal: {
    fontSize: 14,
    fontWeight: "800",
    color: "#E29074",
  },

  trackOrderMiniBtn: {
    backgroundColor: "#3A1A16",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#C93E2B",
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },

  trackOrderMiniBtnText: {
    color: "#E29074",
    fontSize: 11,
    fontWeight: "700",
  },

  accountActionCard: {
    backgroundColor: "#2A1210",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#44211D",
  },

  accountActionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#F3E9DC",
  },

  accountActionDescription: {
    fontSize: 12,
    color: "#A88F80",
    marginTop: 5,
    lineHeight: 17,
  },

  switchCustomerBtn: {
    marginTop: 14,
    backgroundColor: "#381714",
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#C93E2B",
    paddingVertical: 10,
    alignItems: "center",
  },

  switchCustomerBtnText: {
    color: "#E29074",
    fontSize: 12,
    fontWeight: "800",
  },

  // =========================================================
  // BOTTOM NAV
  // =========================================================

  customerBottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: "#26100E",
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#42201C",
    paddingBottom: Platform.OS === "ios" ? 16 : 4,
  },

  navTabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  navTabIcon: {
    fontSize: 18,
    opacity: 0.6,
  },

  navTabLabel: {
    fontSize: 10,
    color: "#A88F80",
    marginTop: 2,
  },

  navTabActive: {
    opacity: 1,
    color: "#F3E9DC",
    fontWeight: "700",
  },

  navBadge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: "#C93E2B",
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  navBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },

  // =========================================================
  // MODALS
  // =========================================================

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: 20,
  },

  celebrationCard: {
    backgroundColor: "#26100E",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ECC94B",
  },

  celebrationEmoji: {
    fontSize: 44,
    marginBottom: 8,
  },

  celebrationTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#F3E9DC",
  },

  celebrationSub: {
    fontSize: 13,
    color: "#A88F80",
    marginTop: 4,
    textAlign: "center",
  },

  pointsEarnedBox: {
    backgroundColor: "#3A1A16",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginVertical: 18,
    width: "100%",
    borderWidth: 1,
    borderColor: "#ECC94B",
  },

  pointsEarnedLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#ECC94B",
    letterSpacing: 1,
  },

  pointsEarnedNumber: {
    fontSize: 36,
    fontWeight: "900",
    color: "#F3E9DC",
    marginVertical: 2,
  },

  pointsEarnedSub: {
    fontSize: 12,
    color: "#D1BBA2",
  },

  claimPointsBtn: {
    backgroundColor: "#C93E2B",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
  },

  claimPointsBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  loginCard: {
    backgroundColor: "#26100E",
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: "#4A2520",
  },

  loginBrandIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3A1A16",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  loginTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#F3E9DC",
  },

  loginSubtitle: {
    fontSize: 12,
    color: "#A88F80",
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 17,
  },

  fieldLabel: {
    fontSize: 12,
    color: "#D1BBA2",
    marginBottom: 4,
    marginTop: 6,
  },

  loginInput: {
    backgroundColor: "#1F0E0C",
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#4A2520",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#F3E9DC",
    fontSize: 13,
  },

  modalActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 18,
  },

  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: "#381714",
  },

  modalCancelText: {
    color: "#BCA393",
    fontSize: 12,
    fontWeight: "600",
  },

  modalConfirmBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: "#C93E2B",
  },

  modalConfirmText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  // =========================================================
  // EMPTY STATES
  // =========================================================

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
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
