import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

// Supprime toutes les données liées à une room si elle est vide de joueurs.
export async function POST(request: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Service key manquant" }, { status: 500 });
  const { roomCode } = await request.json();
  if (!roomCode) return NextResponse.json({ error: "roomCode manquant" }, { status: 400 });

  // Vérifie s'il reste des joueurs rattachés à cette room.
  const { count: playerCount, error: playerCountErr } = await supabaseAdmin
    .from("players")
    .select("*", { count: "exact", head: true })
    .eq("room_code", roomCode);

  if (playerCountErr) {
    return NextResponse.json({ error: "Erreur lors du comptage des joueurs" }, { status: 500 });
  }

  if (playerCount && playerCount > 0) {
    return NextResponse.json(
      { error: "Impossible de nettoyer : des joueurs sont encore présents", playerCount },
      { status: 409 },
    );
  }

  // Suppressions en cascade (ordre pour limiter les contraintes FK éventuelles).
  await supabaseAdmin.from("drawings").delete().eq("room_code", roomCode);
  await supabaseAdmin.from("votes").delete().eq("room_code", roomCode);
  await supabaseAdmin.from("chameleon_accusations").delete().eq("room_code", roomCode);
  await supabaseAdmin.from("rounds").delete().eq("room_code", roomCode);
  await supabaseAdmin.from("players").delete().eq("room_code", roomCode);
  await supabaseAdmin.from("rooms").delete().eq("code", roomCode);

  return NextResponse.json({ ok: true });
}
