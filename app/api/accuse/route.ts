import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Service key manquant" }, { status: 500 });
  const { roomCode, nickname, targetId } = await request.json();

  // Check quota
  const { data: player } = await supabaseAdmin
    .from("players")
    .select("has_used_chameleon_accusation, role")
    .eq("room_code", roomCode)
    .eq("nickname", nickname)
    .single();
  if (player?.role === "CAMELEON") {
    return NextResponse.json({ error: "Le Caméléon ne peut pas accuser" }, { status: 400 });
  }
  if (player?.has_used_chameleon_accusation) {
    return NextResponse.json({ error: "Déjà utilisé" }, { status: 400 });
  }

  await supabaseAdmin.from("chameleon_accusations").insert({
    room_code: roomCode,
    accuser_nickname: nickname,
    target_player_id: targetId,
  });
  await supabaseAdmin
    .from("players")
    .update({ has_used_chameleon_accusation: true })
    .eq("room_code", roomCode)
    .eq("nickname", nickname);

  return NextResponse.json({ ok: true });
}
