import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureDriverProfile } from "@/lib/auth/driver-profile";
import { safeNextPath } from "@/lib/navigation";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/login?erro=confirmacao", request.url));
  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?erro=confirmacao", request.url));
  const destination = safeNextPath(request.nextUrl.searchParams.get("next"));
  const { data: { user } } = await supabase.auth.getUser();
  if (user && destination !== "/redefinir-senha") {
    const profile = await ensureDriverProfile(user);
    if (profile.error) return NextResponse.redirect(new URL("/caronas/nova?erro=perfil", request.url));
  }
  return NextResponse.redirect(new URL(destination, request.url));
}
