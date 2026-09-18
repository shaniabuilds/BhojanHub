import { getAllCategories, getAllMenuItems } from "@/lib/data/menuRepository";
import type { MenuResponse } from "@/types/pos";

export async function GET() {
  const response: MenuResponse = {
    categories: await getAllCategories(),
    items: await getAllMenuItems(),
  };
  return Response.json(response);
}
