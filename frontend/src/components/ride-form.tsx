"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarPlus,
  CheckCircle2,
  LoaderCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { TipoTrajeto, Usuario } from "@/lib/database.types";
import { todayInSaoPaulo } from "@/lib/format";
import { weekDates } from "@/lib/ride-dates";

const CAMG = "CAMG";
const CAMG_DESTINATION = "Cidade Administrativa (CAMG)";

export function RideForm({ initialProfile }: { initialProfile: Pick<Usuario, "nome" | "orgao" | "telefone"> }) {
  const router = useRouter();
  const [tipo, setTipo] = useState<TipoTrajeto>("Ida");
  const [bairroOrigem, setBairroOrigem] = useState("");
  const [destino, setDestino] = useState(CAMG_DESTINATION);
  const [rota, setRota] = useState("");
  const [horarios, setHorarios] = useState<Record<TipoTrajeto, string>>({
    Ida: "07:30",
    Volta: "17:00",
  });
  const horario = horarios[tipo];
  const [vagas, setVagas] = useState("3");
  const [dates, setDates] = useState<string[]>([]);
  const [dateToAdd, setDateToAdd] = useState("");
  const [weekStart, setWeekStart] = useState(todayInSaoPaulo);
  const [nome, setNome] = useState(initialProfile.nome);
  const [orgao, setOrgao] = useState(initialProfile.orgao);
  const [telefone, setTelefone] = useState(initialProfile.telefone ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function changeType(value: TipoTrajeto) {
    if (value === tipo) return;
    const home = tipo === "Ida" ? bairroOrigem : destino;
    setTipo(value);
    if (value === "Ida") {
      setDestino(CAMG_DESTINATION);
      setBairroOrigem(home);
    } else {
      setBairroOrigem(CAMG);
      setDestino(home);
    }
  }

  function addDate() {
    if (!dateToAdd || dateToAdd < todayInSaoPaulo() || dates.includes(dateToAdd)) return;
    setDates((current) => [...current, dateToAdd].sort());
    setDateToAdd("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setSuccess("");

    const phone = telefone.replace(/\D/g, "");
    const seatCount = Number(vagas);
    if (!dates.length) {
      setError("Selecione pelo menos uma data para a carona.");
      setBusy(false);
      return;
    }
    if (dates.some((date) => date < todayInSaoPaulo())) {
      setError("Remova as datas que já passaram antes de publicar.");
      setBusy(false);
      return;
    }
    if (!nome.trim() || !orgao.trim() || phone.length < 10 || phone.length > 11) {
      setError("Confira nome, órgão e telefone com DDD.");
      setBusy(false);
      return;
    }
    if (!bairroOrigem.trim() || !destino.trim() || !rota.trim()) {
      setError("Preencha origem, destino e rota principal.");
      setBusy(false);
      return;
    }
    if (!Number.isInteger(seatCount) || seatCount < 1 || seatCount > 8) {
      setError("Informe de 1 a 8 vagas.");
      setBusy(false);
      return;
    }

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sua sessão expirou. Entre novamente.");

      const { error: profileError } = await supabase
        .from("usuarios")
        .upsert(
          {
            id: user.id,
            nome: nome.trim(),
            orgao: orgao.trim(),
            telefone: phone,
          },
          { onConflict: "id" },
        );
      if (profileError) throw profileError;

      const rows = dates.map((date) => ({
        motorista_id: user.id,
        tipo_trajeto: tipo,
        bairro_origem: bairroOrigem.trim(),
        rota_principal: rota.trim(),
        destino: destino.trim(),
        data_carona: date,
        horario_saida: horario,
        vagas: seatCount,
      }));
      const { error: insertError } = await supabase.from("caronas").insert(rows);
      if (insertError) throw insertError;

      setSuccess(`${rows.length} ${rows.length === 1 ? "carona cadastrada" : "caronas cadastradas"} com sucesso.`);
      setDates([]);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível cadastrar a carona. Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <section className="rounded-3xl border border-[var(--line)] bg-white p-5 sm:p-7">
          <StepNumber number="1" title="Contato da carona" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {!initialProfile.nome && <Field
              label="Nome do motorista"
              value={nome}
              onChange={setNome}
              placeholder="Seu nome"
              required
            />}
            {!initialProfile.orgao && <Field
              label="Órgão"
              value={orgao}
              onChange={setOrgao}
              placeholder="Ex.: SEPLAG"
              required
            />}
            <div className="sm:col-span-2">
              <Field
                label="Telefone com DDD"
                value={telefone}
                onChange={setTelefone}
                placeholder="31999999999"
                inputMode="tel"
                required
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Usaremos este número no botão de contato do WhatsApp.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--line)] bg-white p-5 sm:p-7">
          <StepNumber number="2" title="Detalhes do trajeto" />
          <div className="mt-5">
            <span className="mb-2 block text-sm font-semibold">Tipo de trajeto</span>
            <div className="grid grid-cols-2 gap-2">
              {(["Ida", "Volta"] as const).map((value) => (
                <button
                  aria-pressed={tipo === value}
                  key={value}
                  type="button"
                  onClick={() => changeType(value)}
                  className={`rounded-xl border px-4 py-3 text-sm font-bold ${
                    tipo === value
                      ? "border-emerald-700 bg-emerald-50 text-emerald-950"
                      : "border-[var(--line)] text-slate-600"
                  }`}
                >
                  {value} {value === "Ida" ? "para a CAMG" : "saindo da CAMG"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Bairro de origem"
              value={bairroOrigem}
              onChange={setBairroOrigem}
              placeholder={tipo === "Ida" ? "Ex.: Buritis" : CAMG}
              required
              disabled={tipo === "Volta"}
            />
            <Field
              label="Destino"
              value={destino}
              onChange={setDestino}
              placeholder={tipo === "Volta" ? "Ex.: Buritis" : CAMG_DESTINATION}
              required
              disabled={tipo === "Ida"}
            />
            <div className="sm:col-span-2">
              <label htmlFor="rota" className="mb-1.5 block text-sm font-semibold">
                Rota principal
              </label>
              <textarea
                id="rota"
                value={rota}
                onChange={(event) => setRota(event.target.value)}
                required
                rows={3}
                placeholder="Av. Antônio Carlos, Pedro I, MG-010"
                className="w-full resize-y rounded-xl border border-[var(--line)] px-3 py-2.5 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-50"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Inclua as avenidas principais para ajudar o assistente a encontrar combinações.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--line)] bg-white p-5 sm:p-7">
          <StepNumber number="3" title="Datas e horário" />
          <div className="mt-5 rounded-2xl bg-emerald-50/60 p-4">
            <label htmlFor="week-start" className="block text-sm font-semibold">Sua rotina da semana</label>
            <p className="mt-1 text-xs leading-5 text-slate-600">Escolha o início da semana e marque os dias em que vai oferecer a mesma carona.</p>
            <input id="week-start" type="date" min={todayInSaoPaulo()} value={weekStart} onChange={(event) => setWeekStart(event.target.value)} className="mt-3 h-11 rounded-xl border border-[var(--line)] bg-white px-3 text-sm" />
            <div className="mt-3 flex flex-wrap gap-2">
              {weekDates(weekStart).map(({ date }) => <label key={date} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs ${dates.includes(date) ? "border-emerald-700 bg-white text-emerald-950" : "border-[var(--line)] bg-white/70 text-slate-600"}`}>
                <input type="checkbox" disabled={busy || date < todayInSaoPaulo()} checked={dates.includes(date)} onChange={(event) => setDates((current) => event.target.checked ? [...new Set([...current, date])].sort() : current.filter((item) => item !== date))} className="accent-emerald-800" />
                {formatDate(date)}
              </label>)}
            </div>
            <button type="button" disabled={busy} onClick={() => setDates((current) => [...new Set([...current, ...weekDates(weekStart).filter(({ date, weekday }) => date >= todayInSaoPaulo() && weekday !== 0 && weekday !== 6).map(({ date }) => date)])].sort())} className="mt-3 text-xs font-bold text-emerald-900 underline underline-offset-4">Selecionar dias de segunda a sexta</button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div>
              <label htmlFor="dateToAdd" className="mb-1.5 block text-sm font-semibold">
                Adicionar data
              </label>
              <input
                id="dateToAdd"
                type="date"
                min={todayInSaoPaulo()}
                value={dateToAdd}
                onChange={(event) => setDateToAdd(event.target.value)}
                className="h-12 w-full rounded-xl border border-[var(--line)] px-3 outline-none focus:border-emerald-700"
              />
            </div>
            <div>
              <label htmlFor="horario" className="mb-1.5 block text-sm font-semibold">
                Horário de saída
              </label>
              <input
                id="horario"
                type="time"
                required
                value={horario}
                onChange={(event) => {
                  const value = event.target.value;
                  setHorarios((current) => ({ ...current, [tipo]: value }));
                }}
                className="h-12 w-full rounded-xl border border-[var(--line)] px-3 outline-none focus:border-emerald-700"
              />
            </div>
            <button
              type="button"
              onClick={addDate}
              disabled={!dateToAdd}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-emerald-800 px-4 text-sm font-bold text-emerald-900 disabled:opacity-40"
            >
              <CalendarPlus size={17} /> Adicionar
            </button>
          </div>

          {dates.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {dates.map((date) => (
                <span
                  key={date}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-950"
                >
                  {formatDate(date)}
                  <button
                    type="button"
                    aria-label={`Remover ${date}`}
                    onClick={() => setDates((current) => current.filter((item) => item !== date))}
                    className="text-emerald-800"
                  >
                    <Trash2 size={14} />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-500">
              Adicione uma ou mais datas. A mesma rota será cadastrada para cada dia escolhido.
            </p>
          )}

          <div className="mt-4 max-w-[220px]">
            <label htmlFor="vagas" className="mb-1.5 block text-sm font-semibold">
              Vagas disponíveis
            </label>
            <input
              id="vagas"
              type="number"
              min="1"
              max="8"
              value={vagas}
              onChange={(event) => setVagas(event.target.value)}
              className="h-12 w-full rounded-xl border border-[var(--line)] px-3 outline-none focus:border-emerald-700"
            />
          </div>
        </section>

        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
            <CheckCircle2 size={17} /> {success}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-[var(--line)] px-5 text-sm font-semibold text-slate-600"
          >
            Cancelar
          </Link>
          <button
            disabled={busy}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#174b38] px-6 text-sm font-bold text-white hover:bg-[#103b2b] disabled:opacity-60"
          >
            {busy ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : (
              <>
                <Plus size={18} /> Publicar {dates.length || "carona(s)"}
              </>
            )}
          </button>
        </div>
      </div>

      <aside className="h-fit rounded-3xl bg-[#eaf4ed] p-5">
        <span className="grid size-10 place-items-center rounded-xl bg-white text-emerald-900">
          <CheckCircle2 size={19} />
        </span>
        <h2 className="mt-4 font-bold">Antes de publicar</h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
          <li>Confira se as principais avenidas estão na rota.</li>
          <li>Para ida, o destino é fixado na CAMG.</li>
          <li>Para volta, a origem é fixada como CAMG.</li>
          <li>Você pode cadastrar a mesma viagem em várias datas.</li>
        </ul>
        <p className="mt-4 border-t border-emerald-900/10 pt-4 text-xs leading-5 text-slate-500">
          Os passageiros também precisam entrar na conta para consultar as caronas e usar o
          assistente.
        </p>
      </aside>
    </form>
  );
}

function StepNumber({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-8 place-items-center rounded-full bg-[#174b38] text-sm font-bold text-white">
        {number}
      </span>
      <h2 className="text-lg font-bold">{title}</h2>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  inputMode?: "text" | "tel";
}) {
  const id = label.toLowerCase().replaceAll(" ", "-");
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        inputMode={inputMode}
        className="h-12 w-full rounded-xl border border-[var(--line)] bg-white px-3 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-50 disabled:bg-slate-100 disabled:text-slate-500"
      />
    </div>
  );
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}
