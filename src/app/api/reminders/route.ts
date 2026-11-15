import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getRepo } from "@/lib/data";
import {
  reminderCreateSchema,
  reminderDeleteSchema,
} from "@/lib/validation";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, { message: string; status: number }> = {
  CONCERT_NOT_FOUND: { message: "Concert not found.", status: 404 },
  SALE_DATE_MISSING: {
    message: "The ticket sale date has not been announced yet.",
    status: 400,
  },
  REMINDER_IN_PAST: {
    message: "That reminder time has already passed.",
    status: 400,
  },
  REMINDER_EXISTS: {
    message: "You already have this reminder for the concert.",
    status: 409,
  },
};

function revalidateReminders(concertId?: string): void {
  revalidatePath("/");
  revalidatePath("/reminders");
  if (concertId) revalidatePath(`/concert/${concertId}`);
}

export async function GET() {
  try {
    const data = await getRepo().listReminders();
    return NextResponse.json({ data, count: data.length });
  } catch (error) {
    console.error("GET /api/reminders failed:", error);
    return NextResponse.json(
      { error: "Unable to load reminders." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = reminderCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid reminder.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const reminder = await getRepo().addReminder(
      parsed.data.concertId,
      parsed.data.reminderType,
    );
    revalidateReminders(parsed.data.concertId);
    return NextResponse.json({ data: reminder }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const known = ERROR_MESSAGES[message];
    if (known) {
      return NextResponse.json(
        { error: known.message, code: message },
        { status: known.status },
      );
    }

    console.error("POST /api/reminders failed:", error);
    return NextResponse.json(
      { error: "Unable to create the reminder." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = reminderDeleteSchema.safeParse({
    id: searchParams.get("id") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "A valid reminder id is required." },
      { status: 400 },
    );
  }

  try {
    await getRepo().deleteReminder(parsed.data.id);
    revalidateReminders();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/reminders failed:", error);
    return NextResponse.json(
      { error: "Unable to delete the reminder." },
      { status: 500 },
    );
  }
}
