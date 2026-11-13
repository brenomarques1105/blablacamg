import Link from "next/link";
import {
  ArrowRight,
  CircleHelp,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AssistantWidget } from "@/components/assistant-widget";
import { RideBoard } from "@/components/ride-board";
import type { CaronaComMotorista } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { todayInSaoPaulo } from "@/lib/format";

export const dynamic = "force-dynamic";

function SetupNotice() {
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <section className="surface-shadow max-w-lg rounded-3xl border border-[var(--line)] bg-white p-8">
        <span className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-800">
          <ShieldCheck />
        </span>
        <h1 className="mt-5 text-2xl font-bold">Conecte o projeto ao Supabase</h1>
        <p className="mt-2 leading-7 text-[var(--muted)]">
          Copie <code>frontend/.env.example</code> para <code>frontend/.env.local</code> e
          preencha a URL e a chave publicável do seu projeto.
        </p>
      </section>
    </main>
  );
}

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return <SetupNotice />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = todayInSaoPaulo();
  const params = await searchParams;
  const tipo = params.tipo === "Ida" || params.tipo === "Volta" ? params.tipo : "Todas";
  const date = typeof params.data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.data) ? params.data : "";
  const page = Math.max(1, Math.min(10000, Math.floor(Number(params.pagina) || 1)));
  const pageSize = 24;

  let query = supabase
    .from("caronas")
    .select("*, usuarios(nome, orgao, telefone)", { count: "exact" })
    .eq("ativa", true)
    .gte("data_carona", today)
    .order("data_carona")
    .order("horario_saida")
    .order("id");
  if (tipo !== "Todas") query = query.eq("tipo_trajeto", tipo);
  if (date) query = query.eq("data_carona", date);
  const { data, error, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
  const rides = (data ?? []) as unknown as CaronaComMotorista[];

  return (
    <AppShell userName={user.user_metadata?.nome ?? user.email ?? "Servidor"}>
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-7 sm:py-9">
        <section aria-labelledby="ride-board-title">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 id="ride-board-title" className="text-2xl font-bold tracking-tight sm:text-3xl">
                Caronas disponíveis
              </h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Encontre as próximas caronas de ida e volta da CAMG.
              </p>
            </div>
            <Link
              href="/caronas/nova"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#174b38] px-5 font-bold text-white hover:bg-[#103b2b]"
            >
              Oferecer carona <ArrowRight size={17} />
            </Link>
          </div>
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
              Não foi possível carregar as caronas. Tente novamente em alguns instantes.
            </div>
          ) : (
            <RideBoard key={`${tipo}-${date}-${page}`} rides={rides} tipo={tipo} date={date} page={page} total={count ?? 0} pageSize={pageSize} />
          )}
        </section>

        <footer className="mt-12 flex flex-col gap-2 border-t border-[var(--line)] py-5 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>BlablaCAMG · Mobilidade compartilhada entre servidores</span>
          <span className="inline-flex items-center gap-1.5">
            <CircleHelp size={14} /> Combine ponto e horário diretamente com o motorista.
          </span>
        </footer>
      </div>
      <AssistantWidget />
    </AppShell>
  );
}
