"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { CheckCircle2, LoaderCircle, LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function NewPasswordForm() {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [done, setDone] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget); const password = String(form.get("password") ?? ""); const confirm = String(form.get("confirm") ?? "");
    if (password.length < 8 || password !== confirm) { setError(password.length < 8 ? "Use pelo menos 8 caracteres." : "As senhas não coincidem."); setBusy(false); return; }
    try {
      const { error: updateError } = await createClient().auth.updateUser({ password });
      if (updateError) setError("O link expirou ou não é válido. Solicite uma nova recuperação."); else setDone(true);
    } catch { setError("Não foi possível conectar. Tente novamente."); }
    finally { setBusy(false); }
  }
  return <div className="w-full max-w-md"><section className="surface-shadow rounded-[1.75rem] border border-[var(--line)] bg-white p-6 sm:p-8"><span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-900"><LockKeyhole size={21}/></span><h1 className="mt-5 text-2xl font-bold">Criar nova senha</h1>{done ? <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900"><p className="flex items-center gap-2 font-semibold"><CheckCircle2 size={17}/>Senha atualizada.</p><Link href="/" className="mt-3 inline-block font-bold underline">Continuar para o BlablaCAMG</Link></div> : <form onSubmit={submit} className="mt-5 space-y-4"><div><label htmlFor="password" className="mb-1.5 block text-sm font-semibold">Nova senha</label><input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required className="h-12 w-full rounded-xl border border-[var(--line)] px-3 outline-none focus:border-emerald-700"/></div><div><label htmlFor="confirm" className="mb-1.5 block text-sm font-semibold">Confirme a senha</label><input id="confirm" name="confirm" type="password" minLength={8} autoComplete="new-password" required className="h-12 w-full rounded-xl border border-[var(--line)] px-3 outline-none focus:border-emerald-700"/></div>{error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}<button disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#174b38] font-bold text-white disabled:opacity-60">{busy ? <LoaderCircle className="animate-spin" size={18}/> : "Salvar nova senha"}</button></form>}</section></div>;
}
