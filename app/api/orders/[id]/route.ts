import {
  deleteOrder,
  getAllOrders,
  getOrderById,
  holdOrder,
  resumeOrder,
  updateOrderStatus,
} from "@/lib/data/orderRepository";
import { deductStockForOrder } from "@/lib/data/inventoryRepository";
import {
  freeTableForOrder,
  occupyTableForOrder,
} from "@/lib/data/tableRepository";
import { addLoyaltyPoints } from "@/lib/data/customerRepository";
import type { ApiError, OrderResponse, OrderStatus } from "@/types/pos";

const error = (message: string, status = 400) =>
  Response.json({ error: message } satisfies ApiError, { status });

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  let order = await getOrderById(params.id);
  if (!order) {
    const orders = await getAllOrders();
    order = orders.find((entry) => String(entry.orderNumber) === params.id);
  }
  if (!order) return error("Order not found.", 404);
  return Response.json({ order } satisfies OrderResponse);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  let body: { status?: OrderStatus };
  try {
    body = (await request.json()) as { status?: OrderStatus };
  } catch {
    return error("Request body must be valid JSON.");
  }
  if (
    !body.status ||
    !["open", "held", "completed", "cancelled"].includes(body.status)
  )
    return error("Invalid order status.");
  let existing = await getOrderById(params.id);
  if (!existing) {
    const orders = await getAllOrders();
    existing = orders.find((entry) => String(entry.orderNumber) === params.id);
  }
  if (!existing) return error("Order not found.", 404);
  const targetId = existing.id;
  const order =
    body.status === "held"
      ? await holdOrder(targetId)
      : body.status === "open"
        ? await resumeOrder(targetId)
        : await updateOrderStatus(targetId, body.status);
  if (body.status === "completed" && existing.status !== "completed") {
    try {
      await deductStockForOrder(
        existing.items.map((item) => ({
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
    try {
      await deductStockForOrder(
        existing.items.map((item) => ({
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
    const phoneOrId = existing.customerId || existing.details.delivery?.phone;
    if (phoneOrId) {
      try {
        const points = Math.floor((existing.totals.grandTotal || 0) / 100);
        if (points > 0) {
          await addLoyaltyPoints(phoneOrId, points);
        }
      } catch (loyaltyError) {
        console.warn("Loyalty point accrual failed:", loyaltyError);
      }
    }
  }
  if (existing.details.type === "Dine In" && existing.details.table) {
    try {
      if (body.status === "completed" || body.status === "cancelled") {
        await freeTableForOrder(existing.details.table, existing.id);
      } else if (body.status === "held" || body.status === "open") {
        await occupyTableForOrder(existing.details.table, existing.id);
      }
    } catch (tableError) {
      console.warn("Table status sync failed after order update:", tableError);
    }
  }
  return Response.json({ order: order! } satisfies OrderResponse);
}
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  let order = await getOrderById(params.id);
  if (!order) {
    const orders = await getAllOrders();
    order = orders.find((entry) => String(entry.orderNumber) === params.id);
  }
  if (!order) return error("Order not found.", 404);
  if (order.status !== "held")
    return error("Only held orders can be discarded.");
  if (order.details.type === "Dine In" && order.details.table) {
    try {
      await freeTableForOrder(order.details.table, order.id);
    } catch (tableError) {
      console.warn("Table status sync failed after order discard:", tableError);
    }
  }
  await deleteOrder(order.id);
  return new Response(null, { status: 204 });
}
