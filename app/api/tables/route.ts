import {
  addToWaitlist,
  getAllTables,
  getAllWaitlist,
  removeFromWaitlist,
} from "@/lib/data/tableRepository";
import type { TablesResponse, WaitlistResponse } from "@/types/pos";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("waitlist") === "true") {
    return Response.json({
      waitlist: await getAllWaitlist(),
    } satisfies WaitlistResponse);
  }
  return Response.json({
    tables: await getAllTables(),
  } satisfies TablesResponse);
}

export async function POST(request: Request) {
  let body: {
    action?: "add_waitlist" | "remove_waitlist";
    customer_name?: string;
    party_size?: number;
    phone?: string;
    notes?: string;
    id?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (body?.action === "add_waitlist") {
    if (
      !body.customer_name?.trim() ||
      !body.party_size ||
      body.party_size < 1
    ) {
      return Response.json(
        { error: "Customer name and party size (at least 1) are required." },
        { status: 400 },
      );
    }
    const entry = await addToWaitlist({
      customer_name: body.customer_name,
      party_size: Number(body.party_size),
      phone: body.phone,
      notes: body.notes,
    });
    return Response.json({ entry }, { status: 201 });
  }

  if (body?.action === "remove_waitlist") {
    if (!body.id) {
      return Response.json(
        { error: "Waitlist entry ID is required." },
        { status: 400 },
      );
    }
    const success = await removeFromWaitlist(body.id);
    return Response.json({ success });
  }

  return Response.json({ error: "Invalid action." }, { status: 400 });
}
