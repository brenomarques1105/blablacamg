"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/navigation";
import { whatsappPhone } from "@/lib/format";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const isSignup = mode === "signup";

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("erro") === "confirmacao") {
      setError("O link de confirmação expirou ou não é válido. Solicite um novo link ou tente entrar na sua conta.");
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");

    try {
      const supabase = createClient();
      if (!isSignup) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
        if (!data.session) throw new Error("Não foi possível iniciar a sessão. Tente entrar novamente.");

        const next = new URLSearchParams(window.location.search).get("next");
        const destination = safeNextPath(next);
        window.location.replace(destination);
        return;
      }

      if (password.length < 8) {
        throw new Error("Use uma senha com pelo menos 8 caracteres.");
      }

      const nome = String(form.get("nome") ?? "").trim();
      const orgao = String(form.get("orgao") ?? "").trim();
      if (!nome || !orgao) throw new Error("Informe seu nome e órgão.");

      const phone = whatsappPhone(String(form.get("telefone") ?? ""));
      if (!phone) throw new Error("Informe um telefone com DDD.");

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nome, orgao, telefone: phone.slice(2) },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (authError) throw authError;

      if (data.session) {
        window.location.replace("/");
        return;
      }

      setNotice("Conta criada. Confirme seu e-mail pelo link enviado para ativar o acesso.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível concluir. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <Link href="/" className="mb-8 flex items-center gap-3">
        <Image src="/blablacamg-mark.webp" alt="" width={72} height={72} unoptimized className="shrink-0 rounded-xl" />
        <span className="text-2xl font-extrabold">
          Blabla<span className="text-emerald-700">CAMG</span>
        </span>
      </Link>

      <div className="surface-shadow rounded-[1.75rem] border border-[var(--line)] bg-white p-6 sm:p-8">
        <div className="mb-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-900">
            <ShieldCheck size={14} /> Acesso seguro
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            {isSignup ? "Crie sua conta" : "Bem-vindo de volta"}
          </h1>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            {isSignup
              ? "Entre para encontrar ou oferecer caronas na CAMG."
              : "Entre com seu e-mail para continuar no BlablaCAMG."}
          </p>
        </div>

        {!isSignup && (
          <p className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">
            <strong>Exclusivo para servidores.</strong> Somente são permitidos e-mails institucionais.
          </p>
        )}

        <form onSubmit={submit} className="space-y-4">
          {isSignup && (
            <>
              <Field label="Nome completo" name="nome" autoComplete="name" required />
              <Field label="Órgão" name="orgao" autoComplete="organization" placeholder="Ex.: SEPLAG" required />
            </>
          )}

          <Field
            label="E-mail institucional"
            name="email"
            type="email"
            placeholder="nome@orgao.mg.gov.br"
            required
            autoComplete="email"
          />

          {isSignup && (
            <div>
              <Field label="Telefone com DDD" name="telefone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(31) 99999-9999" required />
              <p className="mt-1 text-xs text-[var(--muted)]">
                Você poderá revisar este número ao oferecer uma carona.
              </p>
            </div>
          )}

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold">
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                minLength={isSignup ? 8 : undefined}
                autoComplete={isSignup ? "new-password" : "current-password"}
                required
                className="h-12 w-full rounded-xl border border-[var(--line)] bg-white px-3 pr-11 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                placeholder={isSignup ? "Mínimo de 8 caracteres" : "Sua senha"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-3 top-3.5 text-slate-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-800">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
              {notice}
            </p>
          )}

          <button
            disabled={busy}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#174b38] px-4 font-bold text-white transition hover:bg-[#103b2b] disabled:cursor-wait disabled:opacity-70"
          >
            {busy ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : (
              <>
                {isSignup ? "Criar conta" : "Entrar"} <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        {!isSignup && (
          <p className="mt-3 text-right text-sm">
            <Link href="/recuperar-senha" className="font-semibold text-emerald-800 hover:underline">
              Esqueci minha senha
            </Link>
          </p>
        )}
        <p className="mt-5 text-center text-sm text-[var(--muted)]">
          {isSignup ? "Já tem uma conta?" : "Ainda não tem uma conta?"}{" "}
          <Link
            className="font-bold text-emerald-800 hover:underline"
            href={isSignup ? "/login" : "/cadastro"}
          >
            {isSignup ? "Entrar" : "Cadastre-se"}
          </Link>
        </p>
        <p className="mt-5 text-center text-[11px] leading-5 text-slate-400">
          Sua conta é protegida pelo acesso autenticado do projeto.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  ...props
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <input
        id={name}
        name={name}
        {...props}
        className="h-12 w-full rounded-xl border border-[var(--line)] bg-white px-3 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
      />
    </div>
  );
}
