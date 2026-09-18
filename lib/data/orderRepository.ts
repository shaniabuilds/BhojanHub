
import { connectToDatabase } from "@/lib/db/mongodb";
import {
  CounterModel,
  OrderModel,
} from "@/lib/db/models";

import type {
  CartItem,
  OrderDetails,
  OrderStatus,
  OrderTotals,
  PaymentMethod,
  PosOrder,
} from "@/types/pos";

type OrderInput = {
  status: OrderStatus;
  items: CartItem[];
  details: OrderDetails;
  totals: OrderTotals;
  paymentMethod?: PaymentMethod;
  cashReceived?: number;
  channel?: "online" | "pos";
  customerId?: string;
};

const asOrder = (
  document: { toObject: () => unknown },
): PosOrder => document.toObject() as PosOrder;

async function getNextOrderNumber(): Promise<number> {
  const counter = await CounterModel.findOneAndUpdate(
    { key: "orderNumber" },
    { $inc: { value: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );

  return counter.value;
}

export async function createOrder(
  data: OrderInput,
): Promise<PosOrder> {
  await connectToDatabase();

  const orderNumber = await getNextOrderNumber();
  const now = new Date().toISOString();

  const order = await OrderModel.create({
    id: crypto.randomUUID(),
    orderNumber,
    createdAt: now,
    updatedAt: now,
    ...structuredClone(data),
  });

  return asOrder(order);
}

export async function getOrderById(
  id: string,
): Promise<PosOrder | undefined> {
  await connectToDatabase();

  const order = await OrderModel.findOne({ id });

  return order ? asOrder(order) : undefined;
}

export async function getAllOrders(filters?: {
  status?: string;
  phone?: string;
  customerId?: string;
}): Promise<PosOrder[]> {
  await connectToDatabase();

  const query: Record<string, unknown> = {};

  if (filters?.status) {
    query.status = filters.status;
  }

  if (filters?.customerId) {
    query.customerId = filters.customerId;
  }

  const orders = await OrderModel.find(query).sort({
    createdAt: -1,
  });

  let result = orders.map(asOrder);

  if (filters?.phone) {
    const targetPhone = filters.phone.replace(/\D/g, "");

    result = result.filter((order) => {
      const orderPhone = (
        order.details.delivery?.phone || ""
      ).replace(/\D/g, "");

      if (!orderPhone || targetPhone.length < 6) {
        return false;
      }

      return (
        orderPhone === targetPhone ||
        (orderPhone.length >= 6 &&
          (orderPhone.endsWith(targetPhone) ||
            targetPhone.endsWith(orderPhone)))
      );
    });
  }

  return result;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<PosOrder | undefined> {
  await connectToDatabase();

  const order = await OrderModel.findOneAndUpdate(
    { id },
    {
      $set: {
        status,
        updatedAt: new Date().toISOString(),
      },
    },
    { new: true },
  );

  return order ? asOrder(order) : undefined;
}

export async function holdOrder(
  id: string,
): Promise<PosOrder | undefined> {
  return updateOrderStatus(id, "held");
}

export async function resumeOrder(
  id: string,
): Promise<PosOrder | undefined> {
  return updateOrderStatus(id, "open");
}

export async function deleteOrder(
  id: string,
): Promise<boolean> {
  await connectToDatabase();

  const result = await OrderModel.deleteOne({ id });

  return result.deletedCount === 1;
}