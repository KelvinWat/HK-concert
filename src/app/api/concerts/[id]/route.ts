import { NextResponse } from "next/server";
import { getRepo } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const concert = await getRepo().getConcert(id);
    if (!concert) {
      return NextResponse.json({ error: "Concert not found." }, { status: 404 });
    }
    return NextResponse.json({ data: concert });
  } catch (error) {
    console.error("GET /api/concerts/[id] failed:", error);
    return NextResponse.json(
      { error: "Unable to load the concert." },
      { status: 500 },
    );
  }
}
