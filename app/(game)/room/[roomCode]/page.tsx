"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { Player } from "@/lib/types";
import { PlayerList } from "@/components/PlayerList";

// Ajoute un paramètre de version pour forcer le rechargement des nouvelles images.
const ASSET_VERSION = "v2";
const asset = (path: string) => `${path}?v=${ASSET_VERSION}`;

type RoomSettings = {
  hors_theme_count: number;
  has_cameleon: boolean;
  has_dictator: boolean;
  has_fantome: boolean;
  host_nickname?: string | null;
  current_phase?: string | null;
  drawing_timer_seconds?: number;
  word_theme?: string | null;
  is_duel_mode?: boolean;
};

function mapPlayerRow(row: any): Player {
  return {
    id: row.id,
    nickname: row.nickname,
    role: row.role,
    hasUsedChameleonAccusation: row.has_used_chameleon_accusation ?? false,
    isEliminated: row.is_eliminated ?? false,
    isHost: row.is_host ?? false,
    isInLobby: row.is_in_lobby ?? false,
    dictatorImmunityUsed: row.dictator_immunity_used ?? false,
    dictatorDoubleVoteActive: row.dictator_double_vote_active ?? false,
  };
}

function allowedSettings(playerCount: number) {
  if (playerCount <= 4)  return { options: [1],             camAllowed: true }; // 3-4 joueurs
  if (playerCount <= 6)  return { options: [1, 2],          camAllowed: true }; // 5-6 joueurs
  if (playerCount <= 9)  return { options: [1, 2, 3],       camAllowed: true }; // 7-9 joueurs
  if (playerCount <= 12) return { options: [1, 2, 3, 4],    camAllowed: true }; // 10-12 joueurs
  return                        { options: [1, 2, 3, 4, 5], camAllowed: true }; // 13-15 joueurs
}

export default function LobbyPage() {
  const search = useSearchParams();
  const router = useRouter();
  const params = useParams<{ roomCode: string }>();
  const nickname = search.get("nickname") || "Guest";

  const [players, setPlayers] = useState<Player[]>([]);
  const [settings, setSettings] = useState<RoomSettings>({
    hors_theme_count: 1,
    has_cameleon: false,
    has_dictator: false,
    has_fantome: false,
    drawing_timer_seconds: 60,
    word_theme: "general",
    is_duel_mode: false,
  });
  const [showCamTooltip, setShowCamTooltip] = useState(false);
  const [showDictTooltip, setShowDictTooltip] = useState(false);
  const [showFantTooltip, setShowFantTooltip] = useState(false);
  const [showRolesList, setShowRolesList] = useState(false);
  const [showHostParams, setShowHostParams] = useState(false);
  const [showPlayerParams, setShowPlayerParams] = useState(true);
  const [joinError, setJoinError] = useState<string | null>(null);
  // Empêche deux appels concurrents à init (évite le faux positif "pseudo déjà utilisé")
  const initLockRef = useRef(false);

  const playerCount = players.length;
  const { options } = allowedSettings(playerCount);
  const hasSingleHtOption = options.length === 1;
  const selectedHt = options.includes(settings.hors_theme_count) ? settings.hors_theme_count : options[0];
  const selectedCam = settings.has_cameleon ?? false;
  const selectedDict = settings.has_dictator ?? false;
  const selectedFant = settings.has_fantome ?? false;
  const selectedTheme = settings.word_theme || "general";
  const htDisplay = selectedHt === 1 ? "1 Hors-Thème" : `${selectedHt} Hors-Thèmes`;

  // Liste des thèmes disponibles (alignée avec les seeds SQL 0017 + 0019)
  const themes = [
    { value: "general", label: "Général" },
    { value: "objets_quotidien", label: "Objets du quotidien" },
    { value: "situations", label: "Situations" },
    { value: "nature", label: "Nature" },
    { value: "technologie", label: "Technologie" },
    { value: "divertissement", label: "Divertissement" },
    { value: "sports", label: "Sports" },
    { value: "fantastique", label: "Fantastique" },
    { value: "metiers", label: "Métiers" },
    { value: "pop_culture", label: "🎬 Pop Culture" },
  ];

  const themeLabel = themes.find((t) => t.value === selectedTheme)?.label ?? "Général";
  const getRoleCheckboxStyle = (checked: boolean) => ({
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
    MozAppearance: "none" as const,
    width: 22,
    height: 22,
    borderRadius: "50%",
    border: "2px solid #87ceeb",
    background: checked ? "#87ceeb" : "rgba(255,255,255,0.06)",
    boxShadow: checked ? "0 0 0 3px rgba(135,206,235,0.35)" : "inset 0 0 0 1px rgba(255,255,255,0.12)",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    flexShrink: 0,
  });

  const isHost = useMemo(() => settings.host_nickname === nickname, [settings.host_nickname, nickname]);
  const playerStorageKey = useMemo(
    () => `off-topic:player:${params.roomCode}:${nickname}`,
    [params.roomCode, nickname],
  ); // Utilisé pour autoriser une reconnexion avec le même navigateur.

  useEffect(() => {
    const room = params.roomCode;
    if (!room) return;
    let channel: ReturnType<typeof supabaseClient.channel> | null = null;
    let pollPlayers: NodeJS.Timeout | null = null;

    async function init() {
      if (initLockRef.current) return;
      initLockRef.current = true;
      try {
        setJoinError(null);
        // 1) Crée la room si elle n'existe pas
        const { data: roomRow, error: roomError } = await supabaseClient
          .from("rooms")
          .select("*")
          .eq("code", room)
          .maybeSingle();
        if (roomError) {
          setJoinError("Impossible de vérifier la salle pour le moment. Réessaie.");
          return;
        }

        const storedPlayerId = typeof window !== "undefined" ? window.localStorage.getItem(playerStorageKey) : null;
        const { data: existingPlayer, error: existingPlayerError } = await supabaseClient
          .from("players")
          .select("id, nickname, is_in_lobby")
          .eq("room_code", room)
          .eq("nickname", nickname)
          .maybeSingle();

        if (existingPlayerError) {
          setJoinError("Impossible de vérifier ton pseudo pour cette salle. Réessaie dans un instant.");
          return;
        }

        let hostNickname = roomRow?.host_nickname;
        if (!roomRow) {
          // La room n'existe pas, on la crée et on désigne l'utilisateur courant comme hôte.
          hostNickname = nickname;
          await supabaseClient
            .from("rooms")
            .insert({
              code: room,
              host_nickname: hostNickname,
              hors_theme_count: 1,
              has_cameleon: false,
              has_dictator: false,
              has_fantome: false,
              current_phase: "LOBBY",
              word_theme: "general",
            })
            .select();
        } else if (!hostNickname) {
          // La room existe mais aucun hôte n'est défini : on assigne l'utilisateur courant.
          hostNickname = nickname;
          await supabaseClient.from("rooms").update({ host_nickname: hostNickname }).eq("code", room);
        }

        setSettings({
          hors_theme_count: roomRow?.hors_theme_count ?? 1,
          has_cameleon: roomRow?.has_cameleon ?? false,
          has_dictator: roomRow?.has_dictator ?? false,
          has_fantome: roomRow?.has_fantome ?? false,
          host_nickname: hostNickname,
          current_phase: roomRow?.current_phase ?? "LOBBY",
          drawing_timer_seconds: roomRow?.drawing_timer_seconds ?? 60,
          word_theme: roomRow?.word_theme ?? "general",
          is_duel_mode: roomRow?.is_duel_mode ?? false,
        });

        const amHost = hostNickname === nickname;

        // 2) Upsert player avec flag hôte, sans requête RETURNING (évite les erreurs RLS)
        let savedPlayerId = existingPlayer?.id ?? null;
        const reactivatePlayer = async (id: string) => {
          const { error: updateError } = await supabaseClient
            .from("players")
            .update({
              is_in_lobby: true,
              is_host: existingPlayer?.nickname === hostNickname ? true : amHost,
              has_used_chameleon_accusation: false,
              is_eliminated: false,
            })
            .eq("id", id);
          if (updateError) {
            setJoinError("Impossible de rejoindre la salle pour le moment. Réessaie (upd).");
            return false;
          }
          return true;
        };

        if (existingPlayer) {
          const ok = await reactivatePlayer(existingPlayer.id);
          if (!ok) return;
        } else {
          const { data: inserted, error: insertError } = await supabaseClient
            .from("players")
            .insert({
              room_code: room,
              nickname,
              role: "CIVIL",
              has_used_chameleon_accusation: false,
              is_eliminated: false,
              is_host: amHost,
              is_in_lobby: true,
            })
            .select("id")
            .single();
          if (insertError) {
            // Gestion du cas de doublon ou d'une insertion concurrente : on récupère puis on réactive.
            const { data: fetchedExisting, error: fetchError } = await supabaseClient
              .from("players")
              .select("id")
              .eq("room_code", room)
              .eq("nickname", nickname)
              .maybeSingle();
            if (fetchError) {
              setJoinError("Impossible de rejoindre la salle pour le moment. Réessaie (dup).");
              return;
            }
            if (fetchedExisting?.id) {
              savedPlayerId = fetchedExisting.id;
              const ok = await reactivatePlayer(fetchedExisting.id);
              if (!ok) return;
            } else {
              setJoinError("Impossible de rejoindre la salle pour le moment. Réessaie (ins).");
              return;
            }
          } else {
            savedPlayerId = inserted?.id ?? null;
          }
        }

        if (savedPlayerId && typeof window !== "undefined") {
          try {
            window.localStorage.setItem(playerStorageKey, savedPlayerId);
          } catch {
            // Si le stockage échoue, on continue malgré tout : le pseudo restera réservé côté base.
          }
        }

        // 3) Charge la liste des joueurs
        const { data: pData } = await supabaseClient.from("players").select("*").eq("room_code", room);
        setPlayers((pData || []).map(mapPlayerRow));

        // 4) Realtime
        channel = supabaseClient
          .channel(`room:${room}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "players", filter: `room_code=eq.${room}` },
            (p) => {
              if (p.eventType === "INSERT" || p.eventType === "UPDATE" || p.eventType === "DELETE") {
                supabaseClient
                  .from("players")
                  .select("*")
                  .eq("room_code", room)
                  .then(({ data }) => setPlayers((data || []).map(mapPlayerRow)));
              }
            },
          )
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "rooms", filter: `code=eq.${room}` },
            ({ new: n }) => {
              setSettings((prev) => ({
                hors_theme_count: n?.hors_theme_count ?? prev.hors_theme_count,
                has_cameleon: n?.has_cameleon ?? prev.has_cameleon,
                has_dictator: n?.has_dictator ?? prev.has_dictator,
                has_fantome: n?.has_fantome ?? prev.has_fantome,
                host_nickname: n?.host_nickname ?? prev.host_nickname,
                current_phase: n?.current_phase ?? prev.current_phase,
                drawing_timer_seconds: n?.drawing_timer_seconds ?? prev.drawing_timer_seconds,
                word_theme: n?.word_theme ?? prev.word_theme ?? "general",
                is_duel_mode: n?.is_duel_mode ?? prev.is_duel_mode ?? false,
              }));
            },
          )
          .subscribe();

        // Polling de secours pour mettre à jour la liste des joueurs (ex : si l'hôte ne reçoit pas le realtime)
        pollPlayers = setInterval(() => {
          supabaseClient
            .from("players")
            .select("*")
            .eq("room_code", room)
            .then(({ data }) => setPlayers((data || []).map(mapPlayerRow)));
        }, 2000);
      } finally {
        initLockRef.current = false;
      }
    }

    void init();

    return () => {
      initLockRef.current = false;
      channel?.unsubscribe();
      if (pollPlayers) clearInterval(pollPlayers);
    };
  }, [nickname, params.roomCode, playerStorageKey]);

  // Redirige quand la phase passe à WORD (tous les joueurs suivent l'hôte)
  useEffect(() => {
    if (settings.current_phase === "WORD") {
      router.replace(`/room/${params.roomCode}/word?nickname=${encodeURIComponent(nickname)}`);
    }
  }, [settings.current_phase, nickname, params.roomCode, router]);

  // Fallback polling au cas où l'événement Realtime rooms n'arrive pas (connexion réseau, RLS, etc.)
  useEffect(() => {
    const room = params.roomCode;
    if (!room) return;
    const id = setInterval(() => {
      supabaseClient
        .from("rooms")
        .select("current_phase")
        .eq("code", room)
        .single()
        .then(({ data }) => {
          if (data?.current_phase === "WORD") {
            router.replace(`/room/${room}/word?nickname=${encodeURIComponent(nickname)}`);
          }
        });
    }, 2500);
    return () => clearInterval(id);
  }, [nickname, params.roomCode, router]);

  async function updateRoomSettings(
    hors_theme_count: number,
    has_cameleon: boolean,
    has_dictator: boolean,
    has_fantome: boolean,
    word_theme?: string,
  ) {
    const room = params.roomCode;
    const nextTheme = word_theme ?? settings.word_theme ?? "general";
    const prev = settings;
    setSettings((s) => ({ ...s, hors_theme_count, has_cameleon, has_dictator, has_fantome, word_theme: nextTheme }));
    const { error } = await supabaseClient
      .from("rooms")
      .update({ hors_theme_count, has_cameleon, has_dictator, has_fantome, word_theme: nextTheme })
      .eq("code", room);
    if (error) {
      // Si l'écriture échoue (ex : RLS), on rétablit l'état local et on affiche un message.
      setSettings(prev);
      alert("Impossible de mettre à jour les paramètres de la partie. Réessaie ou vérifie les droits Supabase.");
    }
  }

  async function updateTimer(seconds: number) {
    const room = params.roomCode;
    const prev = settings;
    setSettings((s) => ({ ...s, drawing_timer_seconds: seconds }));
    const { error } = await supabaseClient.from("rooms").update({ drawing_timer_seconds: seconds }).eq("code", room);
    if (error) {
      setSettings(prev);
      alert("Impossible de mettre à jour le minuteur. Réessaie ou vérifie les droits Supabase.");
    }
  }

  async function updateDuelMode(enabled: boolean) {
    const room = params.roomCode;
    const prev = settings;
    // En mode Duel, on désactive les rôles spéciaux et on force 1 Hors-Thème
    setSettings((s) => ({
      ...s,
      is_duel_mode: enabled,
      has_cameleon: enabled ? false : s.has_cameleon,
      has_dictator: enabled ? false : s.has_dictator,
      has_fantome: enabled ? false : s.has_fantome,
    }));
    const { error } = await supabaseClient
      .from("rooms")
      .update({
        is_duel_mode: enabled,
        ...(enabled ? { has_cameleon: false, has_dictator: false, has_fantome: false } : {}),
      })
      .eq("code", room);
    if (error) {
      setSettings(prev);
      alert("Impossible de mettre à jour le mode Duel. Réessaie.");
    }
  }

  const isDuelMode = settings.is_duel_mode === true;
  // En mode Duel : exactement 2 joueurs requis. Sinon : entre 3 et 15.
  const startDisabled = isDuelMode
    ? playerCount !== 2
    : playerCount < 3 || playerCount > 15;

  if (joinError) {
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <h2>Impossible de rejoindre</h2>
        <p style={{ margin: 0, color: "#f87171" }}>{joinError}</p>
        <button className="btn" type="button" onClick={() => router.push("/")}>
          Retour à l&apos;accueil
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>Lobby</h2>
      <PlayerList players={players} showStatus={false} dimEliminated={false} showLobbyStatus={true} />

      {/* ── Toggle Mode Duel (visible pour l'hôte uniquement à 2 joueurs, hors panneau Paramètres) ── */}
      {isHost && playerCount === 2 && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            background: isDuelMode ? "rgba(250,204,21,0.08)" : "rgba(255,255,255,0.04)",
            border: isDuelMode ? "1.5px solid rgba(250,204,21,0.5)" : "1px solid rgba(255,255,255,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            cursor: "pointer",
          }}
          onClick={() => updateDuelMode(!isDuelMode)}
        >
          <div style={{ display: "grid", gap: 2 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>⚔️ Mode Duel</span>
            <small style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
              2 joueurs · chacun reçoit un mot différent · devine le mot de l&apos;autre
            </small>
          </div>
          <div
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              background: isDuelMode ? "#facc15" : "rgba(255,255,255,0.14)",
              position: "relative",
              transition: "background 0.2s ease",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 3,
                left: isDuelMode ? 23 : 3,
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: isDuelMode ? "#0b0f1a" : "rgba(255,255,255,0.7)",
                transition: "left 0.2s ease",
              }}
            />
          </div>
        </div>
      )}

      {/* ── Bouton "Ajoute des rôles" (hors panneau Paramètres, visible hôte + hors duel) ── */}
      {isHost && !isDuelMode && (
        <>
          <button
            type="button"
            className="btn btn-compact btn-ghost"
            style={{
              border: "1.5px solid rgb(128, 128, 128)",
              color: "#fff",
              background: "rgba(0, 0, 0, 0.82)",
              position: "relative",
              overflow: "hidden",
              height: 64,
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
            onClick={() => setShowRolesList((v) => !v)}
          >
            <Image
              src="/roles.png"
              alt="Illustration des rôles"
              fill
              sizes="320px"
              style={{ objectFit: "cover", opacity: 0.8 }}
              priority
            />
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                zIndex: 1,
                pointerEvents: "none",
              }}
            />
            <span
              style={{
                position: "relative",
                zIndex: 2,
                fontWeight: 700,
                fontSize: 22,
                textShadow: "0 2px 6px rgba(0, 0, 0, 0.35)",
              }}
            >
              Ajoute des rôles
            </span>
          </button>

          {showRolesList && (
            <div
              style={{
                display: "grid",
                gap: 8,
                padding: 10,
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="checkbox"
                  checked={selectedCam}
                  style={getRoleCheckboxStyle(selectedCam)}
                  onChange={(e) => updateRoomSettings(selectedHt, e.target.checked, selectedDict, selectedFant, selectedTheme)}
                />
                <Image src={asset("/roles/chameleon.png")} alt="Caméléon" width={78} height={78} style={{ objectFit: "contain" }} />
                <div style={{ display: "grid", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="tooltip" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      Caméléon
                      <button
                        type="button"
                        className="tooltip-icon"
                        aria-label="Infos Caméléon"
                        onClick={() => setShowCamTooltip((v) => !v)}
                      >
                        i
                      </button>
                      {showCamTooltip && (
                        <div className="tooltip-content">
                          Le Caméléon reçoit le même mot que les civils, mais il joue seul contre tous.
                          Son objectif est de se faire éliminer en se faisant passer pour un joueur Hors-Thème, sans jamais être démasqué comme Caméléon. Si le Caméléon est correctement accusé, il est éliminé et perd immédiatement.
                        </div>
                      )}
                    </span>
                  </div>
                  <small style={{ color: "var(--muted)" }}>
                    Le Caméléon connaît le mot mais doit se faire passer pour un joueur Hors-Thème sans se faire démasquer.
                  </small>
                </div>
              </label>
              <div style={{ height: 1, background: "rgba(255,255,255,0.16)", margin: "4px 0" }} />
              <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="checkbox"
                  checked={selectedDict}
                  style={getRoleCheckboxStyle(selectedDict)}
                  onChange={(e) => updateRoomSettings(selectedHt, selectedCam, e.target.checked, selectedFant, selectedTheme)}
                />
                <Image src={asset("/roles/dictator.png")} alt="Dictateur" width={80} height={80} style={{ objectFit: "contain" }} />
                <div style={{ display: "grid", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="tooltip" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      Dictateur
                      <button
                        type="button"
                        className="tooltip-icon"
                        aria-label="Infos Dictateur"
                        onClick={() => setShowDictTooltip((v) => !v)}
                      >
                        i
                      </button>
                      {showDictTooltip && (
                        <div className="tooltip-content">
                          Le Dictateur joue comme un civil mais survit à la première majorité contre lui.
                          Son prochain vote compte double. S&apos;il est de nouveau majoritaire plus tard, il est éliminé.
                        </div>
                      )}
                    </span>
                  </div>
                  <small style={{ color: "var(--muted)" }}>
                    Si la majorité vote contre lui une première fois, il survit et son prochain vote compte double.
                  </small>
                </div>
              </label>
              <div style={{ height: 1, background: "rgba(255,255,255,0.16)", margin: "4px 0" }} />
              <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="checkbox"
                  checked={selectedFant}
                  style={getRoleCheckboxStyle(selectedFant)}
                  onChange={(e) => updateRoomSettings(selectedHt, selectedCam, selectedDict, e.target.checked, selectedTheme)}
                />
                <Image src={asset("/roles/ghost.png")} alt="Fantôme" width={80} height={80} style={{ objectFit: "contain" }} />
                <div style={{ display: "grid", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="tooltip" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      Fantôme
                      <button
                        type="button"
                        className="tooltip-icon"
                        aria-label="Infos Fantôme"
                        onClick={() => setShowFantTooltip((v) => !v)}
                      >
                        i
                      </button>
                      {showFantTooltip && (
                        <div className="tooltip-content">
                          Le Fantôme joue comme un Civil avec le même mot. Mais s&apos;il est éliminé,
                          il devient un fantôme et peut continuer à voter dans tous les tours suivants !
                        </div>
                      )}
                    </span>
                  </div>
                  <small style={{ color: "var(--muted)" }}>
                    S&apos;il est éliminé, il continue de voter depuis l&apos;au-delà.
                  </small>
                </div>
              </label>
            </div>
          )}

          {(selectedCam || selectedDict || selectedFant) && (
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", padding: "6px 2px" }}>
              {selectedCam && (
                <div
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 6, padding: "6px 10px", borderRadius: 10,
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  <Image src={asset("/roles/chameleon.png")} alt="Caméléon sélectionné" width={48} height={48} />
                </div>
              )}
              {selectedDict && (
                <div
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 6, padding: "6px 10px", borderRadius: 10,
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  <Image src={asset("/roles/dictator.png")} alt="Dictateur sélectionné" width={48} height={48} />
                </div>
              )}
              {selectedFant && (
                <div
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 6, padding: "6px 10px", borderRadius: 10,
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  <Image src={asset("/roles/ghost.png")} alt="Fantôme sélectionné" width={48} height={48} />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Panneau Paramètres (masqué en mode Duel car tout est désactivé) */}
      {isHost && !isDuelMode && (
        <div
          className="card"
          style={{ display: "grid", gap: 10 }}
        >
          <button
            type="button"
            className="btn btn-compact btn-ghost"
            onClick={() => setShowHostParams((v) => !v)}
            style={{ justifyContent: "space-between", width: "100%", padding: "10px 12px", color: "#ffffff" }}
          >
            <span style={{ fontWeight: 700 }}>Paramètres</span>
            <span aria-hidden="true">{showHostParams ? "▲" : "▼"}</span>
          </button>

          {showHostParams && (
            <div style={{ display: "grid", gap: 10 }}>
              <label style={{ display: "grid", gap: 6 }}>
                Thème des mots
                <select
                  className="input"
                  value={selectedTheme}
                  onChange={(e) => updateRoomSettings(selectedHt, selectedCam, selectedDict, selectedFant, e.target.value)}
                >
                  {themes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                Hors-Thème
                {hasSingleHtOption ? (
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.16)",
                      background: "rgba(255,255,255,0.04)",
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.72)",
                    }}
                  >
                    {htDisplay}
                  </div>
                ) : (
                  <select
                    className="input"
                    value={selectedHt}
                    onChange={(e) => updateRoomSettings(Number(e.target.value), selectedCam, selectedDict, selectedFant, selectedTheme)}
                  >
                    {options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt} Hors-Thème
                      </option>
                    ))}
                  </select>
                )}
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                Durée du dessin
                <select
                  className="input"
                  value={settings.drawing_timer_seconds ?? 60}
                  onChange={(e) => updateTimer(Number(e.target.value))}
                >
                  {[30, 45, 60, 90, 120].map((s) => (
                    <option key={s} value={s}>
                      {s} secondes
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>
      )}{/* fin panneau Paramètres */}

      {!isHost && (
        <div
          className="card"
          style={{ display: "grid", gap: 10, border: "1px solid rgba(255,255,255,0.2)" }}
        >
          <button
            type="button"
            className="btn btn-compact btn-ghost"
            onClick={() => setShowPlayerParams((v) => !v)}
            style={{ justifyContent: "space-between", width: "100%", padding: "10px 12px", color: "rgba(255,255,255,0.8)" }}
          >
            <span style={{ fontWeight: 700 }}>Paramètres de la partie</span>
            <span aria-hidden="true">{showPlayerParams ? "▲" : "▼"}</span>
          </button>

          {showPlayerParams && (
            <div style={{ display: "grid", gap: 8 }}>
              {/* Mode Duel — affiché en priorité si actif */}
              {isDuelMode ? (
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "rgba(250,204,21,0.08)",
                    border: "1.5px solid rgba(250,204,21,0.5)",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 22 }}>⚔️</span>
                  <div style={{ display: "grid", gap: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>Mode Duel activé</span>
                    <small style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
                      2 joueurs · chacun a un mot différent · devine le mot de l&apos;autre
                    </small>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <strong>Thème :</strong>{" "}
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 8px",
                        borderRadius: 8,
                        background: "rgba(255,255,255,0.06)",
                        color: "#e5e7eb",
                        border: "1px solid rgba(255,255,255,0.18)",
                      }}
                    >
                      {themeLabel}
                    </span>
                  </div>
                  <div>
                    <strong>Hors-Thème :</strong>{" "}
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 8px",
                        borderRadius: 8,
                        background: "rgba(255,255,255,0.06)",
                        color: "#e5e7eb",
                        border: "1px solid rgba(255,255,255,0.18)",
                      }}
                    >
                      {htDisplay}
                    </span>
                  </div>
                  <div>
                    <strong>Durée du dessin :</strong>{" "}
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 8px",
                        borderRadius: 8,
                        background: "rgba(255,255,255,0.06)",
                        color: "#e5e7eb",
                        border: "1px solid rgba(255,255,255,0.18)",
                      }}
                    >
                      {settings.drawing_timer_seconds ?? 60} secondes
                    </span>
                  </div>
                  <div style={{ display: "grid", gap: 6 }}>
                    <strong>Rôles activés :</strong>
                    {selectedCam || selectedDict || selectedFant ? (
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          alignItems: "center",
                          flexWrap: "wrap",
                          justifyContent: "flex-start",
                        }}
                      >
                        {selectedCam && (
                          <div style={{ display: "grid", justifyItems: "center", gap: 4 }}>
                            <Image src={asset("/roles/chameleon.png")} alt="Caméléon" width={64} height={64} />
                            <span style={{ fontWeight: 700, fontSize: 13, textAlign: "center" }}>Caméléon</span>
                          </div>
                        )}
                        {selectedDict && (
                          <div style={{ display: "grid", justifyItems: "center", gap: 4 }}>
                            <Image src={asset("/roles/dictator.png")} alt="Dictateur" width={64} height={64} />
                            <span style={{ fontWeight: 700, fontSize: 13, textAlign: "center" }}>Dictateur</span>
                          </div>
                        )}
                        {selectedFant && (
                          <div style={{ display: "grid", justifyItems: "center", gap: 4 }}>
                            <Image src={asset("/roles/ghost.png")} alt="Fantôme" width={64} height={64} />
                            <span style={{ fontWeight: 700, fontSize: 13, textAlign: "center" }}>Fantôme</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: "rgba(155, 155, 155, 0.7)" }}>Aucun rôle spécial</span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {isHost ? (
        <>
          {startDisabled && isDuelMode && playerCount !== 2 && (
            <p style={{ margin: 0, color: "rgba(250,204,21,0.85)", fontSize: 13 }}>
              Le mode Duel nécessite exactement 2 joueurs ({playerCount} actuellement).
            </p>
          )}
          {startDisabled && !isDuelMode && playerCount < 3 && (
            <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
              Il faut au moins 3 joueurs pour lancer une partie classique.
            </p>
          )}
          <button
            className="btn"
            disabled={startDisabled}
            style={{ opacity: startDisabled ? 0.5 : 1 }}
            onClick={async () => {
              const resp = await fetch("/api/game/start", {
                method: "POST",
                body: JSON.stringify({
                  roomCode: params.roomCode,
                  settings: {
                    hors_theme_count: isDuelMode ? 1 : selectedHt,
                    has_cameleon: isDuelMode ? false : selectedCam,
                    has_dictator: isDuelMode ? false : selectedDict,
                    has_fantome: isDuelMode ? false : selectedFant,
                    word_theme: selectedTheme,
                    drawing_timer_seconds: settings.drawing_timer_seconds ?? 60,
                  },
                }),
              });
              if (!resp.ok) return;
              router.push(`/room/${params.roomCode}/word?nickname=${encodeURIComponent(nickname)}`);
            }}
          >
            {isDuelMode ? "⚔️ Démarrer le Duel" : "Démarrer"}
          </button>
        </>
      ) : (
        <p>En attente de l&apos;hôte pour lancer la partie.</p>
      )}
    </div>
  );
}
