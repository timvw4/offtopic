import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { assertTransition } from "@/lib/stateMachine";

// Résout un tour : compte les votes, gère égalité, marque l'élimination et note si c'était le Caméléon.
export async function POST(request: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Service key manquant" }, { status: 500 });
  const { roomCode } = await request.json();
  if (!roomCode) return NextResponse.json({ error: "roomCode manquant" }, { status: 400 });

  // Dernier round
  const { data: round, error: roundErr } = await supabaseAdmin
    .from("rounds")
    .select("id, room_code, last_eliminated_player_id, last_eliminated_is_chameleon, dictator_survived")
    .eq("room_code", roomCode)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (roundErr || !round) return NextResponse.json({ error: "Round introuvable" }, { status: 404 });

  // Vérifie la phase actuelle pour éviter une résolution inattendue.
  // Si on est déjà en RESULTS (rafraîchissement), on laisse passer sans bloquer.
  const { data: room } = await supabaseAdmin.from("rooms").select("current_phase").eq("code", roomCode).single();
  if (room?.current_phase !== "RESULTS") {
    assertTransition(room?.current_phase || "VOTE", "RESULTS");
  }

  // Récupère les votes
  const { data: votes, error: votesErr } = await supabaseAdmin
    .from("votes")
    .select("target_player_id, weight")
    .eq("round_id", round.id);
  if (votesErr) return NextResponse.json({ error: "Erreur votes" }, { status: 500 });
  if (!votes || votes.length === 0) {
    return NextResponse.json({ message: "Aucun vote" });
  }

  // Comptage
  const tally = new Map<string, number>();
  for (const v of votes) {
    const w = typeof v.weight === "number" && v.weight > 0 ? v.weight : 1;
    tally.set(v.target_player_id, (tally.get(v.target_player_id) || 0) + w);
  }
  const maxCount = Math.max(...Array.from(tally.values()));
  const leaders = Array.from(tally.entries()).filter(([, c]) => c === maxCount).map(([id]) => id);

  // Si ce round est déjà marqué comme "dictator_survived", on ne retrait pas (idempotence).
  if (round.dictator_survived === true) {
    return NextResponse.json({
      dictatorSurvived: true,
      eliminatedId: null,
      wasChameleon: false,
      accusedCorrectly: false,
      alreadyResolved: true,
    });
  }

  // Égalité → pas d’élimination, on force un revote entre ex æquo
  if (leaders.length !== 1) {
    await supabaseAdmin
      .from("rounds")
      .update({ last_eliminated_player_id: null, last_eliminated_is_chameleon: null, tie_player_ids: leaders, dictator_survived: false })
      .eq("id", round.id);
    return NextResponse.json({ tie: true, tiePlayerIds: leaders, eliminated: null });
  }

  const eliminatedId = leaders[0];

  // Rôle du joueur ciblé
  const { data: player } = await supabaseAdmin
    .from("players")
    .select("role, dictator_immunity_used, is_eliminated")
    .eq("id", eliminatedId)
    .maybeSingle();
  const isChameleon = player?.role === "CAMELEON";
  const isDictator = player?.role === "DICTATOR";
  const hadImmunityUsed = player?.dictator_immunity_used === true;
  const roundHasSurvival = round?.dictator_survived === true;

  // Cas Dictateur : première majorité -> survit, active double vote pour son prochain vote.
  // On tolère le cas où le flag joueur est à true mais que le round n'a pas enregistré de survie (filet de sécurité).
  if (isDictator && (!hadImmunityUsed || !roundHasSurvival)) {
    await supabaseAdmin
      .from("rounds")
      .update({
        last_eliminated_player_id: null,
        last_eliminated_is_chameleon: null,
        tie_player_ids: null,
        dictator_survived: true,
      })
      .eq("id", round.id);

    // On met à jour le joueur après avoir posé le flag de round pour limiter les courses entre multiples /resolve.
    await supabaseAdmin
      .from("players")
      .update({ dictator_immunity_used: true, dictator_double_vote_active: true, is_eliminated: false })
      .eq("id", eliminatedId);

    // Nettoie les votes pour le tour suivant (évite de conserver un vote doublé)
    await supabaseAdmin.from("votes").delete().eq("round_id", round.id);

    return NextResponse.json({
      dictatorSurvived: true,
      eliminatedId: null,
      wasChameleon: false,
      accusedCorrectly: false,
    });
  }

  // Y a-t-il une accusation ciblant ce joueur ?
  const { data: accusations } = await supabaseAdmin
    .from("chameleon_accusations")
    .select("id")
    .eq("room_code", roomCode)
    .eq("target_player_id", eliminatedId)
    .limit(1);
  const accused = !!accusations && accusations.length > 0;

  // Marque l’élimination du joueur
  await supabaseAdmin.from("players").update({ is_eliminated: true }).eq("id", eliminatedId);

  // Filet de sécurité : si c'était un Dictateur sans immunité consommée (cas concurrence), on annule l'élimination.
  if (isDictator && !hadImmunityUsed) {
    await supabaseAdmin
      .from("players")
      .update({ is_eliminated: false, dictator_immunity_used: true, dictator_double_vote_active: true })
      .eq("id", eliminatedId);
    await supabaseAdmin
      .from("rounds")
      .update({ last_eliminated_player_id: null, last_eliminated_is_chameleon: null, tie_player_ids: null })
      .eq("id", round.id);
    await supabaseAdmin.from("votes").delete().eq("round_id", round.id);
    return NextResponse.json({
      dictatorSurvived: true,
      eliminatedId: null,
      wasChameleon: false,
      accusedCorrectly: false,
      debug: { isDictator, hadImmunityUsed, playerAlreadyEliminated: player?.is_eliminated === true },
    });
  }

  // Sauvegarde le résultat dans le round
  await supabaseAdmin
    .from("rounds")
    .update({
      last_eliminated_player_id: eliminatedId,
      last_eliminated_is_chameleon: isChameleon ? !accused /* si accusé correctement -> perd, donc false */ : false,
      tie_player_ids: null,
      dictator_survived: false,
    })
    .eq("id", round.id);

  return NextResponse.json({
    eliminatedId,
    wasChameleon: isChameleon,
    accusedCorrectly: accused,
    dictatorSurvived: false,
  });
}
