import { NextResponse } from "next/server";
import { estimateDistanceMeters } from "@/lib/estimate-distance.server";
import { suggestedPriceCents } from "@/lib/ride-price";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Entre na sua conta." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const result = await estimateDistanceMeters(body?.origem, body?.destino);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ meters: result.meters, cents: suggestedPriceCents(result.meters) });
}
