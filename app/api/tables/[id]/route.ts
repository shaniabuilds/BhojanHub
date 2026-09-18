import { getTableById, updateTableStatus } from "@/lib/data/tableRepository";
import type { ApiError, TableResponse, TableStatus } from "@/types/pos";

const error = (message: string, status = 400) =>
  Response.json({ error: message } satisfies ApiError, { status });
const statuses: TableStatus[] = ["available", "occupied", "reserved"];
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const table = await getTableById(params.id);
  return table
    ? Response.json({ table } satisfies TableResponse)
    : error("Table not found.", 404);
}
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  let body: {
    status?: TableStatus;
    orderId?: string | null;
    notes?: string | null;
  };
  try {
    body = (await request.json()) as {
      status?: TableStatus;
      orderId?: string | null;
      notes?: string | null;
    };
  } catch {
    return error("Request body must be valid JSON.");
  }
  if (
    !body ||
    !body.status ||
    !statuses.includes(body.status) ||
    (body.orderId !== undefined &&
      body.orderId !== null &&
      typeof body.orderId !== "string") ||
    (body.notes !== undefined &&
      body.notes !== null &&
      typeof body.notes !== "string")
  )
    return error(
      "Provide a valid table status, optional orderId, and optional notes.",
    );
  const table = await updateTableStatus(
    params.id,
    body.status,
    body.orderId,
    body.notes,
  );
  return table
    ? Response.json({ table } satisfies TableResponse)
    : error("Table not found.", 404);
}
