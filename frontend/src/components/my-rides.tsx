"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Carona } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/client";

export function MyRides({ rides }: { rides: Carona[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function toggle(ride: Carona) {
    if (busy) return;
    setBusy(ride.id);
    setError("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const { data, error } = await supabase.from("caronas").update({ ativa: !ride.ativa })
        .eq("id", ride.id).eq("motorista_id", user.id).select("id");
      if (error || !data?.length) throw new Error("Não foi possível atualizar esta carona. Tente novamente.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível atualizar a carona.");
    } finally { setBusy(null); }
  }

  return <div className="mt-6 space-y-4">
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-800">{error}</p>}
    {!rides.length && <p className="rounded-2xl border bg-white p-6">Você ainda não tem caronas futuras. <Link className="font-semibold text-emerald-800 underline" href="/caronas/nova">Oferecer carona</Link></p>}
    {rides.map((ride) => <article key={ride.id} className="flex flex-col justify-between gap-4 rounded-2xl border border-[var(--line)] bg-white p-5 sm:flex-row sm:items-center">
      <div className="min-w-0 break-words">
        <p className="font-bold">{ride.bairro_origem} → {ride.destino}</p>
        <p className="mt-1 text-sm text-slate-600">{ride.data_carona.split("-").reverse().join("/")} às {ride.horario_saida.slice(0, 5)} · {ride.tipo_trajeto} · {ride.vagas} vaga(s)</p>
        <p className="mt-2 text-xs font-semibold text-emerald-800">{ride.ativa ? "Disponível no mural" : "Desativada"}</p>
      </div>
      <button disabled={busy !== null} onClick={() => toggle(ride)} className="shrink-0 rounded-xl border border-emerald-800 px-4 py-3 text-sm font-bold text-emerald-900 disabled:opacity-50">{busy === ride.id ? "Atualizando..." : ride.ativa ? "Desativar carona" : "Reativar carona"}</button>
    </article>)}
  </div>;
}
