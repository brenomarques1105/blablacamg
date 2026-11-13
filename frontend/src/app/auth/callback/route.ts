import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/navigation";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/login?erro=confirmacao", request.url));
  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?erro=confirmacao", request.url));
  const destination = safeNextPath(request.nextUrl.searchParams.get("next"));
  return NextResponse.redirect(new URL(destination, request.url));
}
