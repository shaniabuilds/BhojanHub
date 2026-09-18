
import { getCustomerById, updateCustomer } from "@/lib/data/customerRepository";

import type { ApiError, Customer, CustomerResponse } from "@/types/pos";

const error = (message: string, status = 400) =>
  Response.json({ error: message } satisfies ApiError, { status });

const validOptionalText = (value: unknown, allowEmpty = false) =>
  value === undefined ||
  (typeof value === "string" &&
    (allowEmpty || value.trim().length > 0));

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const customer = await getCustomerById(params.id);

  return customer
    ? Response.json({ customer } satisfies CustomerResponse)
    : error("Customer not found.", 404);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  let body: Partial<Omit<Customer, "id" | "created_at">>;

  try {
    body =
      (await request.json()) as Partial<
        Omit<Customer, "id" | "created_at">
      >;
  } catch {
    return error("Request body must be valid JSON.");
  }

  if (
    !body ||
    Object.keys(body).length === 0 ||
    !validOptionalText(body.name) ||
    !validOptionalText(body.phone) ||
    !validOptionalText(body.email, true) ||
    !validOptionalText(body.address, true) ||
    !validOptionalText(body.notes, true) ||
    (body.loyalty_points !== undefined &&
      (typeof body.loyalty_points !== "number" ||
        !Number.isFinite(body.loyalty_points) ||
        body.loyalty_points < 0)) ||
    (body.tags !== undefined &&
      (!Array.isArray(body.tags) ||
        !body.tags.every(
          (tag) => typeof tag === "string" && tag.trim(),
        )))
  ) {
    return error("Provide valid customer fields to update.");
  }

  const updatePayload: Partial<
    Omit<Customer, "id" | "created_at">
  > = {};

  if (body.name !== undefined) {
    updatePayload.name = body.name.trim();
  }

  if (body.phone !== undefined) {
    updatePayload.phone = body.phone.trim();
  }

  if (body.email !== undefined) {
    updatePayload.email = body.email.trim();
  }

  if (body.address !== undefined) {
    updatePayload.address = body.address.trim();
  }

  if (body.notes !== undefined) {
    updatePayload.notes = body.notes.trim();
  }

  if (body.loyalty_points !== undefined) {
    updatePayload.loyalty_points = Math.floor(body.loyalty_points);
  }

  if (body.tags !== undefined) {
    updatePayload.tags = body.tags.map((tag) => tag.trim());
  }

  const customer = await updateCustomer(params.id, updatePayload);

  return customer
    ? Response.json({ customer } satisfies CustomerResponse)
    : error("Customer not found.", 404);
}