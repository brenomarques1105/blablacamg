import "server-only";

function localAddress(value: unknown) {
  if (typeof value !== "string" || !value.trim() || value.length > 150) return null;
  const address = value.trim();
  if (/^(?:CAMG|Cidade Administrativa(?: \(CAMG\))?)$/i.test(address)) {
    return "Cidade Administrativa de Minas Gerais, Serra Verde, Belo Horizonte, MG, Brasil";
  }
  return `${address}, Belo Horizonte, MG, Brasil`;
}

export async function estimateDistanceMeters(from: unknown, to: unknown) {
  const origin = localAddress(from);
  const destination = localAddress(to);
  if (!origin || !destination) return { status: 400, error: "Informe origem e destino." } as const;

  const webhookUrl = process.env.N8N_ESTIMATIVA_WEBHOOK_URL;
  if (!webhookUrl) {
    return { status: 503, error: "O cálculo de distância ainda não está disponível." } as const;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const token = process.env.N8N_ESTIMATIVA_WEBHOOK_AUTH_TOKEN;
  if (token) headers["X-Webhook-Secret"] = token;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ origem: origin, destino: destination }),
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
      redirect: "error",
    });
    if (response.ok) {
      const data = await response.json();
      const km = data?.distancia_km;
      if (km === null) {
        return { status: 422, error: "Não consegui estimar a distância para esses pontos." } as const;
      }
      if (typeof km === "number" && Number.isFinite(km) && km >= 0.1 && km <= 150) {
        const meters = Math.round(km * 1000);
        return { meters };
      }
    }
  } catch {
    // Keep provider details and credentials out of the response.
  }
  return { status: 502, error: "Não consegui calcular a rota. Confira os pontos informados." } as const;
}
