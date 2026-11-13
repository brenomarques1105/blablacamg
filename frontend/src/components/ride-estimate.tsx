"use client";

import { useState } from "react";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const distance = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

export function RideEstimate({ origin, destination }: { origin: string; destination: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [estimate, setEstimate] = useState<{ meters: number; cents: number } | null>(null);

  async function calculate() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/estimativa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origem: origin, destino: destination }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error);
        return;
      }
      setEstimate(result);
    } catch {
      setError("Não consegui calcular a estimativa agora.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 text-sm" aria-live="polite">
      {estimate ? (
        <p>
          <strong>{money.format(estimate.cents / 100)} sugeridos</strong>
          {" · aprox. "}{distance.format(estimate.meters / 1000)} km
          <span className="block text-xs text-slate-600">Estimativa por IA · R$ 0,80/km</span>
        </p>
      ) : (
        <button type="button" disabled={busy} onClick={calculate} className="font-semibold text-emerald-800 underline disabled:opacity-60">
          {busy ? "Calculando..." : "Calcular preço sugerido"}
        </button>
      )}
      {error && <p className="mt-1 text-xs text-rose-800">{error}</p>}
    </div>
  );
}
