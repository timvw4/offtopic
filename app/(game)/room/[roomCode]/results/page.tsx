"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { Player } from "@/lib/types";

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
  const resolvedRef = useRef(false);

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

  // Attente de la phase RESULTS, ou WORD/DRAW si nouveau tour
  useEffect(() => {
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
  }, [phase, nickname, params.roomCode, router]);

  const eliminated = players.find((p) => p.id === result?.eliminated_player_id);
  const me = players.find((p) => p.nickname === nickname);
  const isHost = me?.isHost;

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

  // Fallback tie detection côté client (au cas où tie_player_ids n'est pas encore propagé).
  const computedTieIds = useMemo(() => {
    if (tieIds.length > 0) return tieIds;
    if (maxVotes === 0) return [];
    const leaders = Object.entries(voteCounts)
      .filter(([, c]) => c === maxVotes)
      .map(([id]) => id);
    return leaders.length > 1 ? leaders : [];
  }, [maxVotes, tieIds, voteCounts]);

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

  const outcome = useMemo(() => {
    if (result?.is_chameleon === true) {
      return "Caméléon gagne (éliminé sans accusation correcte)";
    }
    if (result?.is_chameleon === false && eliminated?.role === "CAMELEON") {
      return "Caméléon perd (accusation correcte)";
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
        <div className="card result-pop" style={{ display: "grid", gap: 8 }}>
          <strong>Égalité détectée</strong>
          <p>Revote uniquement entre :</p>
          <ul style={{ paddingLeft: 16, margin: 0 }}>
            {players
              .filter((p) => computedTieIds.includes(p.id))
              .map((p) => (
                <li key={p.id}>{p.nickname}</li>
              ))}
          </ul>
          {isHost ? (
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
          ) : (
            <p>En attente de l&apos;hôte pour relancer le vote…</p>
          )}
        </div>
      )}
      {dictatorSurvived ? (
        <div className="card result-pop" style={{ display: "grid", gap: 6 }}>
          <strong>Le Dictateur a survécu</strong>
          <p style={{ margin: 0 }}>Immunité utilisée. Son prochain vote comptera double.</p>
          <p style={{ margin: 0 }}>Aucun joueur n&apos;est éliminé ce tour.</p>
        </div>
      ) : eliminated ? (
        <div className="card result-pop" style={{ display: "grid", gap: 6 }}>
          <strong>{eliminated.nickname}</strong> est éliminé.
          <p>Rôle révélé : {eliminated.role}</p>
          {result?.is_chameleon === true && <p>Le Caméléon a été éliminé → victoire Caméléon.</p>}
          {result?.is_chameleon === false && eliminated?.role === "CAMELEON" && (
            <p>Caméléon identifié, il perd.</p>
          )}
          {outcome && <p>{outcome}</p>}
        </div>
      ) : (
        <p>Aucun joueur éliminé.</p>
      )}

      <div className="card">
        <h4>Votes</h4>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
          {players
            .filter((p) => !p.isEliminated || p.id === result?.eliminated_player_id)
            .map((p) => {
            const count = voteCounts[p.id] || 0;
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
                <span>{count} vote(s)</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {/* Bouton Retour au lobby toujours visible pour tous */}
        <button className="btn" onClick={goToLobbyAndMaybeReset}>
          Retour au lobby
        </button>

        {dictatorSurvived ? (
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
          ) : null
        ) : hostCanStartNewRound ? (
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
          ) : null
        ) : null}
      </div>
    </div>
  );
}
