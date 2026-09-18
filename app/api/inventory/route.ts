import {
  createInventoryItem,
  getAllInventoryItems,
} from "@/lib/data/inventoryRepository";
import type {
  ApiError,
  InventoryItem,
  InventoryItemResponse,
  InventoryResponse,
} from "@/types/pos";

const error = (message: string, status = 400) =>
  Response.json({ error: message } satisfies ApiError, { status });
const validItem = (body: Partial<InventoryItem>) =>
  typeof body.name === "string" &&
  body.name.trim() &&
  typeof body.unit === "string" &&
  body.unit.trim() &&
  typeof body.current_stock === "number" &&
  Number.isFinite(body.current_stock) &&
  body.current_stock >= 0 &&
  typeof body.low_stock_threshold === "number" &&
  Number.isFinite(body.low_stock_threshold) &&
  body.low_stock_threshold >= 0 &&
  Array.isArray(body.linked_menu_item_ids) &&
  body.linked_menu_item_ids.every((id) => typeof id === "string") &&
  Array.isArray(body.ingredients) &&
  body.ingredients.every(
    (ingredient) =>
      typeof ingredient.menu_item_id === "string" &&
      typeof ingredient.inventory_item_id === "string" &&
      typeof ingredient.quantity_used_per_order === "number" &&
      ingredient.quantity_used_per_order >= 0,
  );
export async function GET() {
  return Response.json({
    inventoryItems: await getAllInventoryItems(),
  } satisfies InventoryResponse);
}
export async function POST(request: Request) {
  let body: Omit<InventoryItem, "id">;
  try {
    body = (await request.json()) as Omit<InventoryItem, "id">;
  } catch {
    return error("Request body must be valid JSON.");
  }
  if (!body || !validItem(body))
    return error("Provide valid inventory item fields.");
  const inventoryItem = await createInventoryItem({
    ...body,
    name: body.name.trim(),
    unit: body.unit.trim(),
  });
  return Response.json({ inventoryItem } satisfies InventoryItemResponse, {
    status: 201,
  });
}
