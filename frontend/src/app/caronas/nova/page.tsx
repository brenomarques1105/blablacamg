import Link from "next/link";
import { ArrowLeft, CarFront } from "lucide-react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { RideForm } from "@/components/ride-form";
import { createClient } from "@/lib/supabase/server";
import type { Usuario } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function NewRidePage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return <main className="grid min-h-screen place-items-center p-6"><p>Configure as variáveis do Supabase em frontend/.env.local.</p></main>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase.from("usuarios").select("id, nome, orgao, telefone").eq("id", user.id).maybeSingle();
  return <AppShell userName={user.user_metadata?.nome ?? user.email ?? "Servidor"}><main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-7 sm:py-9"><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-900 hover:underline"><ArrowLeft size={16}/>Voltar ao mural</Link><div className="mb-7 mt-5 flex items-start gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-900"><CarFront size={24}/></span><div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">Motorista</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Oferecer uma carona</h1><p className="mt-1 text-sm text-[var(--muted)]">Compartilhe seu trajeto com outros servidores da CAMG.</p></div></div><RideForm initialProfile={(data as Usuario | null) ?? null}/></main></AppShell>;
}
