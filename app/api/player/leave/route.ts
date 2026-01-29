import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

// Retire un joueur d'une room. Si plus aucun joueur ne reste, nettoie la room et ses données.
export async function POST(request: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Service key manquant" }, { status: 500 });
  const { roomCode, nickname } = await request.json();
  if (!roomCode || !nickname) {
    return NextResponse.json({ error: "roomCode et nickname requis" }, { status: 400 });
  }

  // Supprime le joueur (ou le marque absent)
  await supabaseAdmin.from("players").delete().eq("room_code", roomCode).eq("nickname", nickname);

  const { count: remaining, error: countErr } = await supabaseAdmin
    .from("players")
    .select("*", { count: "exact", head: true })
    .eq("room_code", roomCode);

  if (countErr) {
    return NextResponse.json({ error: "Erreur lors du comptage des joueurs" }, { status: 500 });
  }

  if (remaining && remaining > 0) {
    return NextResponse.json({ ok: true, cleaned: false, remaining });
  }

  // Plus aucun joueur : on nettoie tout pour éviter l'accumulation.
  await supabaseAdmin.from("drawings").delete().eq("room_code", roomCode);
  await supabaseAdmin.from("votes").delete().eq("room_code", roomCode);
  await supabaseAdmin.from("chameleon_accusations").delete().eq("room_code", roomCode);
  await supabaseAdmin.from("rounds").delete().eq("room_code", roomCode);
  await supabaseAdmin.from("players").delete().eq("room_code", roomCode);
  await supabaseAdmin.from("rooms").delete().eq("code", roomCode);

  return NextResponse.json({ ok: true, cleaned: true, remaining: 0 });
}
