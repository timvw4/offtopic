import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { assertTransition } from "@/lib/stateMachine";

type Settings = {
  hors_theme_count: number;
  has_cameleon: boolean;
  has_dictator: boolean;
  has_fantome: boolean;
  drawing_timer_seconds?: number;
  word_theme?: string | null;
};

function normalizeSettings(playerCount: number, settings: Settings): Settings {
  // On ne touche pas aux toggles Caméléon/Dictateur/Fantôme. On borne juste Hors-Thème.
  if (playerCount <= 4) {
    // 3-4 joueurs : 1 seul Hors-Thème possible
    return {
      hors_theme_count: 1,
      has_cameleon: settings.has_cameleon,
      has_dictator: settings.has_dictator,
      has_fantome: settings.has_fantome,
      drawing_timer_seconds: settings.drawing_timer_seconds,
    };
  }
  if (playerCount <= 6) {
    // 5-6 joueurs : 1 ou 2 Hors-Thèmes
    const ht = [1, 2].includes(settings.hors_theme_count) ? settings.hors_theme_count : 1;
    return {
      hors_theme_count: ht,
      has_cameleon: settings.has_cameleon,
      has_dictator: settings.has_dictator,
      has_fantome: settings.has_fantome,
      drawing_timer_seconds: settings.drawing_timer_seconds,
    };
  }
  if (playerCount <= 9) {
    // 7-9 joueurs : 1, 2 ou 3 Hors-Thèmes
    const ht = [1, 2, 3].includes(settings.hors_theme_count) ? settings.hors_theme_count : 2;
    return {
      hors_theme_count: ht,
      has_cameleon: settings.has_cameleon,
      has_dictator: settings.has_dictator,
      has_fantome: settings.has_fantome,
      drawing_timer_seconds: settings.drawing_timer_seconds,
    };
  }
  if (playerCount <= 12) {
    // 10-12 joueurs : 1, 2, 3 ou 4 Hors-Thèmes
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
  const { roomCode, settings: settingsOverride } = await request.json();
  if (!roomCode) return NextResponse.json({ error: "roomCode manquant" }, { status: 400 });

  const { data: room } = await supabaseAdmin
    .from("rooms")
    .select("current_phase, hors_theme_count, has_cameleon, has_dictator, has_fantome, drawing_timer_seconds, word_theme, is_duel_mode")
    .eq("code", roomCode)
    .single();
  assertTransition(room?.current_phase || "LOBBY", "WORD");

  const isDuelMode = room?.is_duel_mode === true;

  const { data: players } = await supabaseAdmin
    .from("players")
    .select("id")
    .eq("room_code", roomCode)
    .eq("is_eliminated", false);

  // En mode Duel, exactement 2 joueurs requis. Sinon, minimum 3.
  if (isDuelMode) {
    if (!players || players.length !== 2) {
      return NextResponse.json({ error: "Le mode Duel nécessite exactement 2 joueurs" }, { status: 400 });
    }
  } else {
    if (!players || players.length < 3) {
      return NextResponse.json({ error: "Minimum 3 joueurs requis" }, { status: 400 });
    }
  }

  const baseSettings = {
    hors_theme_count: room?.hors_theme_count ?? 1,
    has_cameleon: room?.has_cameleon ?? false,
    has_dictator: room?.has_dictator ?? false,
    has_fantome: room?.has_fantome ?? false,
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
    has_fantome:
      typeof settingsOverride?.has_fantome === "boolean" ? settingsOverride.has_fantome : baseSettings.has_fantome,
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

  // Au lancement, on marque tous les joueurs comme sortis du lobby pour que
  // l'indicateur "tout le monde est revenu" ne se déclenche que lorsqu'ils cliquent
  // réellement sur "Retour au lobby".
  await supabaseAdmin.from("players").update({ is_in_lobby: false }).eq("room_code", roomCode);

  // Purge des données du tour précédent (dessins, votes, accusations, devinettes duel) pour éviter les fuites entre manches.
  await Promise.all([
    supabaseAdmin.from("drawings").delete().eq("room_code", roomCode),
    supabaseAdmin.from("votes").delete().eq("room_code", roomCode),
    supabaseAdmin.from("chameleon_accusations").delete().eq("room_code", roomCode),
    supabaseAdmin.from("duel_guesses").delete().eq("room_code", roomCode),
  ]);

  // ── Mode Duel (2 joueurs) ────────────────────────────────────────────────
  // On assigne directement 1 CIVIL + 1 HORS_THEME sans aucun rôle spécial.
  if (isDuelMode) {
    const duelShuffled = shuffle(players.map((p) => p.id));
    const [civilId, htId] = duelShuffled;

    // Reset des rôles
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

    // Attribue le rôle HORS_THEME au 2ème joueur (sans qu'il le sache — c'est juste son mot qui change)
    await supabaseAdmin.from("players").update({ role: "HORS_THEME" }).eq("id", htId);

    const theme = mergedSettings.word_theme || "general";
    const { data: themedPairs } = await supabaseAdmin.from("word_pairs").select("*").eq("theme", theme).limit(50);
    let chosen =
      themedPairs && themedPairs.length > 0 ? themedPairs[Math.floor(Math.random() * themedPairs.length)] : undefined;
    if (!chosen) {
      const { data: fallbackPairs } = await supabaseAdmin.from("word_pairs").select("*").eq("theme", "general").limit(50);
      chosen = fallbackPairs && fallbackPairs.length > 0 ? fallbackPairs[Math.floor(Math.random() * fallbackPairs.length)] : undefined;
    }

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
        hors_theme_count: 1,
        has_cameleon: false,
        has_dictator: false,
        has_fantome: false,
        drawing_timer_seconds: timerSeconds,
        word_theme: theme,
      })
      .eq("code", roomCode);

    return NextResponse.json({
      ok: true,
      duel: true,
      roles: { civil: civilId, hors_theme: htId },
    });
  }
  // ── Fin mode Duel ────────────────────────────────────────────────────────

  const shuffled = shuffle(players.map((p) => p.id));
  const htCount = effective.hors_theme_count;
  const htIds = shuffled.slice(0, htCount);
  let cursor = htCount;

  // Assigne Caméléon en priorité dans le slot suivant.
  let camId = effective.has_cameleon ? shuffled[cursor] : undefined;
  cursor += effective.has_cameleon ? 1 : 0;

  // Assigne Dictateur juste après.
  let dictatorId = effective.has_dictator ? shuffled[cursor] : undefined;
  cursor += effective.has_dictator ? 1 : 0;

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

  // Le Fantôme est tiré parmi TOUS les joueurs sauf Caméléon et Dictateur.
  // S'il tombe sur un Hors-Thème, il recevra le rôle FANTOME_HT (HT word + vote après mort).
  // S'il tombe sur un Civil, il recevra le rôle FANTOME (Civil word + vote après mort).
  let fantomeId: string | undefined = undefined;
  if (effective.has_fantome) {
    const eligibleForFantome = shuffled.filter((id) => id !== camId && id !== dictatorId);
    if (eligibleForFantome.length > 0) {
      fantomeId = eligibleForFantome[Math.floor(Math.random() * eligibleForFantome.length)];
    }
  }
  // Détermine si le Fantôme est aussi un Hors-Thème
  const fantomeIsHT = fantomeId ? finalHtIds.includes(fantomeId) : false;

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
  if (fantomeId) {
    if (fantomeIsHT) {
      // FANTOME_HT : était Hors-Thème, garde le mot HT mais peut voter après mort
      // On retire ce joueur de la liste HT et on lui donne FANTOME_HT
      await supabaseAdmin.from("players").update({ role: "FANTOME_HT" }).eq("id", fantomeId);
    } else {
      // FANTOME pur : reçoit le mot civil mais peut voter après mort
      await supabaseAdmin.from("players").update({ role: "FANTOME" }).eq("id", fantomeId);
    }
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
      has_fantome: effective.has_fantome,
      drawing_timer_seconds: timerSeconds,
      word_theme: theme,
    })
    .eq("code", roomCode);

  return NextResponse.json({
    ok: true,
    roles: {
      hors_theme: finalHtIds,
      cameleon: camId ?? null,
      dictator: dictatorId ?? null,
      fantome: fantomeIsHT ? null : (fantomeId ?? null),
      fantome_ht: fantomeIsHT ? (fantomeId ?? null) : null,
    },
  });
}
