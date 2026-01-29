"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { Player } from "@/lib/types";
import { VotePanel } from "@/components/VotePanel";

type VoteRow = { voter_nickname: string; target_player_id: string; round_id: string };

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
  const [choiceLocked, setChoiceLocked] = useState<"vote" | "accuse" | null>(null);

  useEffect(() => {
    const room = params.roomCode;
    let channel: ReturnType<typeof supabaseClient.channel> | null = null;
    let pollPhase: NodeJS.Timeout | null = null;
    let pollVotes: NodeJS.Timeout | null = null;

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
    };
  }, [nickname, params.roomCode, roundId]);

  const eligiblePlayers =
    tieIds.length > 0 ? players.filter((p) => tieIds.includes(p.id)) : players;
  const voteTargets = eligiblePlayers.filter((p) => p.id !== selfId && !p.isEliminated);
  const hasVoted = useMemo(
    () => votes.some((v) => v.voter_nickname === nickname && (!roundId || v.round_id === roundId)),
    [nickname, roundId, votes],
  );

  useEffect(() => {
    if (isEliminated) {
      router.replace(`/room/${params.roomCode}/results?nickname=${encodeURIComponent(nickname)}`);
      return;
    }
    if (phase === "RESULTS") {
      router.replace(`/room/${params.roomCode}/results?nickname=${encodeURIComponent(nickname)}`);
    }
  }, [phase, isEliminated, nickname, params.roomCode, router]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2>Vote</h2>
      {tieIds.length > 0 && <p>Égalité précédente : revote uniquement entre les ex æquo.</p>}
      <div className="card">
        <h4>Statut des votes</h4>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 4 }}>
          {eligiblePlayers.map((p) => {
            const voted = votes.some((v) => v.voter_nickname === p.nickname && (!roundId || v.round_id === roundId));
            return (
              <li key={p.id} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{p.nickname}</span>
                <span>{voted ? "✅" : "⏳"}</span>
              </li>
            );
          })}
        </ul>
        {voteSubmitted && <p style={{ margin: 0 }}>Vote enregistré. En attente des autres joueurs…</p>}
      </div>
      {!isEliminated && (
      <VotePanel
        players={voteTargets}
        accusationAvailable={hasCameleon && accusationAvailable}
        showAccusation={hasCameleon}
        disableAccusation={isCameleonSelf || choiceLocked === "vote"}
        disableVote={choiceLocked === "accuse"}
        onVote={async (playerId) => {
          setChoiceLocked("vote");
          await fetch("/api/vote", {
            method: "POST",
            body: JSON.stringify({ roomCode: params.roomCode, nickname, targetId: playerId }),
          });
          setVoteSubmitted(true);
        }}
        onAccuseChameleon={async (playerId) => {
          setChoiceLocked("accuse");
          await fetch("/api/accuse", {
            method: "POST",
            body: JSON.stringify({ roomCode: params.roomCode, nickname, targetId: playerId }),
          });
          setAccusationAvailable(false);
        }}
      />
      )}
    </div>
  );
}
