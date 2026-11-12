"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="grid min-h-screen place-items-center px-5"><section className="max-w-md rounded-3xl border bg-white p-8"><h1 className="text-2xl font-bold">Não foi possível carregar esta página</h1><p className="mt-3 text-slate-600">Verifique sua conexão e tente novamente.</p><button onClick={reset} className="mt-5 rounded-xl bg-emerald-900 px-5 py-3 font-bold text-white">Tentar novamente</button></section></main>;
}
