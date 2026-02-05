"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { Player } from "@/lib/types";

const ASSET_VERSION = "v2";
const asset = (path: string) => `${path}?v=${ASSET_VERSION}`;

function mapPlayerRow(row: any): Player {
  return {
    id: row.id,
    nickname: row.nickname,
    role: row.role,
    hasUsedChameleonAccusation: row.has_used_chameleon_accusation ?? false,
    isEliminated: row.is_eliminated ?? false,
    isHost: row.is_host ?? false,
    dictatorImmunityUsed: row.dictator_immunity_used ?? false,
    dictatorDoubleVoteActive: row.dictator_double_vote_active ?? false,
  };
}

interface ResultRow {
  eliminated_player_id: string | null;
  is_chameleon: boolean | null;
  round_id: string;
  dictator_survived?: boolean | null;
}

interface VoteRow {
  target_player_id: string;
  round_id: string;
  weight?: number | null;
}

interface ChameleonAccusationRow {
  target_player_id: string;
  accuser_nickname: string;
}

export default function ResultsPage() {
  const params = useParams<{ roomCode: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const nickname = search.get("nickname") || "Guest";
  const [players, setPlayers] = useState<Player[]>([]);
  const [result, setResult] = useState<ResultRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [phase, setPhase] = useState<string | null>(null);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [tieIds, setTieIds] = useState<string[]>([]);
  const [accusations, setAccusations] = useState<ChameleonAccusationRow[]>([]);
  const [visibleTooltipPlayerId, setVisibleTooltipPlayerId] = useState<string | null>(null);
  const tooltipTimeout = useRef<NodeJS.Timeout | null>(null);
  const resolvedRef = useRef(false);

  const clearTooltipTimeout = () => {
    if (tooltipTimeout.current) {
      clearTimeout(tooltipTimeout.current);
      tooltipTimeout.current = null;
    }
  };

  const showTooltip = (playerId: string) => {
    clearTooltipTimeout();
    setVisibleTooltipPlayerId(playerId);
  };

  const flashTooltip = (playerId: string) => {
    showTooltip(playerId);
    tooltipTimeout.current = setTimeout(() => {
      setVisibleTooltipPlayerId(null);
    }, 1500);
  };

  const hideTooltip = () => {
    clearTooltipTimeout();
    setVisibleTooltipPlayerId(null);
  };

  useEffect(() => {
    const room = params.roomCode;
    let channel: ReturnType<typeof supabaseClient.channel> | null = null;
    let pollPhase: NodeJS.Timeout | null = null;
    let pollRound: NodeJS.Timeout | null = null;

    supabaseClient
      .from("players")
      .select("*")
      .eq("room_code", room)
      .then(({ data }) => setPlayers((data || []).map(mapPlayerRow)));

    supabaseClient
      .from("rounds")
      .select("last_eliminated_player_id, last_eliminated_is_chameleon, dictator_survived, id, tie_player_ids")
      .eq("room_code", room)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
      .then((res) => {
        const data = res?.data;
        setResult(
          data
            ? {
                eliminated_player_id: data.last_eliminated_player_id,
                is_chameleon: data.last_eliminated_is_chameleon,
                round_id: data.id,
                dictator_survived: data.dictator_survived,
              }
            : null,
        );
        setRoundId(data?.id ?? null);
        setTieIds((data?.tie_player_ids as string[]) || []);
      });

    supabaseClient
      .from("votes")
      .select("target_player_id, round_id, weight")
      .order("created_at", { ascending: true })
      .then(({ data }) => setVotes((data as VoteRow[]) || []));

    supabaseClient
      .from("chameleon_accusations")
      .select("target_player_id, accuser_nickname")
      .eq("room_code", room)
      .then(({ data }) => setAccusations((data as ChameleonAccusationRow[]) || []));

    supabaseClient
      .from("rooms")
      .select("current_phase")
      .eq("code", room)
      .maybeSingle()
      .then(({ data }) => setPhase(data?.current_phase ?? null));

    channel = supabaseClient
      .channel(`results:${room}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `code=eq.${room}` },
        ({ new: n }) => setPhase(n?.current_phase ?? null),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `room_code=eq.${room}` },
        () => {
          supabaseClient
            .from("players")
            .select("*")
            .eq("room_code", room)
            .then(({ data }) => setPlayers((data || []).map(mapPlayerRow)));
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chameleon_accusations", filter: `room_code=eq.${room}` },
        () => {
          supabaseClient
            .from("chameleon_accusations")
            .select("target_player_id, accuser_nickname")
            .eq("room_code", room)
            .then(({ data }) => setAccusations((data as ChameleonAccusationRow[]) || []));
        },
      )
      .subscribe();

    pollPhase = setInterval(() => {
      supabaseClient
        .from("rooms")
        .select("current_phase")
        .eq("code", room)
        .single()
        .then(({ data }) => setPhase(data?.current_phase ?? null));
    }, 500);

    pollRound = setInterval(() => {
      supabaseClient
        .from("rounds")
        .select("id, tie_player_ids, last_eliminated_player_id, last_eliminated_is_chameleon, dictator_survived")
        .eq("room_code", room)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          setRoundId(data?.id ?? roundId);
          setTieIds((data?.tie_player_ids as string[]) || []);
          if (data) {
            setResult({
              eliminated_player_id: data.last_eliminated_player_id,
              is_chameleon: data.last_eliminated_is_chameleon,
              round_id: data.id,
              dictator_survived: data.dictator_survived,
            });
          }
        });
    }, 500);

    return () => {
      channel?.unsubscribe();
      if (pollPhase) clearInterval(pollPhase);
      if (pollRound) clearInterval(pollRound);
    };
  }, [nickname, params.roomCode, roundId]);

  useEffect(() => {
    return () => {
      clearTooltipTimeout();
    };
  }, []);

  // Rafraîchit les votes du round courant pour afficher les compteurs.
  useEffect(() => {
    if (!roundId) return;
    supabaseClient
      .from("votes")
      .select("target_player_id, round_id, weight")
      .eq("round_id", roundId)
      .order("created_at", { ascending: true })
      .then(({ data }) => setVotes((data as VoteRow[]) || []));
  }, [roundId]);

  // Attente de la phase RESULTS, ou WORD/DRAW si nouveau tour.
  // Spectateurs (éliminés) restent sur cette page pour éviter les aller-retours.
  const me = players.find((p) => p.nickname === nickname);
  const isMeEliminated = !!me?.isEliminated;
  const isHost = me?.isHost;

  useEffect(() => {
    if (isMeEliminated) {
      setLoading(false);
      return;
    }
    if (phase === "WORD") {
      router.replace(`/room/${params.roomCode}/word?nickname=${encodeURIComponent(nickname)}`);
    }
    if (phase === "DRAW") {
      (async () => {
        try {
          const { data } = await supabaseClient
            .from("rounds")
            .select("timer_seconds")
            .eq("room_code", params.roomCode)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          const t = data?.timer_seconds ?? 60;
          router.replace(
            `/room/${params.roomCode}/draw?nickname=${encodeURIComponent(nickname)}&timer=${t}`,
          );
        } catch (e) {
          router.replace(
            `/room/${params.roomCode}/draw?nickname=${encodeURIComponent(nickname)}&timer=60`,
          );
        }
      })();
      return;
    }
    if (phase === "VOTE") {
      router.replace(`/room/${params.roomCode}/vote?nickname=${encodeURIComponent(nickname)}`);
      return;
    }
    if (phase === "RESULTS" && !resolvedRef.current) {
      resolvedRef.current = true;
      fetch("/api/resolve", {
        method: "POST",
        body: JSON.stringify({ roomCode: params.roomCode }),
      })
        .then((r) => r.json())
        .then((r) => {
          if (r?.tie === true && Array.isArray(r.tiePlayerIds)) {
            setTieIds(r.tiePlayerIds);
          } else {
            setTieIds([]);
          }
          // Force un refresh joueurs/rounds pour refléter l'élimination
          supabaseClient
            .from("players")
            .select("*")
            .eq("room_code", params.roomCode)
            .then(({ data }) => setPlayers((data || []).map(mapPlayerRow)));
          supabaseClient
            .from("rounds")
            .select("id, last_eliminated_player_id, last_eliminated_is_chameleon, tie_player_ids, dictator_survived")
            .eq("room_code", params.roomCode)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
            .then(({ data }) => {
              if (data) {
                setResult({
                  eliminated_player_id: data.last_eliminated_player_id,
                  is_chameleon: data.last_eliminated_is_chameleon,
                  round_id: data.id,
                  dictator_survived: data.dictator_survived,
                });
                setTieIds((data.tie_player_ids as string[]) || []);
                setRoundId(data.id);
              }
            });
        })
        .catch(() => {
          /* ignore */
        });
    }
    if (phase !== "RESULTS") {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [isMeEliminated, phase, nickname, params.roomCode, router, players]);

  const eliminated = players.find((p) => p.id === result?.eliminated_player_id);
  const dictatorPlayer = players.find((p) => p.role === "DICTATOR");

  const voteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    votes
      .filter((v) => !roundId || v.round_id === roundId)
      .forEach((v) => {
        const weight = typeof v.weight === "number" && v.weight > 0 ? v.weight : 1;
        counts[v.target_player_id] = (counts[v.target_player_id] || 0) + weight;
      });
    return counts;
  }, [votes, roundId]);

  const maxVotes = useMemo(() => Math.max(0, ...Object.values(voteCounts)), [voteCounts]);

  const accusationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    accusations.forEach((a) => {
      counts[a.target_player_id] = (counts[a.target_player_id] || 0) + 1;
    });
    return counts;
  }, [accusations]);

  const accusersByTarget = useMemo(() => {
    const map: Record<string, string[]> = {};
    accusations.forEach((a) => {
      if (!map[a.target_player_id]) map[a.target_player_id] = [];
      map[a.target_player_id].push(a.accuser_nickname);
    });
    return map;
  }, [accusations]);

  const accusationTooltipStyle = {
    position: "absolute",
    top: -32,
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(0,0,0,0.85)",
    color: "white",
    padding: "6px 8px",
    borderRadius: 8,
    fontSize: 12,
    whiteSpace: "nowrap",
    pointerEvents: "none",
    boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
    zIndex: 2,
  } as const;

  // Si le Caméléon a été accusé correctement, on ne doit pas afficher d'égalité même si les votes sont ex æquo.
  const wasAccusedCameleon = eliminated?.role === "CAMELEON" && result?.is_chameleon === false;

  // Fallback tie detection côté client (au cas où tie_player_ids n'est pas encore propagé).
  const computedTieIds = useMemo(() => {
    if (wasAccusedCameleon) return [];
    if (tieIds.length > 0) return tieIds;
    if (maxVotes === 0) return [];
    const leaders = Object.entries(voteCounts)
      .filter(([, c]) => c === maxVotes)
      .map(([id]) => id);
    return leaders.length > 1 ? leaders : [];
  }, [maxVotes, tieIds, voteCounts, wasAccusedCameleon]);

  const alivePlayers = players.filter((p) => !p.isEliminated);
  const horsThemeAlive = alivePlayers.filter((p) => p.role === "HORS_THEME").length;
  const eliminatedRole = eliminated?.role ?? null;
  const horsThemeWin = horsThemeAlive >= Math.ceil(alivePlayers.length / 2);
  const dictatorSurvived =
    result?.dictator_survived === true ||
    (result?.eliminated_player_id === null &&
      players.some((p) => p.role === "DICTATOR" && p.dictatorImmunityUsed && !p.isEliminated));

  // Conditions de fin / poursuite
  const civilsWin = eliminatedRole === "HORS_THEME" && horsThemeAlive === 0;
  const cameleonWin = result?.is_chameleon === true;
  const hostCanStartNewRound =
    !civilsWin && !cameleonWin && eliminatedRole !== "HORS_THEME" && horsThemeAlive < alivePlayers.length / 2 && !dictatorSurvived;

  const hasTie = computedTieIds.length > 0;

  const outcome = useMemo(() => {
    if (result?.is_chameleon === true) {
      return "Caméléon gagne (éliminé sans accusation correcte)";
    }
    if (result?.is_chameleon === false && eliminated?.role === "CAMELEON") {
      return "Joueur éliminé";
    }
    if (horsThemeAlive === 0) {
      return "Civils gagnent (tous les Hors-Thème éliminés)";
    }
    if (horsThemeAlive >= Math.ceil(alivePlayers.length / 2)) {
      return "Hors-Thème gagnent (≥50% des joueurs restants)";
    }
    return "La partie continue";
  }, [alivePlayers.length, eliminated?.role, horsThemeAlive, result?.is_chameleon]);

  const horsThemeMinoritaire = horsThemeAlive < alivePlayers.length / 2;
  const gameEnded = outcome && outcome !== "La partie continue";
  const winnersLabel =
    outcome === "Civils gagnent (tous les Hors-Thème éliminés)"
      ? "Civils"
      : outcome === "Hors-Thème gagnent (≥50% des joueurs restants)"
        ? "Hors-Thème"
        : outcome === "Caméléon gagne (éliminé sans accusation correcte)"
          ? "Caméléon"
        : outcome === "Joueur éliminé"
            ? "Civils"
            : null;

  // Style spécifique pour le message d'issue quand on affiche "Joueur éliminé".
  const outcomeStyle = useMemo(() => {
    return outcome === "Joueur éliminé" ? { color: "#f97316", fontWeight: 600 } : undefined;
  }, [outcome]);

  // Pour styliser les cartes gagnantes en fin de partie
  const winningRoles = useMemo(() => {
    if (!winnersLabel) return [];
    if (winnersLabel === "Caméléon") return ["CAMELEON"];
    if (winnersLabel === "Hors-Thème") return ["HORS_THEME"];
    // Cas "Civils" : inclut CIVIL et DICTATOR qui est côté civils.
    return ["CIVIL", "DICTATOR"];
  }, [winnersLabel]);

  // Quand le Caméléon est identifié, seuls les accusateurs sont gagnants visuellement.
  const winningAccusers = useMemo(() => {
    if (!(result?.is_chameleon === false && eliminated?.role === "CAMELEON")) return [];
    return accusersByTarget[eliminated?.id || ""] || [];
  }, [accusersByTarget, eliminated?.id, eliminated?.role, result?.is_chameleon]);

  // Libellé d'en-tête pour les gagnants : on affiche le rôle gagnant (pas les pseudos).
  const winnersNamesLabel = useMemo(() => {
    return winnersLabel;
  }, [winnersLabel]);

  const winnerHeading = useMemo(() => {
    if (winningAccusers.length > 0) {
      const names = winningAccusers;
      return names.length === 1 ? `${names[0]} a gagné` : `${names.join(", ")} ont gagné`;
    }
    const singular = winnersLabel === "Caméléon";
    if (!winnersLabel) return "…";
    return singular ? `Le ${winnersLabel} a gagné` : `Les ${winnersLabel} ont gagné`;
  }, [winningAccusers, winnersLabel]);

  async function goToLobbyAndMaybeReset() {
    const room = params.roomCode;
    // Marque ce joueur comme de retour au lobby
    await supabaseClient
      .from("players")
      .update({ is_in_lobby: true })
      .eq("room_code", room)
      .eq("nickname", nickname);

    // Vérifie si tout le monde est revenu au lobby
    const { data: allPlayers } = await supabaseClient
      .from("players")
      .select("nickname, is_in_lobby, is_host")
      .eq("room_code", room);

    const everyoneBack = (allPlayers || []).every((p) => p.is_in_lobby === true);
    const hostNick = (allPlayers || []).find((p) => p.is_host)?.nickname;
    const iAmHost = hostNick === nickname;

    if (everyoneBack && iAmHost) {
      // Un seul reset, déclenché par l'hôte quand tous sont au lobby
      await fetch("/api/game/reset", {
        method: "POST",
        body: JSON.stringify({ roomCode: room }),
      });
    }

    router.replace(`/room/${room}?nickname=${encodeURIComponent(nickname)}`);
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>Résultat du tour</h2>
      {loading && <p>Résolution des votes…</p>}
      {computedTieIds.length > 0 && (
        <div
          className="card result-pop"
          style={{ display: "grid", gap: 10, justifyItems: "center", textAlign: "center" }}
        >
          <strong style={{ fontSize: 18 }}>Égalité détectée</strong>
          <p style={{ margin: 0 }}>Revote entre :</p>
          <ul style={{ paddingLeft: 0, margin: 0, display: "grid", gap: 4, listStyle: "none" }}>
            {players
              .filter((p) => computedTieIds.includes(p.id))
              .map((p) => (
                <li key={p.id}>{p.nickname}</li>
              ))}
          </ul>
          {isHost ? (
            <p style={{ margin: 0 }}></p>
          ) : (
            <p style={{ margin: 0 }}>En attente de l&apos;hôte…</p>
          )}
        </div>
      )}
      {dictatorSurvived ? (
        <div className="card result-pop" style={{ display: "grid", gap: 4, justifyItems: "center", textAlign: "center" }}>
          <Image
            src="/roles/dictator.png"
            alt="Rôle Dictateur"
            width={190}
            height={190}
            style={{ marginTop: -20, marginBottom: -30 }}
          />
          <div style={{ display: "grid", gap: 2 }}>
            <strong style={{ fontSize: 18, lineHeight: 1.2, marginTop: 0 }}>
              {dictatorPlayer?.nickname ?? "Le Dictateur"} est le Dictateur
            </strong>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginBottom: 20 }}>Immunité utilisée.</span>
          </div>
          <p style={{ margin: 0 }}>Immunité utilisée. Son prochain vote comptera double.</p>
          <p style={{ margin: 0 }}>Aucun joueur n&apos;est éliminé ce tour.</p>
        </div>
      ) : eliminated ? (
        eliminated.role === "CIVIL" ? (
          <div className="card result-pop" style={{ display: "grid", gap: 6, justifyItems: "center", textAlign: "center" }}>
            <Image
              src="/roles/civil.png"
              alt="Rôle Civil"
              width={190}
              height={190}
              style={{ marginTop: -20, marginBottom: -12 }} // laisse plus d'espace avant le nom du rôle
            />
            <div style={{ display: "grid", gap: 4 }}>
              <strong style={{ fontSize: 18, lineHeight: 1.2, marginTop: 0 }}>
                {eliminated.nickname} était un Civil
              </strong>
              <span style={{ color: "rgba(255,255,255,0.78)", fontSize: 14 }}>Il est éliminé.</span>
            </div>
          </div>
        ) : (
          <div className="card result-pop" style={{ display: "grid", gap: 8, justifyItems: "center", textAlign: "center" }}>
            {eliminated.role === "CAMELEON" && (
              <Image
                src={asset("/roles/chameleon.png")}
                alt="Rôle Caméléon"
                width={190}
                height={190}
                style={{ marginTop: -12, marginBottom: -6, objectFit: "contain" }}
              />
            )}
            {eliminated.role === "HORS_THEME" && (
              <Image
                src={asset("/roles/hors-theme.png")}
                alt="Rôle Hors-Thème"
                width={160}
                height={160}
                style={{ marginTop: -12, marginBottom: -20, objectFit: "contain" }}
              />
            )}
            <strong style={{ fontSize: 18 }}>{eliminated.nickname}</strong>
            <p style={{ margin: 0 }}>Rôle : {eliminated.role}</p>
            <p style={{ margin: 0, color: "#f97316", fontWeight: 600 }}>Joueur éliminé</p>
            {result?.is_chameleon === true && <p style={{ margin: 0 }}>Le Caméléon a été éliminé → victoire Caméléon.</p>}
            {result?.is_chameleon === false && eliminated?.role === "CAMELEON" && (
              <p style={{ margin: 0 }}>
                Caméléon identifié
                {accusersByTarget[eliminated.id]?.length
                  ? ` par ${accusersByTarget[eliminated.id].join(", ")}`
                  : ""}
              </p>
            )}
            {outcome && (
              <p style={{ margin: 0, ...(outcomeStyle || {}) }}>
                {outcome}
              </p>
            )}
          </div>
        )
      ) : (
        <div className="card result-pop" style={{ textAlign: "center" }}>
          <p style={{ margin: 0 }}>Aucun joueur éliminé.</p>
        </div>
      )}

      {gameEnded && winnersLabel && (
        <div
          className="card result-pop results-summary"
          style={{ display: "grid", gap: 10, justifyItems: "center", textAlign: "center", padding: "16px 12px" }}
        >
          <strong style={{ fontSize: 18, textTransform: "uppercase" }}>Partie terminée</strong>
          <span style={{ fontSize: 16, fontWeight: 600 }}>{winnerHeading}</span>
          <div
            className="results-winners-grid"
            style={{
              display: "grid",
              gap: 10,
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              width: "100%",
            }}
          >
            {players.map((p) => {
              // Si Caméléon identifié : seuls les accusateurs sont gagnants. Sinon, on utilise les rôles gagnants.
              const isWinnerCard =
                winningAccusers.length > 0 ? winningAccusers.includes(p.nickname) : winningRoles.includes(p.role);
              return (
              <div
                key={p.id}
                style={{
                  display: "grid",
                  gap: 2, // rapproche l'image du nom
                  justifyItems: "center",
                  padding: 10,
                  background: isWinnerCard ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.03)",
                  borderRadius: 12,
                  border: isWinnerCard ? "2px solid #22c55e" : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Image
                  src={
                    p.role === "CAMELEON"
                      ? asset("/roles/chameleon.png")
                      : p.role === "DICTATOR"
                        ? asset("/roles/dictator.png")
                        : p.role === "HORS_THEME"
                          ? asset("/roles/hors-theme.png")
                          : asset("/roles/civil.png")
                  }
                  alt={`Rôle ${p.role}`}
                  width={80}
                  height={80}
                  style={{ objectFit: "contain", marginBottom: -2 }} // réduit l'espace sous l'image
                />
                <span style={{ fontWeight: 700 }}>{p.nickname}</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{p.role}</span>
              </div>
            );
            })}
          </div>
        </div>
      )}

      <div className="card">
        <h4 style={{ marginBottom: 10 }}>Votes</h4>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
          {players
            .filter((p) => !p.isEliminated || p.id === result?.eliminated_player_id)
            .map((p) => {
            const count = voteCounts[p.id] || 0;
            const accusers = accusersByTarget[p.id] || [];
            const accusationCount = accusers.length || accusationCounts[p.id] || 0;
            const isTop = count === maxVotes && maxVotes > 0;
            return (
              <li
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: isTop ? "#f97316" : undefined,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <span>{p.nickname}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {accusationCount > 0 && (
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {Array.from({ length: accusationCount }).map((_, i) => (
                        <span
                          key={`${p.id}-accuse-${i}`}
                          style={{ position: "relative", display: "inline-flex" }}
                          onPointerEnter={() => showTooltip(p.id)}
                          onPointerLeave={hideTooltip}
                          onPointerDown={() => flashTooltip(p.id)}
                          onBlur={hideTooltip}
                          tabIndex={0}
                        >
                          <Image
                            src="/chamchar.png"
                            alt="Accusation Caméléon"
                            title={accusers[i] ? `Accusation par ${accusers[i]}` : "Accusation Caméléon"}
                            width={28}
                            height={28}
                            style={{ borderRadius: 6, objectFit: "cover" }}
                          />
                          {visibleTooltipPlayerId === p.id && (
                            <span style={accusationTooltipStyle}>
                              {accusers[i] ? `Accusation par ${accusers[i]}` : "Accusation Caméléon"}
                            </span>
                          )}
                        </span>
                      ))}
                    </span>
                  )}
                  <span>{count} vote(s)</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {computedTieIds.length > 0 && isHost && (
        <div style={{ display: "grid", gap: 8 }}>
          <button
            className="btn"
            onClick={async () => {
              await fetch("/api/phase/vote", {
                method: "POST",
                body: JSON.stringify({ roomCode: params.roomCode }),
              });
              setPhase("VOTE");
            }}
          >
            Relancer un vote
          </button>
          <button
            className="btn"
            onClick={async () => {
              const resp = await fetch("/api/game/next", {
                method: "POST",
                body: JSON.stringify({ roomCode: params.roomCode }),
              });
              if (resp.ok) {
                const data = await resp.json();
                const t = data?.timerSeconds ?? 60;
                setPhase("DRAW");
                router.replace(`/room/${params.roomCode}/draw?nickname=${encodeURIComponent(nickname)}&timer=${t}`);
              }
            }}
          >
            Prochain tour
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {/* Bouton lobby uniquement si la partie est terminée et pas d'égalité */}
        {!hasTie && gameEnded && (
          <button className="btn" onClick={goToLobbyAndMaybeReset}>
            Retour au lobby
          </button>
        )}

        {!hasTie &&
          !gameEnded &&
          (dictatorSurvived
            ? isHost
              ? (
                <button
                  className="btn"
                  onClick={async () => {
                    const resp = await fetch("/api/game/next", {
                      method: "POST",
                      body: JSON.stringify({ roomCode: params.roomCode }),
                    });
                    if (resp.ok) {
                      const data = await resp.json();
                      const t = data?.timerSeconds ?? 60;
                      setPhase("DRAW");
                      router.replace(
                        `/room/${params.roomCode}/draw?nickname=${encodeURIComponent(nickname)}&timer=${t}`,
                      );
                    }
                  }}
                >
                  Prochain tour
                </button>
                )
              : (
                <p style={{ margin: 0 }}>En attente de l&apos;hôte pour passer au prochain tour…</p>
              )
            : hostCanStartNewRound
              ? (
                isHost ? (
                  <button
                    className="btn"
                    onClick={async () => {
                      const resp = await fetch("/api/game/next", {
                        method: "POST",
                        body: JSON.stringify({ roomCode: params.roomCode }),
                      });
                      if (resp.ok) {
                        const data = await resp.json();
                        const t = data?.timerSeconds ?? 60;
                        setPhase("DRAW");
                        router.replace(
                          `/room/${params.roomCode}/draw?nickname=${encodeURIComponent(nickname)}&timer=${t}`,
                        );
                      }
                    }}
                  >
                    Prochain tour
                  </button>
                ) : (
                  <p style={{ margin: 0 }}>En attente de l&apos;hôte pour passer au prochain tour…</p>
                )
              )
              : null)}
      </div>
    </div>
  );
}
