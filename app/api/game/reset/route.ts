import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Service key manquant" }, { status: 500 });
  const { roomCode } = await request.json();
  if (!roomCode) return NextResponse.json({ error: "roomCode manquant" }, { status: 400 });

  await supabaseAdmin
    .from("players")
    .update({
      is_ready: false,
      is_eliminated: false,
      has_used_chameleon_accusation: false,
      is_in_lobby: false,
      dictator_immunity_used: false,
      dictator_double_vote_active: false,
    })
    .eq("room_code", roomCode);

  await supabaseAdmin
    .from("rooms")
    .update({ current_phase: "LOBBY" })
    .eq("code", roomCode);

  // ─── Supprime les fichiers PNG du bucket Storage pour cette room ──────────
  // Les dessins sont maintenant dans storage.drawings/{roomCode}/*.png
  // Il faut les supprimer ici pour ne pas accumuler des fichiers orphelins.
  const { data: storageFiles } = await supabaseAdmin.storage
    .from("drawings")
    .list(roomCode);

  if (storageFiles && storageFiles.length > 0) {
    const paths = storageFiles.map((f) => `${roomCode}/${f.name}`);
    await supabaseAdmin.storage.from("drawings").remove(paths);
  }

  // Nettoyage complet des données de manche pour repartir sainement
  await Promise.all([
    supabaseAdmin.from("drawings").delete().eq("room_code", roomCode),
    supabaseAdmin.from("votes").delete().eq("room_code", roomCode),
    supabaseAdmin.from("chameleon_accusations").delete().eq("room_code", roomCode),
    supabaseAdmin.from("rounds").delete().eq("room_code", roomCode),
  ]);

  return NextResponse.json({ ok: true });
}
