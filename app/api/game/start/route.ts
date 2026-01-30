import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { assertTransition } from "@/lib/stateMachine";

type Settings = {
  hors_theme_count: number;
  has_cameleon: boolean;
  has_dictator: boolean;
  drawing_timer_seconds?: number;
  word_theme?: string | null;
};

function normalizeSettings(playerCount: number, settings: Settings): Settings {
  // On ne touche pas aux toggles Caméléon/Dictateur. On borne juste Hors-Thème.
  if (playerCount <= 4) {
    return {
      hors_theme_count: 1,
      has_cameleon: settings.has_cameleon,
      has_dictator: settings.has_dictator,
      drawing_timer_seconds: settings.drawing_timer_seconds,
    };
  }
  if (playerCount <= 6) {
    const ht = [1, 2].includes(settings.hors_theme_count) ? settings.hors_theme_count : 1;
    return {
      hors_theme_count: ht,
      has_cameleon: settings.has_cameleon,
      has_dictator: settings.has_dictator,
      drawing_timer_seconds: settings.drawing_timer_seconds,
    };
  }
  const ht = [2, 3].includes(settings.hors_theme_count) ? settings.hors_theme_count : 2;
  return {
    hors_theme_count: ht,
    has_cameleon: settings.has_cameleon,
    has_dictator: settings.has_dictator,
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
  const { roomCode, settings: settingsOverride } = await request.json();
  if (!roomCode) return NextResponse.json({ error: "roomCode manquant" }, { status: 400 });

  const { data: room } = await supabaseAdmin
    .from("rooms")
    .select("current_phase, hors_theme_count, has_cameleon, has_dictator, drawing_timer_seconds, word_theme")
    .eq("code", roomCode)
    .single();
  assertTransition(room?.current_phase || "LOBBY", "WORD");

  const { data: players } = await supabaseAdmin
    .from("players")
    .select("id")
    .eq("room_code", roomCode)
    .eq("is_eliminated", false);

  if (!players || players.length < 3) {
    return NextResponse.json({ error: "Minimum 3 joueurs requis" }, { status: 400 });
  }

  const baseSettings = {
    hors_theme_count: room?.hors_theme_count ?? 1,
    has_cameleon: room?.has_cameleon ?? false,
    has_dictator: room?.has_dictator ?? false,
    drawing_timer_seconds: room?.drawing_timer_seconds ?? 60,
    word_theme: room?.word_theme ?? "general",
  };

  const mergedSettings = {
    hors_theme_count:
      typeof settingsOverride?.hors_theme_count === "number" ? settingsOverride.hors_theme_count : baseSettings.hors_theme_count,
    has_cameleon:
      typeof settingsOverride?.has_cameleon === "boolean" ? settingsOverride.has_cameleon : baseSettings.has_cameleon,
    has_dictator:
      typeof settingsOverride?.has_dictator === "boolean" ? settingsOverride.has_dictator : baseSettings.has_dictator,
    drawing_timer_seconds:
      typeof settingsOverride?.drawing_timer_seconds === "number"
        ? settingsOverride.drawing_timer_seconds
        : baseSettings.drawing_timer_seconds,
    word_theme: typeof settingsOverride?.word_theme === "string" ? settingsOverride.word_theme : baseSettings.word_theme,
  };

  const effective = normalizeSettings(players.length, mergedSettings);

  const timerSeconds = [30, 45, 60, 90, 120].includes(effective.drawing_timer_seconds ?? 60)
    ? effective.drawing_timer_seconds
    : 60;

  // Purge des données du tour précédent (dessins, votes, accusations) pour éviter les fuites entre manches.
  await Promise.all([
    supabaseAdmin.from("drawings").delete().eq("room_code", roomCode),
    supabaseAdmin.from("votes").delete().eq("room_code", roomCode),
    supabaseAdmin.from("chameleon_accusations").delete().eq("room_code", roomCode),
  ]);

  const shuffled = shuffle(players.map((p) => p.id));
  const htCount = effective.hors_theme_count;
  const htIds = shuffled.slice(0, htCount);
  let cursor = htCount;

  // Assigne Caméléon en priorité dans le slot suivant.
  let camId = effective.has_cameleon ? shuffled[cursor] : undefined;
  cursor += effective.has_cameleon ? 1 : 0;

  // Assigne Dictateur juste après.
  let dictatorId = effective.has_dictator ? shuffled[cursor] : undefined;

  // Si Caméléon est demandé mais non attribué (taille insuffisante), recycle un HT.
  if (effective.has_cameleon && !camId) {
    camId = htIds.pop();
  }

  // Si Dictateur est demandé mais non attribué, recycle un restant hors HT/Cam.
  if (effective.has_dictator && !dictatorId) {
    const remaining = shuffled.filter((id) => !htIds.includes(id) && id !== camId);
    dictatorId = remaining[0];
  }

  // Assure l'exclusivité : retire le Caméléon des HT s'il a été recyclé.
  const htSet = new Set(htIds.filter((id) => id !== camId));
  const finalHtIds = Array.from(htSet);

  // Reset roles
  await supabaseAdmin
    .from("players")
    .update({
      role: "CIVIL",
      is_eliminated: false,
      has_used_chameleon_accusation: false,
      is_ready: false,
      dictator_immunity_used: false,
      dictator_double_vote_active: false,
    })
    .eq("room_code", roomCode);

  if (finalHtIds.length > 0) {
    await supabaseAdmin.from("players").update({ role: "HORS_THEME" }).in("id", finalHtIds);
  }
  if (camId) {
    await supabaseAdmin.from("players").update({ role: "CAMELEON" }).eq("id", camId);
  }
  if (dictatorId) {
    await supabaseAdmin.from("players").update({ role: "DICTATOR" }).eq("id", dictatorId);
  }

  const theme = mergedSettings.word_theme || "general";

  // Pick random pair dans le thème (fallback sur general si vide)
  const { data: themedPairs } = await supabaseAdmin.from("word_pairs").select("*").eq("theme", theme).limit(50);
  let chosen =
    themedPairs && themedPairs.length > 0 ? themedPairs[Math.floor(Math.random() * themedPairs.length)] : undefined;

  if (!chosen) {
    const { data: fallbackPairs } = await supabaseAdmin.from("word_pairs").select("*").eq("theme", "general").limit(50);
    chosen =
      fallbackPairs && fallbackPairs.length > 0
        ? fallbackPairs[Math.floor(Math.random() * fallbackPairs.length)]
        : undefined;
  }

  // New round
  await supabaseAdmin.from("rounds").insert({
    room_code: roomCode,
    phase: "WORD",
    word_civil: chosen?.word_fr_civil || "chat",
    word_hors_theme: chosen?.word_fr_hors_theme || "chien",
    timer_seconds: timerSeconds,
    tie_player_ids: null,
    draw_starts_at: null,
    dictator_survived: false,
  });

  await supabaseAdmin
    .from("rooms")
    .update({
      current_phase: "WORD",
      hors_theme_count: effective.hors_theme_count,
      has_cameleon: effective.has_cameleon,
      has_dictator: effective.has_dictator,
      drawing_timer_seconds: timerSeconds,
      drawing_timer_seconds: timerSeconds,
      word_theme: theme,
    })
    .eq("code", roomCode);

  return NextResponse.json({
    ok: true,
    roles: { hors_theme: htIds, cameleon: camId ?? null, dictator: dictatorId ?? null },
  });
}
