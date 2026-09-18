import {
  getInventoryItemById,
  updateInventoryItem,
} from "@/lib/data/inventoryRepository";
import type {
  ApiError,
  InventoryItem,
  InventoryItemResponse,
} from "@/types/pos";

const error = (message: string, status = 400) =>
  Response.json({ error: message } satisfies ApiError, { status });
const validNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const inventoryItem = await getInventoryItemById(params.id);
  return inventoryItem
    ? Response.json({ inventoryItem } satisfies InventoryItemResponse)
    : error("Inventory item not found.", 404);
}
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  let body: Partial<Omit<InventoryItem, "id">>;
  try {
    body = (await request.json()) as Partial<Omit<InventoryItem, "id">>;
  } catch {
    return error("Request body must be valid JSON.");
  }
  if (
    !body ||
    Object.keys(body).length === 0 ||
    (body.name !== undefined &&
      (typeof body.name !== "string" || !body.name.trim())) ||
    (body.unit !== undefined &&
      (typeof body.unit !== "string" || !body.unit.trim())) ||
    (body.current_stock !== undefined && !validNumber(body.current_stock)) ||
    (body.low_stock_threshold !== undefined &&
      !validNumber(body.low_stock_threshold)) ||
    (body.linked_menu_item_ids !== undefined &&
      (!Array.isArray(body.linked_menu_item_ids) ||
        !body.linked_menu_item_ids.every((id) => typeof id === "string"))) ||
    (body.ingredients !== undefined &&
      (!Array.isArray(body.ingredients) ||
        !body.ingredients.every(
          (ingredient) =>
            typeof ingredient.menu_item_id === "string" &&
            typeof ingredient.inventory_item_id === "string" &&
            validNumber(ingredient.quantity_used_per_order),
        )))
  )
    return error("Provide valid inventory fields to update.");
  const inventoryItem = await updateInventoryItem(params.id, {
    ...body,
    name: body.name?.trim(),
    unit: body.unit?.trim(),
  });
  return inventoryItem
    ? Response.json({ inventoryItem } satisfies InventoryItemResponse)
    : error("Inventory item not found.", 404);
}
