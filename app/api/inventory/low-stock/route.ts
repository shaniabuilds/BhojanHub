import { getLowStockItems } from "@/lib/data/inventoryRepository";
import type { InventoryResponse } from "@/types/pos";
export async function GET() {
  return Response.json({
    inventoryItems: await getLowStockItems(),
  } satisfies InventoryResponse);
}
