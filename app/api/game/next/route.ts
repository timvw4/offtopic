import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { assertTransition } from "@/lib/stateMachine";

type Settings = {
  hors_theme_count: number;
  has_cameleon: boolean;
  has_dictator: boolean;
  has_fantome: boolean;
  drawing_timer_seconds?: number;
};

function normalizeSettings(playerCount: number, settings: Settings): Settings {
  // 3-4 joueurs : 1 seul Hors-Thème possible
  if (playerCount <= 4) {
    return {
      hors_theme_count: 1,
      has_cameleon: settings.has_cameleon,
      has_dictator: settings.has_dictator,
      has_fantome: settings.has_fantome,
      drawing_timer_seconds: settings.drawing_timer_seconds,
    };
  }
  // 5-6 joueurs : 1 ou 2 Hors-Thèmes
  if (playerCount <= 6) {
    const ht = [1, 2].includes(settings.hors_theme_count) ? settings.hors_theme_count : 1;
    return {
      hors_theme_count: ht,
      has_cameleon: settings.has_cameleon,
      has_dictator: settings.has_dictator,
      has_fantome: settings.has_fantome,
      drawing_timer_seconds: settings.drawing_timer_seconds,
    };
  }
  // 7-9 joueurs : 1, 2 ou 3 Hors-Thèmes
  if (playerCount <= 9) {
    const ht = [1, 2, 3].includes(settings.hors_theme_count) ? settings.hors_theme_count : 2;
    return {
      hors_theme_count: ht,
      has_cameleon: settings.has_cameleon,
      has_dictator: settings.has_dictator,
      has_fantome: settings.has_fantome,
      drawing_timer_seconds: settings.drawing_timer_seconds,
    };
  }
  // 10-12 joueurs : 1, 2, 3 ou 4 Hors-Thèmes
  if (playerCount <= 12) {
    const ht = [1, 2, 3, 4].includes(settings.hors_theme_count) ? settings.hors_theme_count : 3;
    return {
      hors_theme_count: ht,
      has_cameleon: settings.has_cameleon,
      has_dictator: settings.has_dictator,
      has_fantome: settings.has_fantome,
      drawing_timer_seconds: settings.drawing_timer_seconds,
    };
  }
  // 13-15 joueurs : 1, 2, 3, 4 ou 5 Hors-Thèmes
  const ht = [1, 2, 3, 4, 5].includes(settings.hors_theme_count) ? settings.hors_theme_count : 4;
  return {
    hors_theme_count: ht,
    has_cameleon: settings.has_cameleon,
    has_dictator: settings.has_dictator,
    has_fantome: settings.has_fantome,
    drawing_timer_seconds: settings.drawing_timer_seconds,
  };
}

function shuffle<T>(arr: T[]): T[] {
  return arr
    .map((x) => ({ x, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map((o) => o.x);
}

export async function POST(request: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Service key manquant" }, { status: 500 });
  const { roomCode } = await request.json();
  if (!roomCode) return NextResponse.json({ error: "roomCode manquant" }, { status: 400 });

  const { data: room } = await supabaseAdmin
    .from("rooms")
    .select("current_phase, hors_theme_count, has_cameleon, has_dictator, has_fantome, drawing_timer_seconds")
    .eq("code", roomCode)
    .single();
  assertTransition(room?.current_phase || "RESULTS", "WORD");

  // Seuls les joueurs non éliminés participent au nouveau tour
  const { data: alivePlayers } = await supabaseAdmin
    .from("players")
    .select("id")
    .eq("room_code", roomCode)
    .eq("is_eliminated", false);

  if (!alivePlayers || alivePlayers.length < 2) {
    return NextResponse.json({ error: "Minimum 2 joueurs restants requis" }, { status: 400 });
  }

  const effective = normalizeSettings(alivePlayers.length, {
    hors_theme_count: room?.hors_theme_count ?? 1,
    has_cameleon: room?.has_cameleon ?? false,
    has_dictator: room?.has_dictator ?? false,
    has_fantome: room?.has_fantome ?? false,
    drawing_timer_seconds: room?.drawing_timer_seconds ?? 60,
  });

  const timerSeconds = [30, 45, 60, 90, 120].includes(effective.drawing_timer_seconds ?? 60)
    ? effective.drawing_timer_seconds
    : 60;

  // On quitte explicitement le lobby pour ce nouveau tour afin que le reset ne
  // se déclenche que lorsque tout le monde aura cliqué sur "Retour au lobby".
  await supabaseAdmin.from("players").update({ is_in_lobby: false }).eq("room_code", roomCode);

  // Purge des données de manche précédente pour ne pas mélanger les écrans,
  // mais on conserve les flags d'élimination et les rôles/words (pas de redistribution).
  await Promise.all([
    supabaseAdmin.from("drawings").delete().eq("room_code", roomCode),
    supabaseAdmin.from("votes").delete().eq("room_code", roomCode),
    supabaseAdmin.from("chameleon_accusations").delete().eq("room_code", roomCode),
  ]);

  // Reset seulement l'état prêt des joueurs encore en jeu (on conserve l'usage d'accusation pour la partie).
  await supabaseAdmin
    .from("players")
    .update({ is_ready: false })
    .eq("room_code", roomCode)
    .eq("is_eliminated", false);

  // Récupère le dernier mot pour le conserver sur le prochain tour
  const { data: lastRound } = await supabaseAdmin
    .from("rounds")
    .select("word_civil, word_hors_theme")
    .eq("room_code", roomCode)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Démarrage dessin synchronisé (compte à rebours partagé)
  const drawStartsAt = new Date(Date.now() + 3000).toISOString();

  await supabaseAdmin.from("rounds").insert({
    room_code: roomCode,
    phase: "DRAW",
    word_civil: lastRound?.word_civil || "chat",
    word_hors_theme: lastRound?.word_hors_theme || "chien",
    timer_seconds: timerSeconds,
    tie_player_ids: null,
    draw_starts_at: drawStartsAt,
    dictator_survived: false,
  });

  await supabaseAdmin
    .from("rooms")
    .update({
      current_phase: "DRAW",
      hors_theme_count: effective.hors_theme_count,
      has_cameleon: effective.has_cameleon,
      has_dictator: effective.has_dictator,
      has_fantome: effective.has_fantome,
      drawing_timer_seconds: timerSeconds,
    })
    .eq("code", roomCode);

  return NextResponse.json({ ok: true, timerSeconds, drawStartsAt });
}
