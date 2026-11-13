"use client";

import { type FormEvent, useState } from "react";
import { MessageCircle } from "lucide-react";
import { estimateRideDistance, formatSuggestedPrice } from "@/lib/ride-price";

const buttonClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#137a50] px-4 py-2 text-sm font-bold text-white hover:bg-[#105e3e] disabled:opacity-60";

export function RideWhatsApp({ phone, message, origin, destination }: {
  phone: string;
  message: string;
  origin: string;
  destination: string;
}) {
  const [open, setOpen] = useState(false);
  const [pickup, setPickup] = useState(origin);
  const [dropoff, setDropoff] = useState(destination);
  const [meters, setMeters] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!pickup.trim() || !dropoff.trim()) {
      setError("Informe o embarque e o desembarque.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      setMeters(await estimateRideDistance(pickup.trim(), dropoff.trim()));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não consegui calcular o seu trecho.");
    } finally {
      setBusy(false);
    }
  }

  const price = meters === null ? null : formatSuggestedPrice(meters);
  const segmentMessage = `${message}\n\nMeu embarque seria em ${pickup.trim()} e o desembarque em ${dropoff.trim()}.`;
  const whatsapp = (text: string) => `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

  return (
    <>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className={buttonClass}>
        <MessageCircle size={16} /> Chamar no WhatsApp
      </button>
      {open && (
        <form onSubmit={calculate} className="w-full space-y-3 rounded-xl bg-emerald-50/60 p-4 text-sm">
          <p className="font-semibold">Qual trecho você vai percorrer?</p>
          <p className="text-xs text-slate-600">Se for descer no meio do caminho, informe seu ponto de desembarque.</p>
          <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              Embarque
              <input required maxLength={150} value={pickup} onChange={(event) => {
                setPickup(event.target.value);
                setMeters(null);
                setError("");
              }} className="min-w-0 rounded-lg border bg-white p-2" />
            </label>
            <label className="grid gap-1">
              Desembarque
              <input required maxLength={150} value={dropoff} onChange={(event) => {
                setDropoff(event.target.value);
                setMeters(null);
                setError("");
              }} className="min-w-0 rounded-lg border bg-white p-2" />
            </label>
          </fieldset>
          <div aria-live="polite">
            {error && <p className="text-rose-800">{error}</p>}
            {price && <p className="font-semibold text-emerald-900">{price} sugeridos para o seu trecho</p>}
          </div>
          {price ? (
            <a href={whatsapp(`${segmentMessage}\n\nO preço da carona sugerido pelo BlablaCAMG é ${price}, de acordo com a quilometragem estimada do meu trecho.`)} target="_blank" rel="noopener noreferrer" className={buttonClass}>
              Abrir WhatsApp com o valor
            </a>
          ) : (
            <button type="submit" disabled={busy} className={buttonClass}>
              {busy ? "Calculando..." : "Calcular meu trecho"}
            </button>
          )}
          <a href={whatsapp(message)} target="_blank" rel="noopener noreferrer" className="block text-xs text-emerald-900 underline">
            Abrir WhatsApp sem estimativa
          </a>
        </form>
      )}
    </>
  );
}
