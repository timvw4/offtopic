"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [isCameleonSelf, setIsCameleonSelf] = useState(false);
  const [choiceLocked, setChoiceLocked] = useState<ChoiceLock>(CHOICE_LOCK.NONE);
  const [accusations, setAccusations] = useState<AccuseRow[]>([]);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    const room = params.roomCode;
    let channel: ReturnType<typeof supabaseClient.channel> | null = null;
    let pollPhase: NodeJS.Timeout | null = null;
    let pollVotes: NodeJS.Timeout | null = null;
    let pollAccusations: NodeJS.Timeout | null = null;

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
        setIsCameleonSelf(me?.role === "CAMELEON");
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

    channel = supabaseClient
      .channel(`vote:${room}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `code=eq.${room}` },
        ({ new: n }) => setPhase(n?.current_phase ?? null),
      )
      .subscribe();

    pollVotes = setInterval(() => {
      if (!roundId) return;
      supabaseClient
        .from("votes")
        .select("voter_nickname, target_player_id, round_id")
        .eq("round_id", roundId)
        .then(({ data }) => setVotes((data as VoteRow[]) || []));
    }, 500);

    pollAccusations = setInterval(() => {
      supabaseClient
        .from("chameleon_accusations")
        .select("accuser_nickname, target_player_id")
        .eq("room_code", room)
        .then(({ data }) => setAccusations(((data as any[]) || []) as AccuseRow[]));
    }, 500);

    pollPhase = setInterval(() => {
      supabaseClient
        .from("rooms")
        .select("current_phase")
        .eq("code", room)
        .single()
        .then(({ data }) => setPhase(data?.current_phase ?? null));
    }, 500);

    return () => {
      channel?.unsubscribe();
      if (pollPhase) clearInterval(pollPhase);
      if (pollVotes) clearInterval(pollVotes);
      if (pollAccusations) clearInterval(pollAccusations);
    };
  }, [nickname, params.roomCode, roundId]);

  // Joueurs affichés dans le panneau de vote (cibles) : uniquement les éligibles au vote actuel
  const eligiblePlayers = tieIds.length > 0 ? players.filter((p) => tieIds.includes(p.id)) : players;
  const voteTargets = eligiblePlayers.filter((p) => p.id !== selfId && !p.isEliminated);
  // Joueurs affichés dans le statut : tous les votants (vivants), pour suivre qui a voté même en revote
  const voteStatusPlayers = players.filter((p) => !p.isEliminated);
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
    if (isEliminated) {
      router.replace(`/room/${params.roomCode}/results?nickname=${encodeURIComponent(nickname)}`);
      return;
    }
    if (phase === "RESULTS") {
      router.replace(`/room/${params.roomCode}/results?nickname=${encodeURIComponent(nickname)}`);
    }
  }, [phase, isEliminated, nickname, params.roomCode, router]);

  // Dès que tous les vivants ont voté ou accusé, on déclenche la résolution (leader alphabétique pour éviter les doublons).
  useEffect(() => {
    if (resolving) return;
    if (phase !== "VOTE") return;
    const alive = players.filter((p) => !p.isEliminated);
    if (alive.length === 0) return;
    const allActed = alive.every((p) => {
      const voted = votes.some((v) => v.voter_nickname === p.nickname && (!roundId || v.round_id === roundId));
      const accused = accusations.some((a) => a.accuser_nickname === p.nickname);
      return voted || accused || (p.nickname === nickname && isAccuseLocked);
    });
    if (!allActed) return;
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
            return (
              <li
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <span style={{ fontWeight: 600 }}>{p.nickname}</span>
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
      {!isEliminated &&
        (isAccuseLocked ? (
          <p style={{ margin: 0 }}>Accusation envoyée. En attente des autres joueurs...</p>
        ) : hasVotedOrSubmitted ? (
          <p style={{ margin: 0 }}>En attente des votes des autres joueurs...</p>
        ) : (
          <VotePanel
            players={voteTargets}
            accusationAvailable={accusationEnabled}
            showAccusation={canShowAccusation}
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
        ))}
    </div>
  );
}
