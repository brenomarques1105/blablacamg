"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { ArrowLeft, CheckCircle2, LoaderCircle, Mail, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function PasswordResetForm() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim().toLowerCase();
    try {
      const { error: resetError } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha` });
      if (resetError) setError("Não foi possível enviar o link. Confira o e-mail e tente novamente.");
      else setSent(true);
    } catch { setError("Não foi possível conectar. Tente novamente."); }
    finally { setBusy(false); }
  }

  return <div className="w-full max-w-md"><Link href="/login" className="mb-8 flex items-center gap-2 text-sm font-semibold text-emerald-900"><ArrowLeft size={16}/>Voltar ao login</Link><section className="surface-shadow rounded-[1.75rem] border border-[var(--line)] bg-white p-6 sm:p-8"><span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-900"><ShieldCheck size={21}/></span><h1 className="mt-5 text-2xl font-bold">Recuperar acesso</h1><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Enviaremos um link de redefinição para o e-mail da sua conta.</p>{sent ? <p role="status" className="mt-5 flex gap-2 rounded-xl bg-emerald-50 p-3 text-sm leading-6 text-emerald-900"><CheckCircle2 className="mt-1 shrink-0" size={17}/>Se o endereço estiver cadastrado, você receberá um e-mail com as instruções.</p> : <form onSubmit={submit} className="mt-5 space-y-4"><div><label htmlFor="email" className="mb-1.5 block text-sm font-semibold">E-mail</label><div className="relative"><Mail className="absolute left-3 top-3.5 text-slate-400" size={17}/><input id="email" name="email" type="email" autoComplete="email" required className="h-12 w-full rounded-xl border border-[var(--line)] pl-10 pr-3 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-50" placeholder="nome@orgao.mg.gov.br"/></div></div>{error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}<button disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#174b38] font-bold text-white disabled:opacity-60">{busy ? <LoaderCircle className="animate-spin" size={18}/> : "Enviar link"}</button></form>}</section></div>;
}
