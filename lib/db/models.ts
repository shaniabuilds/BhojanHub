import { randomUUID } from "node:crypto";
import mongoose, { Schema } from "mongoose";

const serialize = (_document: unknown, returned: Record<string, unknown>) => {
  delete returned._id;
  delete returned.__v;
  return returned;
};

const documentOptions = {
  versionKey: false as const,
  toJSON: { virtuals: true, transform: serialize },
  toObject: { virtuals: true, transform: serialize },
};

const publicId = {
  type: String,
  required: true,
  unique: true,
  default: randomUUID,
};
const ingredientSchema = new Schema(
  {
    menu_item_id: { type: String, required: true },
    inventory_item_id: { type: String, required: true },
    quantity_used_per_order: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);
const cartItemSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);
const detailsSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["Dine In", "Takeaway", "Delivery"],
      required: true,
    },
    table: String,
    delivery: new Schema(
      { name: String, phone: String, address: String },
      { _id: false },
    ),
  },
  { _id: false },
);
const totalsSchema = new Schema(
  {
    subtotal: { type: Number, required: true },
    discountAmount: { type: Number, required: true },
    taxableAmount: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    serviceCharge: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    discount: new Schema(
      {
        kind: { type: String, enum: ["percent", "fixed"], required: true },
        value: { type: Number, required: true },
      },
      { _id: false },
    ),
    taxRate: { type: Number, required: true },
    serviceEnabled: { type: Boolean, required: true },
    serviceRate: { type: Number, required: true },
  },
  { _id: false },
);

const menuItemSchema = new Schema(
  {
    id: publicId,
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
  },
  { ...documentOptions, collection: "menuItems" },
);
const customerSchema = new Schema(
  {
    id: publicId,
    name: { type: String, required: true },
    phone: { type: String, required: true, index: true },
    email: String,
    address: String,
    created_at: { type: String, required: true },
    notes: String,
    tags: { type: [String], default: [] },
    loyalty_points: { type: Number, default: 0 },
  },
  { ...documentOptions, collection: "customers" },
);
const inventorySchema = new Schema(
  {
    id: publicId,
    name: { type: String, required: true },
    unit: { type: String, required: true },
    current_stock: { type: Number, required: true, min: 0 },
    low_stock_threshold: { type: Number, required: true, min: 0 },
    linked_menu_item_ids: { type: [String], default: [] },
    ingredients: { type: [ingredientSchema], default: [] },
  },
  { ...documentOptions, collection: "inventoryItems" },
);
const tableSchema = new Schema(
  {
    id: publicId,
    table_number: { type: String, required: true, unique: true },
    capacity: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["available", "occupied", "reserved"],
      required: true,
    },
    current_order_id: { type: String, default: null },
    notes: String,
  },
  { ...documentOptions, collection: "tables" },
);
const waitlistSchema = new Schema(
  {
    id: publicId,
    customer_name: { type: String, required: true },
    party_size: { type: Number, required: true, min: 1 },
    phone: String,
    notes: String,
    created_at: { type: String, required: true },
  },
  { ...documentOptions, collection: "waitlist" },
);
const orderSchema = new Schema(
  {
    id: publicId,
    orderNumber: { type: Number, required: true, unique: true },
    status: {
      type: String,
      enum: ["open", "held", "completed", "cancelled"],
      required: true,
      index: true,
    },
    items: { type: [cartItemSchema], required: true },
    details: { type: detailsSchema, required: true },
    totals: { type: totalsSchema, required: true },
    paymentMethod: { type: String, enum: ["Cash", "Card", "UPI"] },
    cashReceived: Number,
    channel: { type: String, enum: ["online", "pos"] },
    customerId: String,
    createdAt: { type: String, required: true, index: true },
    updatedAt: { type: String, required: true },
  },
  { ...documentOptions, collection: "orders" },
);
const counterSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Number, required: true },
  },
  { versionKey: false, collection: "counters" },
);
const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "manager", "staff"],
      required: true,
      default: "staff",
    },
  },
  { ...documentOptions, timestamps: true, collection: "users" },
);

export const MenuItemModel =
  mongoose.models.MenuItem || mongoose.model("MenuItem", menuItemSchema);
export const CustomerModel =
  mongoose.models.Customer || mongoose.model("Customer", customerSchema);
export const InventoryItemModel =
  mongoose.models.InventoryItem ||
  mongoose.model("InventoryItem", inventorySchema);
export const TableModel =
  mongoose.models.Table || mongoose.model("Table", tableSchema);
export const WaitlistModel =
  mongoose.models.Waitlist || mongoose.model("Waitlist", waitlistSchema);
export const OrderModel =
  mongoose.models.Order || mongoose.model("Order", orderSchema);
export const CounterModel =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);
export const UserModel =
  mongoose.models.User || mongoose.model("User", userSchema);
