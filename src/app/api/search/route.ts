import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepo } from "@/lib/data";

export const dynamic = "force-dynamic";

const searchSchema = z.object({
  keyword: z.string().trim().min(1).max(120),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = searchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "A search keyword is required." },
      { status: 400 },
    );
  }

  try {
    await getRepo().recordSearch(parsed.data.keyword);
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/search failed:", error);
    return NextResponse.json(
      { error: "Unable to record the search." },
      { status: 500 },
    );
  }
}
