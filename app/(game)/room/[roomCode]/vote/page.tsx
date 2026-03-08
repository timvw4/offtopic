"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { Player } from "@/lib/types";
import { VotePanel } from "@/components/VotePanel";

type VoteRow = { voter_nickname: string; target_player_id: string; round_id: string };
type AccuseRow = { accuser_nickname: string; target_player_id: string };

// Centralise les valeurs possibles pour éviter tout écart de type
const CHOICE_LOCK = {
  VOTE: "vote",
  ACCUSE: "accuse",
  NONE: "none",
} as const;
type ChoiceLock = (typeof CHOICE_LOCK)[keyof typeof CHOICE_LOCK];

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

export default function VotePage() {
  const params = useParams<{ roomCode: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const nickname = search.get("nickname") || "Guest";
  const [players, setPlayers] = useState<Player[]>([]);
  const [accusationAvailable, setAccusationAvailable] = useState(true);
  const [tieIds, setTieIds] = useState<string[]>([]);
  const [hasCameleon, setHasCameleon] = useState(false);
  const [phase, setPhase] = useState<string | null>(null);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [isEliminated, setIsEliminated] = useState(false);
  const [selfRole, setSelfRole] = useState<string | null>(null);
  const [isCameleonSelf, setIsCameleonSelf] = useState(false);
  const [choiceLocked, setChoiceLocked] = useState<ChoiceLock>(CHOICE_LOCK.NONE);
  const [accusations, setAccusations] = useState<AccuseRow[]>([]);
  const [resolving, setResolving] = useState(false);

  // Ref pour accéder à roundId depuis les callbacks Realtime sans recréer l'abonnement
  const roundIdRef = useRef<string | null>(null);
  useEffect(() => {
    roundIdRef.current = roundId;
  }, [roundId]);

  useEffect(() => {
    const room = params.roomCode;
    let channel: ReturnType<typeof supabaseClient.channel> | null = null;
    // Polling de SECOURS uniquement pour la phase (au cas où Realtime ne passe pas)
    let pollPhase: NodeJS.Timeout | null = null;

    supabaseClient
      .from("players")
      .select("*")
      .eq("room_code", room)
      .then(({ data }) => {
        const mapped = (data || []).map(mapPlayerRow);
        setPlayers(mapped);
        const me = mapped.find((p) => p.nickname === nickname);
        setSelfId(me?.id ?? null);
        setIsEliminated(!!me?.isEliminated);
        const myRole = me?.role ?? null;
        setSelfRole(myRole);
        setIsCameleonSelf(myRole === "CAMELEON");
      });

    supabaseClient
      .from("rounds")
      .select("tie_player_ids")
      .eq("room_code", room)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => setTieIds((data?.tie_player_ids as string[]) || []));

    supabaseClient
      .from("rounds")
      .select("id")
      .eq("room_code", room)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => setRoundId(data?.id ?? null));

    supabaseClient
      .from("rooms")
      .select("has_cameleon")
      .eq("code", room)
      .maybeSingle()
      .then(({ data }) => setHasCameleon(!!data?.has_cameleon));

    supabaseClient
      .from("chameleon_accusations")
      .select("accuser_nickname, target_player_id")
      .eq("room_code", room)
      .then(({ data }) => setAccusations(((data as any[]) || []) as AccuseRow[]));

    supabaseClient
      .from("players")
      .select("has_used_chameleon_accusation")
      .eq("room_code", room)
      .eq("nickname", nickname)
      .single()
      .then(({ data }) => setAccusationAvailable(!data?.has_used_chameleon_accusation));

    supabaseClient
      .from("rooms")
      .select("current_phase")
      .eq("code", room)
      .maybeSingle()
      .then(({ data }) => setPhase(data?.current_phase ?? null));

    // Fonction partagée : utilisée par le poll ET relancée manuellement si Realtime tombe
    const fetchPhase = () => {
      supabaseClient
        .from("rooms")
        .select("current_phase")
        .eq("code", room)
        .single()
        .then(({ data }) => setPhase(data?.current_phase ?? null));
    };

    // ─── Abonnements Realtime ────────────────────────────────────────────────
    // Couvrent votes, accusations et changement de phase via WebSocket.
    // Le poll de secours (ci-dessous) est automatiquement stoppé dès que
    // Realtime confirme sa connexion (status === "SUBSCRIBED").
    channel = supabaseClient
      .channel(`vote:${room}`)
      // 1. Changement de phase (ex: passage VOTE → RESULTS)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `code=eq.${room}` },
        ({ new: n }) => setPhase(n?.current_phase ?? null),
      )
      // 2. Nouveaux votes en temps réel (remplace pollVotes)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes", filter: `room_code=eq.${room}` },
        () => {
          const rid = roundIdRef.current;
          if (!rid) return;
      supabaseClient
        .from("votes")
        .select("voter_nickname, target_player_id, round_id")
            .eq("round_id", rid)
        .then(({ data }) => setVotes((data as VoteRow[]) || []));
        },
      )
      // 3. Accusations Caméléon en temps réel (remplace pollAccusations)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chameleon_accusations", filter: `room_code=eq.${room}` },
        () => {
      supabaseClient
        .from("chameleon_accusations")
        .select("accuser_nickname, target_player_id")
        .eq("room_code", room)
        .then(({ data }) => setAccusations(((data as any[]) || []) as AccuseRow[]));
        },
      )
      // Pilote le poll de secours selon l'état de la connexion Realtime
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // ✅ Realtime opérationnel → stoppe le poll (il deviendrait une requête inutile)
          if (pollPhase) { clearInterval(pollPhase); pollPhase = null; }
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          // ❌ Realtime perdu → réactive le poll de secours s'il n'est pas déjà actif
          if (!pollPhase) { pollPhase = setInterval(fetchPhase, 2000); }
        }
      });

    // Poll de secours : démarre immédiatement pour couvrir la fenêtre
    // de connexion Realtime (quelques ms à ~1s). Sera stoppé dès SUBSCRIBED.
    pollPhase = setInterval(fetchPhase, 2000);

    return () => {
      channel?.unsubscribe();
      if (pollPhase) clearInterval(pollPhase);
    };
  }, [nickname, params.roomCode]);

  // Chargement initial des votes dès que roundId est connu (une seule requête, pas de poll)
  useEffect(() => {
    if (!roundId) return;
    supabaseClient
      .from("votes")
      .select("voter_nickname, target_player_id, round_id")
      .eq("round_id", roundId)
      .then(({ data }) => setVotes((data as VoteRow[]) || []));
  }, [roundId]);

  // Joueurs affichés dans le panneau de vote (cibles) : uniquement les éligibles au vote actuel
  const eligiblePlayers = tieIds.length > 0 ? players.filter((p) => tieIds.includes(p.id)) : players;
  const voteTargets = eligiblePlayers.filter((p) => p.id !== selfId && !p.isEliminated);
  // Un joueur est "Fantôme" s'il a le rôle FANTOME ou FANTOME_HT
  const isFantomeRole = (role: string | null) => role === "FANTOME" || role === "FANTOME_HT";
  const isFantomeSelf = isFantomeRole(selfRole);
  const voteStatusPlayers = players.filter((p) => !p.isEliminated || isFantomeRole(p.role));
  const canShowAccusation = hasCameleon && !isCameleonSelf;
  const accusationEnabled = canShowAccusation && accusationAvailable;
  const hasVoted = useMemo(
    () => votes.some((v) => v.voter_nickname === nickname && (!roundId || v.round_id === roundId)),
    [nickname, roundId, votes],
  );
  const hasVotedOrSubmitted = hasVoted || voteSubmitted;
  const isAccuseLocked = choiceLocked === CHOICE_LOCK.ACCUSE;
  const isVoteLocked = choiceLocked === CHOICE_LOCK.VOTE;
  const resolutionLeader = useMemo(() => {
    const alive = players.filter((p) => !p.isEliminated);
    return alive.length > 0 ? [...alive].sort((a, b) => a.nickname.localeCompare(b.nickname))[0].nickname : null;
  }, [players]);

  // Si on recharge après avoir déjà voté, on cache aussi le panneau et on affiche le message.
  useEffect(() => {
    if (hasVoted && !voteSubmitted) {
      setVoteSubmitted(true);
    }
  }, [hasVoted, voteSubmitted]);

  useEffect(() => {
    // Le Fantôme éliminé (FANTOME ou FANTOME_HT) reste sur la page de vote pour continuer à voter.
    if (isEliminated && !isFantomeRole(selfRole)) {
      router.replace(`/room/${params.roomCode}/results?nickname=${encodeURIComponent(nickname)}`);
      return;
    }
    if (phase === "RESULTS") {
      router.replace(`/room/${params.roomCode}/results?nickname=${encodeURIComponent(nickname)}`);
    }
  }, [phase, isEliminated, selfRole, nickname, params.roomCode, router]);

  // Dès que tous les votants (vivants + Fantômes éliminés) ont voté ou accusé,
  // on déclenche la résolution (leader alphabétique parmi les vivants pour éviter les doublons).
  useEffect(() => {
    if (resolving) return;
    if (phase !== "VOTE") return;
    const alive = players.filter((p) => !p.isEliminated);
    if (alive.length === 0) return;
    // Pool de votants attendus : vivants + Fantômes éliminés (FANTOME ou FANTOME_HT)
    const voterPool = players.filter((p) => !p.isEliminated || isFantomeRole(p.role));
    const allActed = voterPool.every((p) => {
      const voted = votes.some((v) => v.voter_nickname === p.nickname && (!roundId || v.round_id === roundId));
      const accused = accusations.some((a) => a.accuser_nickname === p.nickname);
      return voted || accused || (p.nickname === nickname && isAccuseLocked);
    });
    if (!allActed) return;
    // Seul un joueur vivant (non éliminé) peut être leader pour déclencher la résolution
    const isLeader = resolutionLeader === nickname;
    if (!isLeader) return;
    setResolving(true);
    fetch("/api/resolve", {
      method: "POST",
      body: JSON.stringify({ roomCode: params.roomCode }),
    })
      .then(() => setPhase("RESULTS"))
      .catch(() => setResolving(false));
  }, [accusations, choiceLocked, nickname, params.roomCode, phase, players, resolving, roundId, votes]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>Vote</h2>
      {tieIds.length > 0 && <p>Égalité précédente : revote uniquement entre les ex æquo.</p>}
      <div className="card" style={{ display: "grid", gap: 10 }}>
        <h4>Statut des votes</h4>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
          {voteStatusPlayers.map((p) => {
            const votedFromDb = votes.some((v) => v.voter_nickname === p.nickname && (!roundId || v.round_id === roundId));
            const accused = accusations.some((a) => a.accuser_nickname === p.nickname);
            const voted = p.nickname === nickname && choiceLocked === "accuse" ? true : votedFromDb || accused;
            const isGhost = isFantomeRole(p.role) && p.isEliminated;
            return (
              <li
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: isGhost ? "rgba(147,112,219,0.08)" : "rgba(255,255,255,0.04)",
                  border: isGhost ? "1px solid rgba(147,112,219,0.25)" : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  {isGhost && <span title="Fantôme éliminé" style={{ fontSize: 14 }}>👻</span>}
                  {p.nickname}
                  {isGhost && (
                    <span style={{ fontSize: 11, color: "rgba(147,112,219,0.9)", fontWeight: 400 }}>
                      (fantôme)
                    </span>
                  )}
                </span>
                <span>
                  {voted ? (
                    <span
                      aria-label="Vote reçu"
                      title="Vote reçu"
                      style={{ color: "#22c55e", fontWeight: 700, fontSize: 16, lineHeight: 1 }}
                    >
                      ✓
                    </span>
                  ) : (
                    "..."
                  )}
                </span>
              </li>
            );
          })}
        </ul>
        {voteSubmitted && <p style={{ margin: 0 }}>Vote enregistré.</p>}
      </div>
      {/* Le Fantôme éliminé peut voter mais ne peut pas accuser */}
      {(!isEliminated || isFantomeSelf) &&
        (isAccuseLocked ? (
          <p style={{ margin: 0 }}>Accusation envoyée. En attente des autres joueurs...</p>
        ) : hasVotedOrSubmitted ? (
          <p style={{ margin: 0 }}>En attente des votes des autres joueurs...</p>
        ) : (
          <>
            {isFantomeSelf && isEliminated && (
              <p style={{ margin: 0, fontSize: 13, color: "rgba(147,112,219,0.9)", display: "flex", alignItems: "center", gap: 6 }}>
                👻 Tu es éliminé mais tu peux encore voter depuis l&apos;au-delà !
              </p>
            )}
          <VotePanel
            players={voteTargets}
              accusationAvailable={!isFantomeSelf && accusationEnabled}
              showAccusation={!isFantomeSelf && canShowAccusation}
            disableAccusation={isVoteLocked}
            disableVote={isAccuseLocked || voteSubmitted}
            hideVoteButton={voteSubmitted}
            onVote={async (playerId) => {
              setChoiceLocked(CHOICE_LOCK.VOTE);
              await fetch("/api/vote", {
                method: "POST",
                body: JSON.stringify({ roomCode: params.roomCode, nickname, targetId: playerId }),
              });
              setVoteSubmitted(true);
            }}
            onAccuseChameleon={async (playerId) => {
              setChoiceLocked(CHOICE_LOCK.ACCUSE);
              await fetch("/api/accuse", {
                method: "POST",
                body: JSON.stringify({ roomCode: params.roomCode, nickname, targetId: playerId }),
              });
              setAccusationAvailable(false);
              setVoteSubmitted(true);
              setAccusations((prev) => [...prev, { accuser_nickname: nickname, target_player_id: playerId }]);
            }}
          />
          </>
        ))}
    </div>
  );
}
