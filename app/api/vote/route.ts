import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { assertTransition } from "@/lib/stateMachine";

export async function POST(request: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Service key manquant" }, { status: 500 });
  const { roomCode, nickname, targetId } = await request.json();

  // One vote per player per round enforced by DB unique constraint
  const { data: round } = await supabaseAdmin
    .from("rounds")
    .select("id")
    .eq("room_code", roomCode)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Récupère le joueur votant pour éviter l'auto-vote
  const { data: voter } = await supabaseAdmin
    .from("players")
    .select("id, role, dictator_double_vote_active")
    .eq("room_code", roomCode)
    .eq("nickname", nickname)
    .maybeSingle();
  if (voter?.id === targetId) {
    return NextResponse.json({ error: "Vote sur soi-même interdit" }, { status: 400 });
  }

  const isDictatorWithDouble = voter?.role === "DICTATOR" && voter?.dictator_double_vote_active === true;
  const weight = isDictatorWithDouble ? 2 : 1;

  await supabaseAdmin.from("votes").upsert({
    room_code: roomCode,
    round_id: round?.id,
    voter_nickname: nickname,
    target_player_id: targetId,
    weight,
  });

  if (isDictatorWithDouble && voter?.id) {
    await supabaseAdmin
      .from("players")
      .update({ dictator_double_vote_active: false })
      .eq("id", voter.id);
  }

  // Vérifie si tout le monde a voté : joueurs non éliminés
  const { count: aliveCount } = await supabaseAdmin
    .from("players")
    .select("*", { count: "exact", head: true })
    .eq("room_code", roomCode)
    .eq("is_eliminated", false);

  const { count: voteCount } = await supabaseAdmin
    .from("votes")
    .select("*", { count: "exact", head: true })
    .eq("round_id", round?.id);

  // Tous les joueurs non éliminés doivent voter avant de passer en RESULTS.
  if (aliveCount !== null && voteCount !== null && voteCount >= aliveCount) {
    const { data: room } = await supabaseAdmin.from("rooms").select("current_phase").eq("code", roomCode).single();
    assertTransition(room?.current_phase || "VOTE", "RESULTS");
    await supabaseAdmin.from("rooms").update({ current_phase: "RESULTS" }).eq("code", roomCode);
  }

  return NextResponse.json({ ok: true });
}
