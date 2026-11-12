import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const validTypes = new Set(["Ida", "Volta"]);

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  if (!request.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ error: "Envie JSON." }, { status: 415 });
  if (Number(request.headers.get("content-length")) > 8_000) return NextResponse.json({ error: "Mensagem muito longa." }, { status: 413 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return NextResponse.json({ error: "O serviço está temporariamente indisponível." }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Entre na sua conta para usar o assistente." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Envie uma requisição JSON válida." }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const payload = body as { tipo_trajeto?: unknown; mensagem?: unknown };
  const tipo = payload.tipo_trajeto;
  const mensagem = typeof payload.mensagem === "string" ? payload.mensagem.trim() : "";
  if (typeof tipo !== "string" || !validTypes.has(tipo)) return NextResponse.json({ error: "Selecione Ida ou Volta." }, { status: 400 });
  if (mensagem.length < 4 || mensagem.length > 1500) return NextResponse.json({ error: "A mensagem deve ter entre 4 e 1.500 caracteres." }, { status: 400 });

  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) return NextResponse.json({ error: "O assistente está temporariamente indisponível. Tente novamente mais tarde." }, { status: 503 });
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  if (process.env.N8N_WEBHOOK_AUTH_TOKEN) headers["X-Webhook-Secret"] = process.env.N8N_WEBHOOK_AUTH_TOKEN;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ tipo_trajeto: tipo, mensagem }),
      cache: "no-store",
      signal: AbortSignal.timeout(90_000),
      redirect: "error",
    });
    if (!response.ok) return NextResponse.json({ error: "O assistente não conseguiu processar a solicitação." }, { status: 502 });
    const result: unknown = await response.json();
    const text = result && typeof result === "object" && "text" in result && typeof result.text === "string" ? result.text.trim() : "";
    if (!text) return NextResponse.json({ error: "O assistente retornou uma resposta vazia." }, { status: 502 });
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ error: "Não foi possível conectar ao assistente. Tente novamente." }, { status: 502 });
  }
}
