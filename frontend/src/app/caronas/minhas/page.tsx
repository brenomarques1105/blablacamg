import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { MyRides } from "@/components/my-rides";
import { createClient } from "@/lib/supabase/server";
import { todayInSaoPaulo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MyRidesPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) redirect("/");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await supabase.from("caronas").select("*")
    .eq("motorista_id", user.id).gte("data_carona", todayInSaoPaulo())
    .order("data_carona").order("horario_saida");

  return <AppShell userName={user.user_metadata?.nome ?? user.email ?? "Servidor"}>
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-7">
      <h1 className="text-3xl font-bold">Minhas caronas</h1>
      <p className="mt-2 text-sm text-slate-600">Gerencie as próximas viagens que você oferece. Desative uma oferta quando ela não estiver mais disponível.</p>
      {error ? <p role="alert" className="mt-6 rounded-xl bg-rose-50 p-4 text-rose-800">Não foi possível carregar suas caronas. Tente novamente.</p> : <MyRides rides={data ?? []} />}
    </main>
  </AppShell>;
}
