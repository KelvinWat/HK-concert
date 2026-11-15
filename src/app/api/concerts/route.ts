import { NextResponse, type NextRequest } from "next/server";
import { getRepo } from "@/lib/data";
import {
  parseConcertSearchParams,
  type ConcertSearchParams,
} from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params: ConcertSearchParams = {};
  for (const key of request.nextUrl.searchParams.keys()) {
    params[key] = request.nextUrl.searchParams.get(key) ?? undefined;
  }

  const { filters, page } = parseConcertSearchParams(params);

  try {
    const data = await getRepo().listConcerts(filters);
    return NextResponse.json({ data, count: data.length, page });
  } catch (error) {
    console.error("GET /api/concerts failed:", error);
    return NextResponse.json(
      { error: "Unable to load concerts." },
      { status: 500 },
    );
  }
}
