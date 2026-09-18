
import { connectToDatabase } from "@/lib/db/mongodb";
import { MenuItemModel } from "@/lib/db/models";
import type { MenuCategory, MenuItem } from "@/types/pos";

const categories: MenuCategory[] = [
  "Indian",
  "Biryani",
  "Fast Food",
  "Starters",
  "Breakfast",
  "Combos",
  "Drinks",
  "Desserts",
];

const seed: MenuItem[] = [
  // =========================
  // INDIAN
  // =========================
  {
    id: "butter-chicken",
    name: "Butter Chicken",
    category: "Indian",
    price: 389,
    description: "Tender chicken in creamy tomato butter gravy",
  },
  {
    id: "chicken-tikka-masala",
    name: "Chicken Tikka Masala",
    category: "Indian",
    price: 399,
    description: "Grilled chicken in rich spiced tomato gravy",
  },
  {
    id: "kadhai-chicken",
    name: "Kadhai Chicken",
    category: "Indian",
    price: 379,
    description: "Chicken with peppers, onion and aromatic spices",
  },
  {
    id: "paneer-butter-masala",
    name: "Paneer Butter Masala",
    category: "Indian",
    price: 329,
    description: "Paneer in creamy tomato and butter gravy",
  },
  {
    id: "kadhai-paneer",
    name: "Kadhai Paneer",
    category: "Indian",
    price: 319,
    description: "Paneer with capsicum, onion and kadhai masala",
  },
  {
    id: "palak-paneer",
    name: "Palak Paneer",
    category: "Indian",
    price: 299,
    description: "Paneer cooked in creamy spinach gravy",
  },
  {
    id: "shahi-paneer",
    name: "Shahi Paneer",
    category: "Indian",
    price: 319,
    description: "Paneer in rich creamy cashew tomato gravy",
  },
  {
    id: "dal-makhani",
    name: "Dal Makhani",
    category: "Indian",
    price: 269,
    description: "Slow-cooked black lentils finished with butter",
  },
  {
    id: "dal-tadka",
    name: "Dal Tadka",
    category: "Indian",
    price: 229,
    description: "Yellow lentils tempered with garlic and cumin",
  },
  {
    id: "chana-masala",
    name: "Chana Masala",
    category: "Indian",
    price: 239,
    description: "Spiced chickpeas cooked with onion and tomato",
  },
  {
    id: "mix-veg",
    name: "Mix Vegetable Curry",
    category: "Indian",
    price: 269,
    description: "Seasonal vegetables in aromatic Indian gravy",
  },
  {
    id: "malai-kofta",
    name: "Malai Kofta",
    category: "Indian",
    price: 319,
    description: "Soft vegetable dumplings in creamy gravy",
  },

  // =========================
  // BIRYANI
  // =========================
  {
    id: "chicken-biryani",
    name: "Chicken Biryani",
    category: "Biryani",
    price: 349,
    description: "Fragrant basmati rice layered with spiced chicken",
  },
  {
    id: "mutton-biryani",
    name: "Mutton Biryani",
    category: "Biryani",
    price: 429,
    description: "Slow-cooked mutton layered with aromatic rice",
  },
  {
    id: "veg-biryani",
    name: "Veg Biryani",
    category: "Biryani",
    price: 289,
    description: "Basmati rice with vegetables and biryani spices",
  },
  {
    id: "paneer-biryani",
    name: "Paneer Biryani",
    category: "Biryani",
    price: 319,
    description: "Aromatic rice layered with spiced paneer",
  },
  {
    id: "hyderabadi-chicken-biryani",
    name: "Hyderabadi Chicken Biryani",
    category: "Biryani",
    price: 379,
    description: "Traditional dum biryani with chicken and saffron",
  },
  {
    id: "egg-biryani",
    name: "Egg Biryani",
    category: "Biryani",
    price: 269,
    description: "Fragrant rice served with boiled eggs and spices",
  },
  {
    id: "keema-biryani",
    name: "Keema Biryani",
    category: "Biryani",
    price: 399,
    description: "Aromatic basmati rice with spiced minced mutton",
  },
  {
    id: "family-biryani",
    name: "Biryani Family Pack",
    category: "Biryani",
    price: 899,
    description: "Large chicken biryani portion for sharing",
  },

  // =========================
  // FAST FOOD
  // =========================
  {
    id: "margherita-pizza",
    name: "Margherita Pizza",
    category: "Fast Food",
    price: 349,
    description: "Tomato sauce, mozzarella and fresh basil",
  },
  {
    id: "farmhouse-pizza",
    name: "Farmhouse Pizza",
    category: "Fast Food",
    price: 429,
    description: "Garden vegetables, mushrooms and mozzarella",
  },
  {
    id: "paneer-tikka-pizza",
    name: "Paneer Tikka Pizza",
    category: "Fast Food",
    price: 449,
    description: "Paneer tikka, peppers, onion and mozzarella",
  },
  {
    id: "chicken-tikka-pizza",
    name: "Chicken Tikka Pizza",
    category: "Fast Food",
    price: 499,
    description: "Chicken tikka, onion, peppers and cheese",
  },
  {
    id: "bbq-chicken-pizza",
    name: "BBQ Chicken Pizza",
    category: "Fast Food",
    price: 519,
    description: "BBQ chicken, caramelized onion and mozzarella",
  },
  {
    id: "four-cheese-pizza",
    name: "Four Cheese Pizza",
    category: "Fast Food",
    price: 479,
    description: "Four cheese blend with creamy mozzarella",
  },
  {
    id: "classic-veg-burger",
    name: "Classic Veg Burger",
    category: "Fast Food",
    price: 249,
    description: "Grilled vegetable patty, lettuce and house sauce",
  },
  {
    id: "crispy-chicken-burger",
    name: "Crispy Chicken Burger",
    category: "Fast Food",
    price: 299,
    description: "Crispy chicken fillet with lettuce and mayo",
  },
  {
    id: "cheese-burger",
    name: "Classic Cheese Burger",
    category: "Fast Food",
    price: 279,
    description: "Grilled patty with cheddar and house sauce",
  },
  {
    id: "grilled-sandwich",
    name: "Grilled Veg Sandwich",
    category: "Fast Food",
    price: 199,
    description: "Grilled vegetables, cheese and house spread",
  },
  {
    id: "chicken-sandwich",
    name: "Chicken Sandwich",
    category: "Fast Food",
    price: 249,
    description: "Grilled chicken, lettuce and creamy dressing",
  },
  {
    id: "paneer-wrap",
    name: "Paneer Tikka Wrap",
    category: "Fast Food",
    price: 229,
    description: "Paneer tikka, vegetables and mint sauce",
  },
  {
    id: "chicken-wrap",
    name: "Chicken Wrap",
    category: "Fast Food",
    price: 269,
    description: "Spiced chicken, vegetables and creamy sauce",
  },
  {
    id: "crispy-fries",
    name: "Crispy Fries",
    category: "Fast Food",
    price: 129,
    description: "Sea-salted golden fries served hot",
  },
  {
    id: "loaded-cheese-fries",
    name: "Loaded Cheese Fries",
    category: "Fast Food",
    price: 199,
    description: "Golden fries topped with melted cheese",
  },

  // =========================
  // STARTERS
  // =========================
  {
    id: "crispy-corn",
    name: "Crispy Corn",
    category: "Starters",
    price: 219,
    description: "Crispy corn kernels with spices and fresh herbs",
  },
  {
    id: "honey-chilli-potato",
    name: "Honey Chilli Potato",
    category: "Starters",
    price: 249,
    description: "Crispy potato fingers with honey chilli glaze",
  },
  {
    id: "veg-spring-roll",
    name: "Veg Spring Rolls",
    category: "Starters",
    price: 229,
    description: "Crispy rolls filled with seasoned vegetables",
  },
  {
    id: "paneer-tikka",
    name: "Paneer Tikka",
    category: "Starters",
    price: 289,
    description: "Chargrilled paneer with peppers and mint chutney",
  },
  {
    id: "chicken-tikka",
    name: "Chicken Tikka",
    category: "Starters",
    price: 349,
    description: "Tandoori chicken pieces with mint chutney",
  },
  {
    id: "chicken-wings",
    name: "Chicken Wings",
    category: "Starters",
    price: 329,
    description: "Crispy wings tossed in house spicy sauce",
  },
  {
    id: "veg-seekh-kebab",
    name: "Veg Seekh Kebab",
    category: "Starters",
    price: 269,
    description: "Grilled vegetable kebabs with mint chutney",
  },
  {
    id: "tandoori-chicken",
    name: "Tandoori Chicken",
    category: "Starters",
    price: 399,
    description: "Chargrilled chicken marinated in tandoori spices",
  },
  {
    id: "fish-fingers",
    name: "Fish Fingers",
    category: "Starters",
    price: 379,
    description: "Crispy golden fish fingers with tartar dip",
  },

  // =========================
  // BREAKFAST
  // =========================
  {
    id: "aloo-paratha",
    name: "Aloo Paratha",
    category: "Breakfast",
    price: 149,
    description: "Stuffed potato paratha served with curd",
  },
  {
    id: "paneer-paratha",
    name: "Paneer Paratha",
    category: "Breakfast",
    price: 179,
    description: "Stuffed paneer paratha served with curd",
  },
  {
    id: "poha",
    name: "Poha",
    category: "Breakfast",
    price: 109,
    description: "Flattened rice with peanuts, onion and herbs",
  },
  {
    id: "upma",
    name: "Vegetable Upma",
    category: "Breakfast",
    price: 119,
    description: "Soft semolina breakfast with vegetables",
  },
  {
    id: "pav-bhaji",
    name: "Pav Bhaji",
    category: "Breakfast",
    price: 179,
    description: "Spiced vegetable bhaji with buttered pav",
  },
  {
    id: "chole-kulche",
    name: "Chole Kulche",
    category: "Breakfast",
    price: 189,
    description: "Spiced chickpeas served with soft kulche",
  },

  // =========================
  // COMBOS
  // =========================
  {
    id: "veg-burger-combo",
    name: "Veg Burger Combo",
    category: "Combos",
    price: 349,
    description: "Veg burger, crispy fries and chilled soft drink",
  },
  {
    id: "chicken-burger-combo",
    name: "Chicken Burger Combo",
    category: "Combos",
    price: 399,
    description: "Chicken burger, fries and chilled soft drink",
  },
  {
    id: "pizza-combo",
    name: "Pizza & Drink Combo",
    category: "Combos",
    price: 449,
    description: "Personal pizza served with a chilled soft drink",
  },
  {
    id: "biryani-combo",
    name: "Biryani Combo",
    category: "Combos",
    price: 429,
    description: "Chicken biryani with raita and soft drink",
  },
  {
    id: "indian-meal-combo",
    name: "Indian Meal Combo",
    category: "Combos",
    price: 399,
    description: "Paneer curry, dal, rice, roti and salad",
  },
  {
    id: "family-combo",
    name: "Family Feast",
    category: "Combos",
    price: 999,
    description: "Biryani, starters, breads, curry and drinks for sharing",
  },

  // =========================
  // DRINKS
  // =========================
  {
    id: "coke",
    name: "Coke",
    category: "Drinks",
    price: 79,
    description: "Chilled 300 ml bottle",
  },
  {
    id: "sprite",
    name: "Sprite",
    category: "Drinks",
    price: 79,
    description: "Chilled lemon-lime sparkling drink",
  },
  {
    id: "fresh-lime-soda",
    name: "Fresh Lime Soda",
    category: "Drinks",
    price: 119,
    description: "Fresh lime, soda and a touch of sweetness",
  },
  {
    id: "mango-shake",
    name: "Mango Shake",
    category: "Drinks",
    price: 179,
    description: "Creamy shake made with fresh mangoes",
  },
  {
    id: "cold-coffee",
    name: "Cold Coffee",
    category: "Drinks",
    price: 169,
    description: "Chilled creamy coffee blended with ice",
  },
  {
    id: "masala-chai",
    name: "Masala Chai",
    category: "Drinks",
    price: 59,
    description: "Aromatic Indian spiced tea",
  },
  {
    id: "cappuccino",
    name: "Cappuccino",
    category: "Drinks",
    price: 149,
    description: "Espresso with steamed milk and soft foam",
  },
  {
    id: "fresh-orange-juice",
    name: "Fresh Orange Juice",
    category: "Drinks",
    price: 159,
    description: "Freshly squeezed orange juice served chilled",
  },
  {
    id: "sweet-lassi",
    name: "Sweet Lassi",
    category: "Drinks",
    price: 129,
    description: "Chilled creamy yogurt drink with cardamom",
  },
  {
    id: "mint-mojito",
    name: "Mint Mojito",
    category: "Drinks",
    price: 159,
    description: "Refreshing mint, lime and sparkling soda",
  },

  // =========================
  // DESSERTS
  // =========================
  {
    id: "gulab-jamun",
    name: "Gulab Jamun",
    category: "Desserts",
    price: 139,
    description: "Warm saffron syrup dumplings with nuts",
  },
  {
    id: "chocolate-brownie",
    name: "Chocolate Brownie",
    category: "Desserts",
    price: 179,
    description: "Warm chocolate brownie with rich cocoa flavour",
  },
  {
    id: "chocolate-lava-cake",
    name: "Chocolate Lava Cake",
    category: "Desserts",
    price: 229,
    description: "Warm chocolate cake with a molten centre",
  },
  {
    id: "new-york-cheesecake",
    name: "New York Cheesecake",
    category: "Desserts",
    price: 249,
    description: "Creamy baked cheesecake with biscuit base",
  },
  {
    id: "ice-cream-sundae",
    name: "Ice Cream Sundae",
    category: "Desserts",
    price: 199,
    description: "Vanilla ice cream with chocolate sauce and nuts",
  },
  {
    id: "rasmalai",
    name: "Rasmalai",
    category: "Desserts",
    price: 169,
    description: "Soft cottage cheese dumplings in saffron milk",
  },
  {
    id: "malai-kulfi",
    name: "Malai Kulfi",
    category: "Desserts",
    price: 149,
    description: "Traditional creamy kulfi with pistachios",
  },
  {
    id: "gajar-halwa",
    name: "Gajar Ka Halwa",
    category: "Desserts",
    price: 159,
    description: "Slow-cooked carrot pudding with nuts",
  },
];

const asMenuItem = (
  document: { toObject: () => unknown },
): MenuItem => document.toObject() as MenuItem;

async function ensureSeeded(): Promise<void> {
  await connectToDatabase();

  // Make MongoDB contain EXACTLY the current 74-item seed.
  // This removes old/extra items and inserts missing ones.
  const seedIds = seed.map((item) => item.id);

  await MenuItemModel.deleteMany({
    id: { $nin: seedIds },
  });

  const existingItems = await MenuItemModel.find(
    {},
    { id: 1 },
  ).lean();

  const existingIds = new Set(
    existingItems.map((item) => item.id),
  );

  const missingItems = seed.filter(
    (item) => !existingIds.has(item.id),
  );

  if (missingItems.length > 0) {
    await MenuItemModel.insertMany(missingItems);
  }
}

export async function getAllMenuItems(): Promise<MenuItem[]> {
  await ensureSeeded();

  return (
    await MenuItemModel.find().sort({
      category: 1,
      name: 1,
    })
  ).map(asMenuItem);
}

export async function getMenuItemById(
  id: string,
): Promise<MenuItem | undefined> {
  await ensureSeeded();

  const item = await MenuItemModel.findOne({ id });

  return item ? asMenuItem(item) : undefined;
}

export async function getAllCategories(): Promise<MenuCategory[]> {
  await ensureSeeded();

  return [...categories];
}