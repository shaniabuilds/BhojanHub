import { calculateBill } from "@/lib/billing/calculateBill";
import { getMenuItemById } from "@/lib/data/menuRepository";
import { createOrder, getAllOrders } from "@/lib/data/orderRepository";
import { deductStockForOrder } from "@/lib/data/inventoryRepository";
import {
  freeTableForOrder,
  occupyTableForOrder,
} from "@/lib/data/tableRepository";
import { addLoyaltyPoints } from "@/lib/data/customerRepository";
import type {
  ApiError,
  CreateOrderRequest,
  OrderResponse,
  OrdersResponse,
  OrderStatus,
} from "@/types/pos";

const statuses: OrderStatus[] = ["open", "held", "completed", "cancelled"];

const DELIVERY_FEE = 40;
const FREE_DELIVERY_THRESHOLD = 199;

const error = (message: string, status = 400) =>
  Response.json({ error: message } satisfies ApiError, { status });

const isFiniteNonNegative = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const getDeliveryFee = (orderType: string, subtotal: number): number => {
  if (orderType !== "Delivery") {
    return 0;
  }

  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
};

export async function GET(request: Request) {
  const url = new URL(request.url);

  const status = url.searchParams.get("status");
  const phone = url.searchParams.get("phone");
  const customerId = url.searchParams.get("customerId");

  if (status && !statuses.includes(status as OrderStatus)) {
    return error("Invalid order status.");
  }

  const response: OrdersResponse = {
    orders: await getAllOrders({
      ...(status ? { status } : {}),
      ...(phone ? { phone } : {}),
      ...(customerId ? { customerId } : {}),
    }),
  };

  return Response.json(response);
}

export async function POST(request: Request) {
  let body: CreateOrderRequest;

  try {
    body = (await request.json()) as CreateOrderRequest;
  } catch {
    return error("Request body must be valid JSON.");
  }

  if (
    !body ||
    !Array.isArray(body.items) ||
    body.items.length === 0 ||
    !body.details ||
    !body.discount ||
    !body.totals
  ) {
    return error("Order items, details, discount, and totals are required.");
  }

  if (
    body.status &&
    body.status !== "open" &&
    body.status !== "held" &&
    body.status !== "completed"
  ) {
    return error("New orders may only be open, held, or completed.");
  }

  const targetStatus: OrderStatus = body.status ?? "completed";

  if (!["Dine In", "Takeaway", "Delivery"].includes(body.details.type)) {
    return error("Invalid order type.");
  }

  if (
    targetStatus === "completed" &&
    body.details.type === "Dine In" &&
    !body.details.table.trim()
  ) {
    return error("A table is required for completed dine-in orders.");
  }

  if (
    body.details.type === "Delivery" &&
    (!body.details.delivery?.name.trim() ||
      !body.details.delivery.phone.trim() ||
      !body.details.delivery.address.trim())
  ) {
    return error("Complete delivery details are required.");
  }

  if (
    (body.discount.kind !== "percent" && body.discount.kind !== "fixed") ||
    !isFiniteNonNegative(body.discount.value) ||
    !isFiniteNonNegative(body.taxRate) ||
    !isFiniteNonNegative(body.serviceRate) ||
    typeof body.serviceEnabled !== "boolean"
  ) {
    return error("Invalid billing values.");
  }

  if (
    body.paymentMethod &&
    !["Cash", "Card", "UPI"].includes(body.paymentMethod)
  ) {
    return error("Invalid payment method.");
  }

  if (targetStatus === "completed" && !body.paymentMethod) {
    return error("A payment method is required to complete an order.");
  }

  if (
    body.cashReceived !== undefined &&
    !isFiniteNonNegative(body.cashReceived)
  ) {
    return error("Invalid cash received amount.");
  }

  const items = [];

  for (const line of body.items) {
    if (
      !line ||
      typeof line.id !== "string" ||
      !Number.isInteger(line.quantity) ||
      line.quantity < 1
    ) {
      return error("Each item needs a valid id and quantity.");
    }

    const menuItem = await getMenuItemById(line.id);

    if (!menuItem) {
      return error(`Menu item '${line.id}' was not found.`);
    }

    items.push({
      ...menuItem,
      quantity: line.quantity,
    });
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const deliveryFee = getDeliveryFee(body.details.type, subtotal);

  const totals = calculateBill(
    items,
    body.discount,
    body.taxRate,
    body.serviceEnabled,
    body.serviceRate,
    deliveryFee,
  );

  const submitted = body.totals;

  const totalKeys = [
    "subtotal",
    "discountAmount",
    "taxableAmount",
    "taxAmount",
    "serviceCharge",
    "deliveryFee",
    "grandTotal",
  ] as const;

  if (
    !totalKeys.every(
      (key) =>
        isFiniteNonNegative(submitted[key]) && submitted[key] === totals[key],
    )
  ) {
    return error("Submitted totals do not match the server calculation.");
  }

  if (
    targetStatus === "completed" &&
    body.paymentMethod === "Cash" &&
    (!body.cashReceived || body.cashReceived < totals.grandTotal)
  ) {
    return error("Cash received must cover the total.");
  }

  const order = await createOrder({
    status: targetStatus,
    items,
    details: body.details,
    totals: {
      ...totals,
      discount: body.discount,
      taxRate: body.taxRate,
      serviceEnabled: body.serviceEnabled,
      serviceRate: body.serviceRate,
    },
    paymentMethod: body.paymentMethod,
    cashReceived: body.cashReceived,
    channel: body.channel,
    customerId: body.customerId,
  });

  if (order.status === "completed") {
    try {
      await deductStockForOrder(
        order.items.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
        })),
      );
    } catch (inventoryError) {
      console.warn(
        "Inventory stock deduction failed after order completion:",
        inventoryError,
      );
    }

    const phoneOrId = order.customerId || order.details.delivery?.phone;

    if (phoneOrId) {
      try {
        const points = Math.floor(order.totals.grandTotal || 0);

        if (points > 0) {
          await addLoyaltyPoints(phoneOrId, points);
        }
      } catch (loyaltyError) {
        console.warn("Loyalty point accrual failed:", loyaltyError);
      }
    }
  }

  if (order.details.type === "Dine In" && order.details.table) {
    try {
      if (order.status === "completed") {
        await freeTableForOrder(order.details.table, order.id);
      } else {
        await occupyTableForOrder(order.details.table, order.id);
      }
    } catch (tableError) {
      console.warn("Table sync failed after order creation:", tableError);
    }
  }

  const response: OrderResponse = {
    order,
  };

  return Response.json(response, {
    status: 201,
  });
}
