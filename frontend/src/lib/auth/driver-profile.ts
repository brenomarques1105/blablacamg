import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function ensureDriverProfile(user: User) {
  const profile = user.user_metadata;
  if (profile?.perfil !== "motorista") return { error: null };
  const nome = typeof profile.nome === "string" ? profile.nome.trim() : "";
  const orgao = typeof profile.orgao === "string" ? profile.orgao.trim() : "";
  const telefone = typeof profile.telefone === "string" ? profile.telefone.replace(/\D/g, "") : "";
  if (!nome || !orgao || telefone.length < 10 || telefone.length > 11) return { error: new Error("Os dados do perfil de motorista estão incompletos.") };
  const supabase = await createClient();
  // Confirmation/recovery links must never overwrite a profile edited since signup.
  const { error } = await supabase.from("usuarios").upsert({ id: user.id, nome, orgao, telefone }, { onConflict: "id", ignoreDuplicates: true });
  return { error };
}
