import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

type Body = {
  roomCode?: string;
};

// Démarre la phase dessin côté serveur dès que tous les joueurs actifs sont prêts.
// Idempotent : plusieurs appels simultanés ne créent qu'un seul draw_starts_at.
export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Service indisponible." }, { status: 500 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const roomCode = body.roomCode?.trim().toUpperCase();
  if (!roomCode) {
    return NextResponse.json({ error: "Code de salle manquant." }, { status: 400 });
  }

  const { data: round, error: roundError } = await supabaseAdmin
    .from("rounds")
    .select("id, draw_starts_at, timer_seconds")
    .eq("room_code", roomCode)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (roundError || !round) {
    return NextResponse.json({ error: "Manche introuvable." }, { status: 404 });
  }

  if (round.draw_starts_at) {
    return NextResponse.json({ ok: true, drawStartsAt: round.draw_starts_at, alreadyStarted: true });
  }

  const { data: players, error: playersError } = await supabaseAdmin
    .from("players")
    .select("nickname, is_ready, is_eliminated")
    .eq("room_code", roomCode);

  if (playersError) {
    return NextResponse.json({ error: "Impossible de lire les joueurs." }, { status: 500 });
  }

  const alive = (players || []).filter((p) => !p.is_eliminated);
  if (alive.length === 0) {
    return NextResponse.json({ ok: false, reason: "no_players" });
  }

  const allReady = alive.every((p) => p.is_ready);
  if (!allReady) {
    return NextResponse.json({ ok: false, reason: "not_all_ready" });
  }

  const drawStartsAt = new Date(Date.now() + 3000).toISOString();

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("rounds")
    .update({ draw_starts_at: drawStartsAt, phase: "DRAW" })
    .eq("id", round.id)
    .is("draw_starts_at", null)
    .select("draw_starts_at")
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: "Impossible de démarrer le dessin." }, { status: 500 });
  }

  if (!updated) {
    const { data: latestRound } = await supabaseAdmin
      .from("rounds")
      .select("draw_starts_at")
      .eq("id", round.id)
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      drawStartsAt: latestRound?.draw_starts_at ?? drawStartsAt,
      alreadyStarted: true,
    });
  }

  await supabaseAdmin.from("rooms").update({ current_phase: "DRAW" }).eq("code", roomCode);

  return NextResponse.json({
    ok: true,
    drawStartsAt: updated.draw_starts_at,
    timerSeconds: round.timer_seconds ?? 60,
  });
}
