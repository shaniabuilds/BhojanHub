import { getAllOrders } from "@/lib/data/orderRepository";
import {
  calculateTopItems,
  filterOrdersByDateRange,
} from "@/lib/reports/reportCalculations";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const allOrders = await getAllOrders();
  const filtered = filterOrdersByDateRange(allOrders, from, to);
  const topItems = calculateTopItems(filtered);

  return Response.json({ topItems });
}
