import { randomUUID } from "node:crypto";
import { connectToDatabase } from "@/lib/db/mongodb";
import { TableModel, WaitlistModel } from "@/lib/db/models";
import type { Table, TableStatus, WaitlistEntry } from "@/types/pos";

type TableInput = Omit<Table, "id" | "status" | "current_order_id"> &
  Partial<Pick<Table, "status" | "current_order_id" | "notes">>;
const defaultTables: Table[] = [
  {
    id: "table-1",
    table_number: "Table 01",
    capacity: 2,
    status: "available",
    current_order_id: null,
  },
  {
    id: "table-2",
    table_number: "Table 02",
    capacity: 2,
    status: "available",
    current_order_id: null,
  },
  {
    id: "table-3",
    table_number: "Table 03",
    capacity: 4,
    status: "available",
    current_order_id: null,
  },
  {
    id: "table-4",
    table_number: "Table 04",
    capacity: 4,
    status: "available",
    current_order_id: null,
  },
  {
    id: "table-5",
    table_number: "Table 05",
    capacity: 4,
    status: "available",
    current_order_id: null,
  },
  {
    id: "table-6",
    table_number: "Table 06",
    capacity: 6,
    status: "available",
    current_order_id: null,
  },
  {
    id: "table-7",
    table_number: "Table 07",
    capacity: 6,
    status: "available",
    current_order_id: null,
  },
  {
    id: "table-8",
    table_number: "Table 08",
    capacity: 8,
    status: "available",
    current_order_id: null,
  },
];
const asTable = (document: { toObject: () => unknown }): Table =>
  document.toObject() as Table;
const asWaitlistEntry = (document: {
  toObject: () => unknown;
}): WaitlistEntry => document.toObject() as WaitlistEntry;
const identifierQuery = (identifier: string) => ({
  $or: [
    { id: identifier },
    {
      table_number: new RegExp(
        `^${identifier.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        "i",
      ),
    },
  ],
});
async function ensureSeeded(): Promise<void> {
  await connectToDatabase();
  if ((await TableModel.countDocuments()) === 0)
    await TableModel.insertMany(defaultTables);
}
export async function getAllTables(): Promise<Table[]> {
  await ensureSeeded();
  return (await TableModel.find().sort({ table_number: 1 })).map(asTable);
}
export async function getTableById(id: string): Promise<Table | undefined> {
  await ensureSeeded();
  const table = await TableModel.findOne(identifierQuery(id));
  return table ? asTable(table) : undefined;
}
export async function getTableByNumber(
  tableNumber: string,
): Promise<Table | undefined> {
  return getTableById(tableNumber.trim());
}
export async function updateTableStatus(
  id: string,
  status: TableStatus,
  orderId?: string | null,
  notes?: string | null,
): Promise<Table | undefined> {
  await ensureSeeded();
  const existing = await TableModel.findOne(identifierQuery(id));
  if (!existing) return undefined;
  const update: Record<string, unknown> = { status };
  const unset: Record<string, 1> = {};
  if (status === "available") {
    update.current_order_id = null;
    unset.notes = 1;
  } else {
    if (orderId !== undefined) update.current_order_id = orderId;
    if (notes !== undefined) {
      if (notes) update.notes = notes.trim();
      else unset.notes = 1;
    }
  }
  const table = await TableModel.findOneAndUpdate(
    { id: existing.id },
    { $set: update, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
    { new: true },
  );
  return table ? asTable(table) : undefined;
}
export async function occupyTableForOrder(
  tableIdentifier: string,
  orderId: string,
): Promise<Table | undefined> {
  return updateTableStatus(tableIdentifier, "occupied", orderId);
}
export async function freeTableForOrder(
  tableIdentifier?: string,
  orderId?: string,
): Promise<Table | undefined> {
  await ensureSeeded();
  const query = orderId
    ? { current_order_id: orderId }
    : tableIdentifier
      ? identifierQuery(tableIdentifier)
      : null;
  if (!query) return undefined;
  const table = await TableModel.findOneAndUpdate(
    query,
    {
      $set: { status: "available", current_order_id: null },
      $unset: { notes: 1 },
    },
    { new: true },
  );
  return table ? asTable(table) : undefined;
}
export async function createTable(data: TableInput): Promise<Table> {
  await connectToDatabase();
  return asTable(
    await TableModel.create({
      ...data,
      id: randomUUID(),
      status: data.status ?? "available",
      current_order_id: data.current_order_id ?? null,
    }),
  );
}
export async function getAllWaitlist(): Promise<WaitlistEntry[]> {
  await connectToDatabase();
  return (await WaitlistModel.find().sort({ created_at: 1 })).map(
    asWaitlistEntry,
  );
}
export async function addToWaitlist(data: {
  customer_name: string;
  party_size: number;
  phone?: string;
  notes?: string;
}): Promise<WaitlistEntry> {
  await connectToDatabase();
  return asWaitlistEntry(
    await WaitlistModel.create({
      id: randomUUID(),
      customer_name: data.customer_name.trim(),
      party_size: data.party_size,
      phone: data.phone?.trim(),
      notes: data.notes?.trim(),
      created_at: new Date().toISOString(),
    }),
  );
}
export async function removeFromWaitlist(id: string): Promise<boolean> {
  await connectToDatabase();
  return (await WaitlistModel.deleteOne({ id })).deletedCount === 1;
}
export type { TableInput };
