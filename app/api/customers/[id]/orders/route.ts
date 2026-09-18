import { getCustomerById } from "@/lib/data/customerRepository";
import { getAllOrders } from "@/lib/data/orderRepository";
import type { ApiError, OrdersResponse } from "@/types/pos";

const error = (message: string, status = 400) =>
  Response.json({ error: message } satisfies ApiError, { status });

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const customer = await getCustomerById(params.id);
  if (!customer) {
    return error("Customer not found.", 404);
  }

  // Get orders associated with customer by phone or customerId
  const allOrders = await getAllOrders();
  const phoneDigits = customer.phone.replace(/\D/g, "");

  const customerOrders = allOrders.filter((order) => {
    if (order.customerId === customer.id) return true;
    if (phoneDigits) {
      const orderPhone = (order.details.delivery?.phone || "").replace(
        /\D/g,
        "",
      );
      if (orderPhone) {
        if (
          orderPhone === phoneDigits ||
          (phoneDigits.length >= 6 &&
            orderPhone.length >= 6 &&
            (orderPhone.endsWith(phoneDigits) ||
              phoneDigits.endsWith(orderPhone)))
        ) {
          return true;
        }
      }
    }
    return false;
  });

  // Sort orders descending by createdAt
  customerOrders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return Response.json({ orders: customerOrders } satisfies OrdersResponse);
}

