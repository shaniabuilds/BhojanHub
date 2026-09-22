import assert from "node:assert/strict";

// Test customer phone normalization and correlation
const normalizeDigits = (val) => val.replace(/\D/g, "");

function matchPhone(phoneA, phoneB) {
  const a = normalizeDigits(phoneA);
  const b = normalizeDigits(phoneB);
  if (a === b) return true;
  if (a.length >= 6 && b.length >= 6) {
    return a.endsWith(b) || b.endsWith(a);
  }
  return false;
}

// 1. Phone matching tests
assert.equal(matchPhone("+91 98765 43210", "9876543210"), true);
assert.equal(matchPhone("9876543210", "+919876543210"), true);
assert.equal(matchPhone("9876543210", "9876500000"), false);
console.log("✔ Phone normalization and fuzzy matching passed.");

// 2. Loyalty points calculation rule: 1 point per ₹100 spent on completed orders
function calculateLoyaltyPoints(grandTotal) {
  return Math.floor((grandTotal || 0) / 100);
}

assert.equal(calculateLoyaltyPoints(99), 0);
assert.equal(calculateLoyaltyPoints(100), 1);
assert.equal(calculateLoyaltyPoints(650), 6);
assert.equal(calculateLoyaltyPoints(1890.5), 18);
console.log("✔ Loyalty points accrual logic passed.");

// 3. Regular badge evaluation (3+ completed orders)
function isRegularCustomer(orders) {
  const completed = orders.filter((o) => o.status === "completed");
  return completed.length >= 3;
}

assert.equal(isRegularCustomer([]), false);
assert.equal(isRegularCustomer([{ status: "completed" }, { status: "completed" }]), false);
assert.equal(
  isRegularCustomer([
    { status: "completed" },
    { status: "open" },
    { status: "completed" },
    { status: "completed" },
  ]),
  true
);
console.log("✔ Regular guest badge threshold passed.");

// 4. Guest notes & tags partial update simulation
const mockCustomer = {
  id: "cust-1",
  name: "Priya Sharma",
  phone: "9820011223",
  notes: "Prefers quiet booth",
  tags: ["Vegetarian"],
  loyalty_points: 15,
};

// Update notes (including clearing notes to empty string)
function updateNotes(cust, newNotes) {
  return { ...cust, notes: newNotes.trim() };
}

const updated1 = updateNotes(mockCustomer, "");
assert.equal(updated1.notes, "");

const updated2 = updateNotes(mockCustomer, "Gluten intolerance, seating preference: patio");
assert.equal(updated2.notes, "Gluten intolerance, seating preference: patio");
console.log("✔ Guest notes editable update logic passed.");

console.log("All CRM unit and rule validations passed successfully!");

