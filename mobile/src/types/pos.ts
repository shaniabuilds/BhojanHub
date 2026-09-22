
export type MenuCategory =
  | "Indian"
  | "Biryani"
  | "Fast Food"
  | "Starters"
  | "Breakfast"
  | "Combos"
  | "Drinks"
  | "Desserts";

export type Category = "All" | MenuCategory;

export type OrderType = "Dine In" | "Takeaway" | "Delivery";

export type PaymentMethod = "Cash" | "Card" | "UPI";

export type OrderStatus = "open" | "held" | "completed" | "cancelled";

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  description: string;
  emoji?: string;
  image?: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Discount {
  kind: "percent" | "fixed";
  value: number;
}

export interface DeliveryDetails {
  name: string;
  phone: string;
  address: string;
}

export interface OrderDetails {
  type: OrderType;
  table: string;
  delivery: DeliveryDetails;
}

export interface Bill {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  serviceCharge: number;
  deliveryFee: number;
  grandTotal: number;
}

export interface OrderTotals extends Bill {
  discount: Discount;
  taxRate: number;
  serviceEnabled: boolean;
  serviceRate: number;
}

export interface PosOrder {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  items: CartItem[];
  details: OrderDetails;
  totals: OrderTotals;
  paymentMethod?: PaymentMethod;
  cashReceived?: number;
  channel?: "online" | "pos";
  customerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  status?: "open" | "held" | "completed";
  items: Array<{
    id: string;
    quantity: number;
  }>;
  details: OrderDetails;
  discount: Discount;
  taxRate: number;
  serviceEnabled: boolean;
  serviceRate: number;
  paymentMethod?: PaymentMethod;
  cashReceived?: number;
  channel?: "online" | "pos";
  totals: Bill;
  customerId?: string;
}

export interface MenuResponse {
  categories: MenuCategory[];
  items: MenuItem[];
}

export interface OrderResponse {
  order: PosOrder;
}

export interface OrdersResponse {
  orders: PosOrder[];
}

export interface ApiError {
  error: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  created_at: string;
  notes?: string;
  tags?: string[];
  loyalty_points?: number;
}

export interface CustomerResponse {
  customer: Customer;
}

export interface CustomersResponse {
  customers: Customer[];
}

export interface MenuItemIngredient {
  menu_item_id: string;
  inventory_item_id: string;
  quantity_used_per_order: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  low_stock_threshold: number;
  linked_menu_item_ids: string[];
  ingredients: MenuItemIngredient[];
}

export interface InventoryItemResponse {
  inventoryItem: InventoryItem;
}

export interface InventoryResponse {
  inventoryItems: InventoryItem[];
}

export type TableStatus = "available" | "occupied" | "reserved";

export interface Table {
  id: string;
  table_number: string;
  capacity: number;
  status: TableStatus;
  current_order_id: string | null;
  notes?: string;
}

export interface WaitlistEntry {
  id: string;
  customer_name: string;
  party_size: number;
  phone?: string;
  notes?: string;
  created_at: string;
}

export interface TableResponse {
  table: Table;
}

export interface TablesResponse {
  tables: Table[];
}

export interface WaitlistResponse {
  waitlist: WaitlistEntry[];
}

export interface ReportSummary {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  totalItemsSold: number;
  completedOrdersCount: number;
  pendingOrdersCount: number;
  cancelledOrdersCount: number;
}

export interface TopItemReport {
  id: string;
  name: string;
  category: string;
  price: number;
  quantitySold: number;
  revenue: number;
  sharePercentage: number;
}

export interface BreakdownItem {
  label: string;
  orderCount: number;
  totalRevenue: number;
  percentage: number;
}

export interface ReportBreakdownResponse {
  breakdown: BreakdownItem[];
  totalRevenue: number;
  totalOrders: number;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}