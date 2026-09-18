
import { connectToDatabase } from "@/lib/db/mongodb";
import { CustomerModel } from "@/lib/db/models";
import type { Customer } from "@/types/pos";

type CustomerInput = Omit<Customer, "id" | "created_at">;

const normalizeDigits = (value: string) =>
  value.replace(/\D/g, "");

const asCustomer = (
  document: { toObject: () => unknown },
): Customer => document.toObject() as Customer;

export async function getAllCustomers(): Promise<Customer[]> {
  await connectToDatabase();

  const customers = await CustomerModel.find().sort({
    created_at: -1,
  });

  return customers.map(asCustomer);
}

export async function getCustomerById(
  id: string,
): Promise<Customer | undefined> {
  await connectToDatabase();

  const customer = await CustomerModel.findOne({ id });

  return customer ? asCustomer(customer) : undefined;
}

export async function getCustomerByPhone(
  phone: string,
): Promise<Customer | undefined> {
  await connectToDatabase();

  const target = normalizeDigits(phone);

  const customers = await CustomerModel.find();

  const customer = customers.find((entry) => {
    if (entry.phone === phone) return true;

    const entryDigits = normalizeDigits(entry.phone);

    return (
      target.length >= 6 &&
      entryDigits.length >= 6 &&
      (entryDigits === target ||
        entryDigits.endsWith(target) ||
        target.endsWith(entryDigits))
    );
  });

  return customer ? asCustomer(customer) : undefined;
}

export async function createCustomer(
  data: CustomerInput,
): Promise<Customer> {
  await connectToDatabase();

  const customer = await CustomerModel.create({
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    loyalty_points: data.loyalty_points ?? 0,
    tags: data.tags ?? [],
    ...structuredClone(data),
  });

  return asCustomer(customer);
}

export async function updateCustomer(
  id: string,
  data: Partial<CustomerInput>,
): Promise<Customer | undefined> {
  await connectToDatabase();

  const customer = await CustomerModel.findOneAndUpdate(
    { id },
    { $set: structuredClone(data) },
    { new: true },
  );

  return customer ? asCustomer(customer) : undefined;
}

export async function addLoyaltyPoints(
  phoneOrId: string,
  points: number,
): Promise<Customer | undefined> {
  if (points <= 0) return undefined;

  await connectToDatabase();

  let customer = await CustomerModel.findOne({
    id: phoneOrId,
  });

  if (!customer) {
    const target = normalizeDigits(phoneOrId);

    if (target.length >= 6) {
      const customers = await CustomerModel.find();

      customer =
        customers.find((entry) => {
          const entryDigits = normalizeDigits(entry.phone);

          return (
            entryDigits === target ||
            entryDigits.endsWith(target) ||
            target.endsWith(entryDigits)
          );
        }) ?? null;
    }
  }

  if (!customer) return undefined;

  customer.loyalty_points =
    (customer.loyalty_points ?? 0) + points;

  await customer.save();

  return asCustomer(customer);
}