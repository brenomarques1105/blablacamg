import Link from "next/link";
import {
  ArrowRight,
  CarFront,
  CircleHelp,
  MapPin,
  ShieldCheck,
  Sparkles,
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
        <section className="relative overflow-hidden rounded-[2rem] bg-[#123f30] px-6 py-8 text-white sm:px-10 sm:py-10">
          <div className="absolute -right-12 -top-24 size-72 rounded-full border-[36px] border-white/5" />
          <div className="absolute -bottom-32 right-36 size-64 rounded-full bg-emerald-400/10 blur-2xl" />
          <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-emerald-100">
                <MapPin size={14} /> CIDADE ADMINISTRATIVA · MG
              </span>
              <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
                O caminho fica melhor{" "}
                <span className="text-emerald-300">compartilhado.</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-emerald-50/80 sm:text-base">
                Encontre uma carona com quem já vai para o mesmo lado. Mais conexão entre
                servidores, menos carros no caminho.
              </p>
            </div>
            <Link
              href="/caronas/nova"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#c4f36c] px-5 font-bold text-[#163b2d] transition hover:bg-[#d5ff8b]"
            >
              Oferecer carona <ArrowRight size={17} />
            </Link>
          </div>
          <div className="relative mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/15 pt-5 text-xs text-emerald-50/75">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={15} /> Acesso autenticado para todos
            </span>
            <span className="inline-flex items-center gap-2">
              <Sparkles size={15} /> Assistente inteligente de rotas
            </span>
          </div>
        </section>

        <section className="mt-9">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">
                Comunidade CAMG
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Caronas disponíveis
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Veja as próximas viagens oferecidas por servidores.
              </p>
            </div>
            <span className="hidden items-center gap-1.5 pb-1 text-xs text-[var(--muted)] sm:flex">
              <CarFront size={16} /> Ida e volta
            </span>
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
