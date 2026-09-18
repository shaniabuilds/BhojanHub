import type {
  BreakdownItem,
  PosOrder,
  ReportBreakdownResponse,
  ReportSummary,
  TopItemReport,
} from "@/types/pos";

const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function filterOrdersByDateRange(
  orders: PosOrder[],
  from?: string | null,
  to?: string | null,
): PosOrder[] {
  let fromDate: Date | null = null;
  let toDate: Date | null = null;

  if (from) {
    const parsed = new Date(from);
    if (!Number.isNaN(parsed.getTime())) {
      fromDate = parsed;
    }
  }

  if (to) {
    const parsed = new Date(to);
    if (!Number.isNaN(parsed.getTime())) {
      toDate = parsed;
      // If YYYY-MM-DD was supplied, include the entire day up to 23:59:59.999
      if (to.length === 10) {
        toDate.setHours(23, 59, 59, 999);
      }
    }
  }

  return orders.filter((order) => {
    const orderDate = new Date(order.createdAt);
    if (fromDate && orderDate < fromDate) return false;
    if (toDate && orderDate > toDate) return false;
    return true;
  });
}

export function calculateSummary(orders: PosOrder[]): ReportSummary {
  const completed = orders.filter((o) => o.status === "completed");
  const pending = orders.filter((o) => o.status === "open" || o.status === "held");
  const cancelled = orders.filter((o) => o.status === "cancelled");

  const totalSales = round(completed.reduce((sum, o) => sum + (o.totals?.grandTotal || 0), 0));
  const totalOrders = completed.length;
  const averageOrderValue = totalOrders > 0 ? round(totalSales / totalOrders) : 0;
  const totalItemsSold = completed.reduce(
    (sum, o) => sum + (o.items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0),
    0,
  );

  return {
    totalSales,
    totalOrders,
    averageOrderValue,
    totalItemsSold,
    completedOrdersCount: completed.length,
    pendingOrdersCount: pending.length,
    cancelledOrdersCount: cancelled.length,
  };
}

export function calculateTopItems(orders: PosOrder[]): TopItemReport[] {
  const completed = orders.filter((o) => o.status === "completed");
  const itemMap = new Map<
    string,
    {
      id: string;
      name: string;
      category: string;
      price: number;
      quantitySold: number;
      revenue: number;
    }
  >();

  let totalUnits = 0;

  for (const order of completed) {
    for (const item of order.items || []) {
      totalUnits += item.quantity;
      const existing = itemMap.get(item.id);
      if (existing) {
        existing.quantitySold += item.quantity;
        existing.revenue = round(existing.revenue + item.price * item.quantity);
      } else {
        itemMap.set(item.id, {
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          quantitySold: item.quantity,
          revenue: round(item.price * item.quantity),
        });
      }
    }
  }

  const result: TopItemReport[] = Array.from(itemMap.values()).map((item) => ({
    ...item,
    sharePercentage: totalUnits > 0 ? round((item.quantitySold / totalUnits) * 100) : 0,
  }));

  // Sort descending by quantity sold, secondary by revenue
  return result.sort((a, b) => b.quantitySold - a.quantitySold || b.revenue - a.revenue);
}

export function calculateByOrderType(orders: PosOrder[]): ReportBreakdownResponse {
  const completed = orders.filter((o) => o.status === "completed");
  const totalRevenue = round(completed.reduce((sum, o) => sum + (o.totals?.grandTotal || 0), 0));
  const totalOrders = completed.length;

  const buckets: Record<string, { count: number; revenue: number }> = {
    "Dine In": { count: 0, revenue: 0 },
    Takeaway: { count: 0, revenue: 0 },
    Delivery: { count: 0, revenue: 0 },
  };

  for (const order of completed) {
    const type = order.details?.type || "Dine In";
    if (!buckets[type]) {
      buckets[type] = { count: 0, revenue: 0 };
    }
    buckets[type].count += 1;
    buckets[type].revenue = round(buckets[type].revenue + (order.totals?.grandTotal || 0));
  }

  const breakdown: BreakdownItem[] = Object.entries(buckets).map(([label, data]) => ({
    label,
    orderCount: data.count,
    totalRevenue: data.revenue,
    percentage: totalRevenue > 0 ? round((data.revenue / totalRevenue) * 100) : 0,
  }));

  return {
    breakdown,
    totalRevenue,
    totalOrders,
  };
}

export function calculateByChannel(orders: PosOrder[]): ReportBreakdownResponse {
  const completed = orders.filter((o) => o.status === "completed");
  const totalRevenue = round(completed.reduce((sum, o) => sum + (o.totals?.grandTotal || 0), 0));
  const totalOrders = completed.length;

  const buckets: Record<string, { count: number; revenue: number }> = {
    "POS Counter": { count: 0, revenue: 0 },
    "Online Ordering": { count: 0, revenue: 0 },
  };

  for (const order of completed) {
    const channelKey = order.channel === "online" ? "Online Ordering" : "POS Counter";
    buckets[channelKey].count += 1;
    buckets[channelKey].revenue = round(
      buckets[channelKey].revenue + (order.totals?.grandTotal || 0),
    );
  }

  const breakdown: BreakdownItem[] = Object.entries(buckets).map(([label, data]) => ({
    label,
    orderCount: data.count,
    totalRevenue: data.revenue,
    percentage: totalRevenue > 0 ? round((data.revenue / totalRevenue) * 100) : 0,
  }));

  return {
    breakdown,
    totalRevenue,
    totalOrders,
  };
}

export function calculateByPaymentMethod(orders: PosOrder[]): ReportBreakdownResponse {
  const completed = orders.filter((o) => o.status === "completed");
  const totalRevenue = round(completed.reduce((sum, o) => sum + (o.totals?.grandTotal || 0), 0));
  const totalOrders = completed.length;

  const buckets: Record<string, { count: number; revenue: number }> = {
    Cash: { count: 0, revenue: 0 },
    Card: { count: 0, revenue: 0 },
    UPI: { count: 0, revenue: 0 },
  };

  for (const order of completed) {
    const method = order.paymentMethod || "Cash";
    if (!buckets[method]) {
      buckets[method] = { count: 0, revenue: 0 };
    }
    buckets[method].count += 1;
    buckets[method].revenue = round(buckets[method].revenue + (order.totals?.grandTotal || 0));
  }

  const breakdown: BreakdownItem[] = Object.entries(buckets).map(([label, data]) => ({
    label,
    orderCount: data.count,
    totalRevenue: data.revenue,
    percentage: totalRevenue > 0 ? round((data.revenue / totalRevenue) * 100) : 0,
  }));

  return {
    breakdown,
    totalRevenue,
    totalOrders,
  };
}

