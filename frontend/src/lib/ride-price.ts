export function suggestedPriceCents(distanceMeters: number) {
  return Math.round(distanceMeters * 80 / 1000);
}

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatSuggestedPrice(distanceMeters: number) {
  return currency.format(suggestedPriceCents(distanceMeters) / 100);
}

export async function estimateRideDistance(origin: string, destination: string): Promise<number> {
  const response = await fetch("/api/estimativa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ origem: origin, destino: destination }),
  });
  const result = await response.json();
  if (!response.ok || !Number.isInteger(result?.meters) || result.meters < 100 || result.meters > 150000) {
    throw new Error(typeof result?.error === "string" ? result.error : "Não consegui calcular a estimativa agora.");
  }
  return result.meters;
}
