"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { Player } from "@/lib/types";
import { PlayerList } from "@/components/PlayerList";

type RoomSettings = {
  hors_theme_count: number;
  has_cameleon: boolean;
  has_dictator: boolean;
  host_nickname?: string | null;
  current_phase?: string | null;
  drawing_timer_seconds?: number;
  word_theme?: string | null;
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
  if (playerCount <= 4) return { options: [1], camAllowed: true };
  if (playerCount <= 6) return { options: [1, 2], camAllowed: true };
  return { options: [2, 3], camAllowed: true }; // 7-8
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
    drawing_timer_seconds: 60,
    word_theme: "general",
  });
  const [showCamTooltip, setShowCamTooltip] = useState(false);
  const [showDictTooltip, setShowDictTooltip] = useState(false);
  const [showRolesList, setShowRolesList] = useState(false);

  const playerCount = players.length;
  const { options } = allowedSettings(playerCount);
  const selectedHt = options.includes(settings.hors_theme_count) ? settings.hors_theme_count : options[0];
  const selectedCam = settings.has_cameleon ?? false;
  const selectedDict = settings.has_dictator ?? false;
  const selectedTheme = settings.word_theme || "general";

  const themes = [
    { value: "general", label: "Général" },
    { value: "animaux", label: "Animaux" },
    { value: "nourriture", label: "Nourriture" },
    { value: "voyage", label: "Voyage" },
    { value: "objets", label: "Objets du quotidien" },
    { value: "sport", label: "Sport" },
    { value: "technologie", label: "Technologie" },
  ];

  const themeLabel = themes.find((t) => t.value === selectedTheme)?.label ?? "Général";

  const isHost = useMemo(() => settings.host_nickname === nickname, [settings.host_nickname, nickname]);

  useEffect(() => {
    const room = params.roomCode;
    if (!room) return;
    let channel: ReturnType<typeof supabaseClient.channel> | null = null;
    let pollPlayers: NodeJS.Timeout | null = null;

    async function init() {
      // 1) Crée la room si elle n'existe pas
      const { data: roomRow } = await supabaseClient
        .from("rooms")
        .select("*")
        .eq("code", room)
        .maybeSingle();

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
        host_nickname: hostNickname,
        current_phase: roomRow?.current_phase ?? "LOBBY",
        drawing_timer_seconds: roomRow?.drawing_timer_seconds ?? 60,
        word_theme: roomRow?.word_theme ?? "general",
      });

      const amHost = hostNickname === nickname;

      // 2) Upsert player avec flag hôte
      await supabaseClient.from("players").upsert({
        room_code: room,
        nickname,
        role: "CIVIL",
        has_used_chameleon_accusation: false,
        is_eliminated: false,
        is_host: amHost,
        is_in_lobby: true,
      });

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
              host_nickname: n?.host_nickname ?? prev.host_nickname,
              current_phase: n?.current_phase ?? prev.current_phase,
              drawing_timer_seconds: n?.drawing_timer_seconds ?? prev.drawing_timer_seconds,
              word_theme: n?.word_theme ?? prev.word_theme ?? "general",
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
    }

    void init();

    return () => {
      channel?.unsubscribe();
      if (pollPlayers) clearInterval(pollPlayers);
    };
  }, [nickname, params.roomCode]);

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
    word_theme?: string,
  ) {
    const room = params.roomCode;
    const nextTheme = word_theme ?? settings.word_theme ?? "general";
    setSettings((s) => ({ ...s, hors_theme_count, has_cameleon, has_dictator, word_theme: nextTheme }));
    await supabaseClient
      .from("rooms")
      .update({ hors_theme_count, has_cameleon, has_dictator, word_theme: nextTheme })
      .eq("code", room);
  }

  async function updateTimer(seconds: number) {
    const room = params.roomCode;
    setSettings((s) => ({ ...s, drawing_timer_seconds: seconds }));
    await supabaseClient.from("rooms").update({ drawing_timer_seconds: seconds }).eq("code", room);
  }

  const startDisabled = playerCount < 3 || playerCount > 8;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>Lobby</h2>
      <PlayerList players={players} showStatus={false} dimEliminated={false} />

      {isHost && (
        <div className="card" style={{ display: "grid", gap: 10 }}>
          <h4>Paramètres de rôle (Hôte)</h4>
          <label style={{ display: "grid", gap: 6 }}>
            Thème des mots
            <select
              className="input"
              value={selectedTheme}
              onChange={(e) => updateRoomSettings(selectedHt, selectedCam, selectedDict, e.target.value)}
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
            <select
              className="input"
              value={selectedHt}
              onChange={(e) => updateRoomSettings(Number(e.target.value), selectedCam, selectedDict, selectedTheme)}
            >
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} Hors-Thème
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn btn-compact btn-ghost"
            style={{
              border: "1.5px solid rgba(250, 204, 21, 0.7)",
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
                  onChange={(e) => updateRoomSettings(selectedHt, e.target.checked, selectedDict, selectedTheme)}
                />
                <Image src="/roles/chameleon.png" alt="Caméléon" width={40} height={40} style={{ objectFit: "contain" }} />
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
              <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="checkbox"
                  checked={selectedDict}
                  onChange={(e) => updateRoomSettings(selectedHt, selectedCam, e.target.checked, selectedTheme)}
                />
                <Image src="/roles/dictator.png" alt="Dictateur" width={40} height={40} style={{ objectFit: "contain" }} />
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
                          Son prochain vote compte double. S'il est de nouveau majoritaire plus tard, il est éliminé.
                        </div>
                      )}
                    </span>
                  </div>
                  <small style={{ color: "var(--muted)" }}>
                    Si la majorité vote contre lui une première fois, il survit et son prochain vote compte double.
                  </small>
                </div>
              </label>
              <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>D'autres rôles seront ajoutés plus tard.</p>
            </div>
          )}
          {(selectedCam || selectedDict) && (
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", padding: "6px 2px" }}>
              {selectedCam && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 10px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  <Image src="/roles/chameleon.png" alt="Caméléon sélectionné" width={32} height={32} />
                  <span style={{ fontWeight: 700 }}>Caméléon</span>
                </div>
              )}
              {selectedDict && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 10px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  <Image src="/roles/dictator.png" alt="Dictateur sélectionné" width={32} height={32} />
                  <span style={{ fontWeight: 700 }}>Dictateur</span>
                </div>
              )}
            </div>
          )}
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

      {!isHost && (
        <div className="card" style={{ display: "grid", gap: 10 }}>
          <h4>Paramètres de la partie</h4>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Lecture seule : seuls les hôtes peuvent modifier ces valeurs.
          </p>
          <div style={{ display: "grid", gap: 8 }}>
            <div>
              <strong>Thème :</strong> {themeLabel}
            </div>
            <div>
              <strong>Hors-Thème :</strong> {selectedHt} joueur(s)
            </div>
            <div>
              <strong>Rôles activés :</strong>{" "}
              {selectedCam || selectedDict ? (
                <span style={{ display: "inline-flex", gap: 10, alignItems: "center" }}>
                  {selectedCam && (
                    <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                      <Image src="/roles/chameleon.png" alt="Caméléon" width={24} height={24} />
                      Caméléon
                    </span>
                  )}
                  {selectedDict && (
                    <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                      <Image src="/roles/dictator.png" alt="Dictateur" width={24} height={24} />
                      Dictateur
                    </span>
                  )}
                </span>
              ) : (
                "Aucun rôle spécial"
              )}
            </div>
            <div>
              <strong>Durée du dessin :</strong> {settings.drawing_timer_seconds ?? 60} secondes
            </div>
          </div>
          <small style={{ color: "var(--muted)" }}>
            Les changements de l'hôte sont reçus en direct : pas besoin d'actualiser.
          </small>
        </div>
      )}

      {isHost ? (
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
                  hors_theme_count: selectedHt,
                  has_cameleon: selectedCam,
                  has_dictator: selectedDict,
                  word_theme: selectedTheme,
                  drawing_timer_seconds: settings.drawing_timer_seconds ?? 60,
                },
              }),
            });
            if (!resp.ok) return;
            router.push(`/room/${params.roomCode}/word?nickname=${encodeURIComponent(nickname)}`);
          }}
        >
          Démarrer
        </button>
      ) : (
        <p>En attente de l'hôte pour lancer la partie.</p>
      )}
    </div>
  );
}
