import { Calendar, Flame, LayoutGrid, Users, TrendingUp, ShoppingCart } from "lucide-react";

export const features = {
  "billing-pos": {
    name: "Billing & POS",
    tagline: "Fast, accurate billing built for high-volume dining rooms.",
    icon: ShoppingCart,
    subFeatures: [
      {
        icon: ShoppingCart,
        heading: "One-Tap Billing",
        description: "Generate itemized bills instantly with automatic tax, discount, and split-payment handling — no manual calculation errors.",
      },
      {
        icon: TrendingUp,
        heading: "Multi-Payment Support",
        description: "Accept cash, card, UPI, and wallet payments in a single transaction, with automatic reconciliation at day-end.",
      },
      {
        icon: LayoutGrid,
        heading: "Offline Mode",
        description: "Keep billing running even during internet outages — all data syncs automatically once connectivity is restored.",
      },
    ],
  },
  "inventory-management": {
    name: "Inventory Management",
    tagline: "Track stock in real time and eliminate wastage.",
    icon: LayoutGrid,
    subFeatures: [
      {
        icon: LayoutGrid,
        heading: "Real-Time Stock Tracking",
        description: "Every sale automatically deducts raw materials from inventory, giving you a live view of what's left in the kitchen.",
      },
      {
        icon: TrendingUp,
        heading: "Low-Stock Alerts",
        description: "Get notified before ingredients run out, so you never have to 86 a dish during peak service.",
      },
      {
        icon: Users,
        heading: "Vendor & Purchase Tracking",
        description: "Log purchase orders, compare vendor pricing, and track delivery consistency across all your suppliers.",
      },
    ],
  },
  "online-ordering": {
    name: "Online Ordering",
    tagline: "Bring your own branded ordering experience to every guest.",
    icon: TrendingUp,
    subFeatures: [
      {
        icon: TrendingUp,
        heading: "Branded Ordering Page",
        description: "Launch a commission-free, fully branded online ordering site that reflects your restaurant's identity.",
      },
      {
        icon: ShoppingCart,
        heading: "Aggregator Sync",
        description: "Connect Zomato, Swiggy, and other delivery platforms into one dashboard — no more juggling multiple tablets.",
      },
      {
        icon: LayoutGrid,
        heading: "Menu Auto-Sync",
        description: "Update your menu once and it reflects instantly across your website, app, and all connected delivery partners.",
      },
    ],
  },
  "table-management": {
    name: "Table Management",
    tagline: "Visualize your floor plan and optimize every seating decision.",
    icon: Calendar,
    subFeatures: [
      {
        icon: Calendar,
        heading: "Live Floor Plan",
        description: "See every table's status — occupied, reserved, or available — updated in real time as guests are seated or leave.",
      },
      {
        icon: Users,
        heading: "Smart Reservations",
        description: "Manage bookings with automatic table assignment based on party size and estimated turn time.",
      },
      {
        icon: Flame,
        heading: "Waitlist Management",
        description: "Digitally manage walk-in waitlists with SMS notifications so guests don't have to stand at the door.",
      },
    ],
  },
  "reporting-analytics": {
    name: "Reporting & Analytics",
    tagline: "Turn every transaction into a business decision.",
    icon: TrendingUp,
    subFeatures: [
      {
        icon: TrendingUp,
        heading: "Sales Dashboards",
        description: "Track daily, weekly, and monthly revenue trends with visual breakdowns by category, item, and time of day.",
      },
      {
        icon: LayoutGrid,
        heading: "Menu Engineering",
        description: "Identify your most and least profitable dishes to optimize pricing and menu placement.",
      },
      {
        icon: Users,
        heading: "Staff Performance",
        description: "Monitor order accuracy, table turn times, and upsell performance across your entire floor staff.",
      },
    ],
  },
  crm: {
    name: "CRM",
    tagline: "Build lasting relationships with every guest who walks in.",
    icon: Users,
    subFeatures: [
      {
        icon: Users,
        heading: "Guest Profiles",
        description: "Automatically capture guest preferences, order history, and special occasions to personalize every visit.",
      },
      {
        icon: TrendingUp,
        heading: "Loyalty Programs",
        description: "Reward repeat guests with points, discounts, and exclusive offers that keep them coming back.",
      },
      {
        icon: Calendar,
        heading: "Automated Campaigns",
        description: "Send birthday offers, win-back emails, and feedback requests automatically — no manual effort required.",
      },
    ],
  },
} as const;

export type FeatureSlug = keyof typeof features;