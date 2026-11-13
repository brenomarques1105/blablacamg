"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CarFront,
  MapPin,
  MoveRight,
  Users,
} from "lucide-react";
import type { CaronaComMotorista, TipoTrajeto } from "@/lib/database.types";
import { whatsappPhone } from "@/lib/format";
import { RideEstimate } from "@/components/ride-estimate";
import { RideWhatsApp } from "@/components/ride-whatsapp";
import { formatSuggestedPrice } from "@/lib/ride-price";

export function RideBoard({ rides, tipo, date, page, total, pageSize }: {
  rides: CaronaComMotorista[]; tipo: "Todas" | TipoTrajeto; date: string; page: number; total: number; pageSize: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function filter(nextTipo = tipo, nextDate = date, nextPage = 1) {
    const params = new URLSearchParams();
    if (nextTipo !== "Todas") params.set("tipo", nextTipo);
    if (nextDate) params.set("data", nextDate);
    if (nextPage > 1) params.set("pagina", String(nextPage));
    startTransition(() => router.replace(`/?${params}`, { scroll: false }));
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {(["Todas", "Ida", "Volta"] as const).map((item) => (
            <button
              aria-pressed={tipo === item}
              key={item}
              disabled={pending}
              onClick={() => filter(item)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                tipo === item
                  ? "bg-[#174b38] text-white"
                  : "bg-[#f2f6f3] text-slate-600 hover:bg-emerald-50"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-slate-600">
          <CalendarDays size={16} />
          <span className="sr-only">Filtrar por data</span>
          <input
            type="date"
            value={date}
            disabled={pending}
            onChange={(event) => filter(tipo, event.target.value)}
            className="min-w-0 bg-transparent outline-none"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => filter(tipo, "")}
            className="text-xs font-semibold text-emerald-800"
          >
            Limpar
          </button>
        </label>
      </div>

      <p role="status" className="mb-4 text-xs text-slate-500">{pending ? "Buscando caronas..." : `${total} carona(s) encontrada(s)`}</p>
      {rides.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#cbd9ce] bg-white px-6 py-12 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-800">
            <CarFront size={25} />
          </span>
          <h3 className="mt-4 text-lg font-bold">Nenhuma carona encontrada</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-[var(--muted)]">
            Tente outra data ou ofereça uma carona para ajudar a comunidade da CAMG.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {rides.map((ride) => (
            <RideCard key={ride.id} ride={ride} />
          ))}
        </div>
      )}
      {(page > 1 || page * pageSize < total) && <div className="mt-5 flex items-center justify-between gap-3 text-sm">
        <button disabled={pending || page === 1} onClick={() => filter(tipo, date, page - 1)} className="rounded-xl border bg-white px-4 py-2 disabled:opacity-40">Anterior</button>
        <span>Página {page}</span>
        <button disabled={pending || page * pageSize >= total} onClick={() => filter(tipo, date, page + 1)} className="rounded-xl border bg-white px-4 py-2 disabled:opacity-40">Próxima</button>
      </div>}
    </>
  );
}

function RideCard({ ride }: { ride: CaronaComMotorista }) {
  const phone = whatsappPhone(ride.usuarios?.telefone ?? "");
  const distance = ride.distancia_estimada_metros;
  const price = distance == null ? null : formatSuggestedPrice(distance);
  const message = `Olá, ${ride.usuarios?.nome ?? "motorista"}! Vi sua carona de ${ride.data_carona.split("-").reverse().join("/")} às ${ride.horario_saida.slice(0, 5)} no BlablaCAMG e gostaria de combinar os detalhes.`;
  const date = new Date(`${ride.data_carona}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  return (
    <article className="surface-shadow rounded-3xl border border-[var(--line)] bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-[#e7f4ec] text-emerald-800">
            <CarFront size={23} />
          </span>
          <div>
            <p className="font-bold">{ride.usuarios?.nome ?? "Motorista"}</p>
            <p className="text-xs font-medium text-[var(--muted)]">
              {ride.usuarios?.orgao ?? "Servidor CAMG"}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-[#eaf5ee] px-3 py-1 text-xs font-bold text-emerald-900">
          {ride.tipo_trajeto}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-[#f5f8f5] p-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Saída</p>
          <p className="mt-1 text-lg font-extrabold">{ride.horario_saida.slice(0, 5)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Data</p>
          <p className="mt-1 text-sm font-bold capitalize">{date}</p>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-3 text-sm">
        <MapPin className="mt-0.5 shrink-0 text-emerald-800" size={17} />
        <p>
          <span className="font-semibold">{ride.bairro_origem}</span>
          <MoveRight className="mx-2 inline text-slate-400" size={14} />
          <span className="font-semibold">{ride.destino}</span>
        </p>
      </div>
      <p className="mt-3 pl-7 text-xs leading-5 text-[var(--muted)]">
        Rota: {ride.rota_principal}
      </p>
      {price ? (
        <p className="mt-3 text-sm text-emerald-900">
          <strong>{price} sugeridos</strong> para o trajeto completo
          <span className="block text-xs text-slate-600">Distância estimada por IA · R$ 0,80/km</span>
        </p>
      ) : ride.destino && <RideEstimate origin={ride.bairro_origem} destination={ride.destino} />}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <Users size={15} />
          {ride.vagas} {ride.vagas === 1 ? "vaga" : "vagas"}
        </span>
        {phone ? (
          <RideWhatsApp phone={phone} message={message} origin={ride.bairro_origem} destination={ride.destino ?? ""} />
        ) : (
          <span className="text-xs text-slate-500">Telefone indisponível</span>
        )}
      </div>
    </article>
  );
}
