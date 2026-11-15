import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getRepo } from "@/lib/data";
import { watchlistMutationSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getRepo().listWatchlist();
    return NextResponse.json({ data, count: data.length });
  } catch (error) {
    console.error("GET /api/watchlist failed:", error);
    return NextResponse.json(
      { error: "Unable to load the watchlist." },
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

  const parsed = watchlistMutationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid watchlist update.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const repo = getRepo();
    await repo.setWatchStatus(parsed.data.concertId, parsed.data.status);

    revalidatePath("/");
    revalidatePath("/concerts");
    revalidatePath("/ranking");
    revalidatePath("/watchlist");
    revalidatePath(`/concert/${parsed.data.concertId}`);

    return NextResponse.json({ ok: true, status: parsed.data.status });
  } catch (error) {
    console.error("POST /api/watchlist failed:", error);
    return NextResponse.json(
      { error: "Unable to update the watchlist." },
      { status: 500 },
    );
  }
}
