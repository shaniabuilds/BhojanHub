
export type Category =
  | "All"
  | "Indian"
  | "Biryani"
  | "Fast Food"
  | "Starters"
  | "Breakfast"
  | "Combos"
  | "Drinks"
  | "Desserts";
export type OrderType = "Dine In" | "Takeaway" | "Delivery";
export type PaymentMethod = "Cash" | "Card" | "UPI";

export interface MenuItem {
  id: string;
  name: string;
  category: Exclude<Category, "All">;
  price: number;
  description: string;
  image?: string;
  emoji?: string;
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
export interface HeldOrder {
  id: string;
  items: CartItem[];
  discount: Discount;
  taxRate: number;
  serviceEnabled: boolean;
  serviceRate: number;
  details: OrderDetails;
}