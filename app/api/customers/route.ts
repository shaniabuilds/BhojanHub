import {
  createCustomer,
  getAllCustomers,
  getCustomerByPhone,
} from "@/lib/data/customerRepository";

import type {
  ApiError,
  Customer,
  CustomerResponse,
  CustomersResponse,
} from "@/types/pos";

const error = (message: string, status = 400) =>
  Response.json({ error: message } satisfies ApiError, { status });

const validOptionalText = (value: unknown) =>
  value === undefined || typeof value === "string";

const validTags = (value: unknown) =>
  value === undefined ||
  (Array.isArray(value) &&
    value.every(
      (tag) => typeof tag === "string" && tag.trim(),
    ));

const validLoyalty = (value: unknown) =>
  value === undefined ||
  (typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0);

export async function GET(request: Request) {
  const phone = new URL(request.url).searchParams.get("phone");

  if (phone) {
    const customer = await getCustomerByPhone(phone.trim());

    return Response.json({
      customers: customer ? [customer] : [],
    } satisfies CustomersResponse);
  }

  return Response.json({
    customers: await getAllCustomers(),
  } satisfies CustomersResponse);
}

export async function POST(request: Request) {
  let body: Omit<Customer, "id" | "created_at">;

  try {
    body =
      (await request.json()) as Omit<
        Customer,
        "id" | "created_at"
      >;
  } catch {
    return error("Request body must be valid JSON.");
  }

  if (
    !body ||
    typeof body.name !== "string" ||
    !body.name.trim() ||
    typeof body.phone !== "string" ||
    !body.phone.trim() ||
    !validOptionalText(body.email) ||
    !validOptionalText(body.address) ||
    !validOptionalText(body.notes) ||
    !validLoyalty(body.loyalty_points) ||
    !validTags(body.tags)
  ) {
    return error(
      "A name, phone, and valid optional customer fields are required.",
    );
  }

  const customer = await createCustomer({
    ...body,
    name: body.name.trim(),
    phone: body.phone.trim(),
    email: body.email?.trim() || undefined,
    address: body.address?.trim() || undefined,
    notes: body.notes?.trim() || undefined,
    tags:
      body.tags?.map((tag) => tag.trim()).filter(Boolean) || [],
    loyalty_points:
      body.loyalty_points !== undefined
        ? Math.floor(body.loyalty_points)
        : 0,
  });

  return Response.json(
    { customer } satisfies CustomerResponse,
    { status: 201 },
  );
}