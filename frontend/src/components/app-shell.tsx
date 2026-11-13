"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  CarFront,
  CircleHelp,
  LogOut,
  Menu,
  Plus,
  Route,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/", label: "Mural de caronas", icon: Route },
  { href: "/caronas/nova", label: "Oferecer carona", icon: Plus },
  { href: "/caronas/minhas", label: "Minhas caronas", icon: CarFront },
];

export function AppShell({
  children,
  userName,
}: {
  children: ReactNode;
  userName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  async function signOut() {
    const { error } = await createClient().auth.signOut();
    if (error) { setSignOutError("Não foi possível sair. Tente novamente."); return; }
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="hidden border-r border-[var(--line)] bg-white px-4 py-6 lg:flex lg:flex-col">
        <Brand />
        <p className="mb-3 mt-10 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">
          Área do servidor
        </p>
        <nav className="space-y-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                pathname === href
                  ? "bg-emerald-50 text-emerald-900"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl bg-[#f3f7f4] p-4">
          <div className="grid size-9 place-items-center rounded-xl bg-white text-emerald-800">
            <CircleHelp size={18} />
          </div>
          <p className="mt-3 text-sm font-semibold">Dica de segurança</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Confirme os detalhes da carona diretamente com o servidor.
          </p>
        </div>
        <UserControl userName={userName} onSignOut={signOut} />
      </aside>

      <div className="min-w-0">
        {signOutError && <p role="alert" className="bg-rose-50 p-3 text-sm text-rose-800">{signOutError}</p>}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--line)] bg-white/95 px-4 backdrop-blur lg:hidden">
          <Brand />
          <button
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
            className="grid size-10 place-items-center rounded-xl border border-[var(--line)] text-slate-700"
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </header>
        {menuOpen && (
          <div className="fixed inset-x-0 top-16 z-20 border-b border-[var(--line)] bg-white p-4 shadow-lg lg:hidden">
            <nav className="space-y-1">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  onClick={() => setMenuOpen(false)}
                  key={href}
                  href={href}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700"
                >
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
            </nav>
            <UserControl userName={userName} onSignOut={signOut} />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <Image src="/blablacamg-mark.webp" alt="" width={40} height={40} unoptimized className="rounded-xl" />
      <span className="text-lg font-extrabold tracking-tight">
        Blabla<span className="text-emerald-700">CAMG</span>
      </span>
    </Link>
  );
}

function UserControl({
  userName,
  onSignOut,
}: {
  userName: string;
  onSignOut: () => void;
}) {
  return (
    <div className="mt-4 flex items-center gap-3 border-t border-[var(--line)] pt-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#e9efe9] text-sm font-bold text-emerald-900">
        {userName.slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{userName}</p>
        <p className="text-xs text-slate-500">Conta autenticada</p>
      </div>
      <button
        title="Sair"
        onClick={onSignOut}
        className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      >
        <LogOut size={17} />
      </button>
    </div>
  );
}
