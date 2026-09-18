import { connectToDatabase } from "@/lib/db/mongodb";
import { InventoryItemModel } from "@/lib/db/models";
import type { InventoryItem, MenuItemIngredient } from "@/types/pos";

type InventoryInput = Omit<InventoryItem, "id">;
const asInventoryItem = (document: { toObject: () => unknown }): InventoryItem => document.toObject() as InventoryItem;
const seed: InventoryItem[] = [
  { id: "chicken", name: "Chicken", unit: "kg", current_stock: 8, low_stock_threshold: 2, linked_menu_item_ids: ["butter-chicken", "chicken-burger"], ingredients: [{ menu_item_id: "butter-chicken", inventory_item_id: "chicken", quantity_used_per_order: 0.25 }, { menu_item_id: "chicken-burger", inventory_item_id: "chicken", quantity_used_per_order: 0.2 }] },
  { id: "paneer", name: "Paneer", unit: "kg", current_stock: 1.5, low_stock_threshold: 2, linked_menu_item_ids: ["paneer-tikka"], ingredients: [{ menu_item_id: "paneer-tikka", inventory_item_id: "paneer", quantity_used_per_order: 0.18 }] },
];
async function ensureSeeded(): Promise<void> { await connectToDatabase(); if (await InventoryItemModel.countDocuments() === 0) await InventoryItemModel.insertMany(seed); }
export async function getAllInventoryItems(): Promise<InventoryItem[]> { await ensureSeeded(); return (await InventoryItemModel.find().sort({ name: 1 })).map(asInventoryItem); }
export async function getInventoryItemById(id: string): Promise<InventoryItem | undefined> { await ensureSeeded(); const item = await InventoryItemModel.findOne({ id }); return item ? asInventoryItem(item) : undefined; }
export async function createInventoryItem(data: InventoryInput): Promise<InventoryItem> { await connectToDatabase(); return asInventoryItem(await InventoryItemModel.create(data)); }
export async function updateInventoryItem(id: string, data: Partial<InventoryInput>): Promise<InventoryItem | undefined> { await connectToDatabase(); const item = await InventoryItemModel.findOneAndUpdate({ id }, { $set: data }, { new: true }); return item ? asInventoryItem(item) : undefined; }
export async function deductStockForOrder(orderItems: Array<{ menuItemId: string; quantity: number }>): Promise<InventoryItem[]> { await connectToDatabase(); for (const orderItem of orderItems) { const items = await InventoryItemModel.find({ "ingredients.menu_item_id": orderItem.menuItemId }); for (const item of items) { const deduction = item.ingredients.filter((ingredient: MenuItemIngredient) => ingredient.menu_item_id === orderItem.menuItemId).reduce((total: number, ingredient: MenuItemIngredient) => total + ingredient.quantity_used_per_order * orderItem.quantity, 0); if (deduction > 0) await InventoryItemModel.updateOne({ id: item.id }, [{ $set: { current_stock: { $max: [0, { $subtract: ["$current_stock", deduction] }] } } }], { updatePipeline: true }); } } return getAllInventoryItems(); }
export async function getLowStockItems(): Promise<InventoryItem[]> { await connectToDatabase(); return (await InventoryItemModel.find({ $expr: { $lte: ["$current_stock", "$low_stock_threshold"] } }).sort({ name: 1 })).map(asInventoryItem); }
export type { InventoryInput, MenuItemIngredient };
