"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { WordCard } from "@/components/WordCard";
import { Player } from "@/lib/types";

function mapPlayer(row: any): Player {
  return {
    id: row.id,
    nickname: row.nickname,
    role: row.role,
    hasUsedChameleonAccusation: row.has_used_chameleon_accusation ?? false,
    isEliminated: row.is_eliminated ?? false,
    isHost: row.is_host ?? false,
    isReady: row.is_ready ?? false,
    dictatorImmunityUsed: row.dictator_immunity_used ?? false,
    dictatorDoubleVoteActive: row.dictator_double_vote_active ?? false,
  };
}

export default function WordRevealPage() {
  const router = useRouter();
  const params = useParams<{ roomCode: string }>();
  const search = useSearchParams();
  const nickname = search.get("nickname") || "Guest";

  const [wordCivil, setWordCivil] = useState("");
  const [wordHorsTheme, setWordHorsTheme] = useState("");
  const [role, setRole] = useState("CIVIL");
  const [players, setPlayers] = useState<Player[]>([]);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [drawStartsAt, setDrawStartsAt] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [pendingReady, setPendingReady] = useState(false);
  const [isEliminated, setIsEliminated] = useState(false);

  // Charge données et subscriptions
  useEffect(() => {
    const room = params.roomCode;
    if (!room) return;
    let channel: ReturnType<typeof supabaseClient.channel> | null = null;
    let pollId: NodeJS.Timeout | null = null;
    let pollRound: NodeJS.Timeout | null = null;

    async function init() {
      const { data: round } = await supabaseClient
        .from("rounds")
        .select("id, word_civil, word_hors_theme, draw_starts_at, timer_seconds")
        .eq("room_code", room)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (round) {
        setWordCivil(round.word_civil);
        setWordHorsTheme(round.word_hors_theme);
        setRoundId(round.id);
        setDrawStartsAt(round.draw_starts_at);
        setTimerSeconds(round.timer_seconds ?? 60);
      }

      const { data: myRole } = await supabaseClient
        .from("players")
        .select("role, is_eliminated")
        .eq("room_code", room)
        .eq("nickname", nickname)
        .single();
      setRole(myRole?.role || "CIVIL");
      setIsEliminated(!!myRole?.is_eliminated);

      // Reset ready pour ce tour (pour soi)
      await supabaseClient.from("players").update({ is_ready: false }).eq("room_code", room).eq("nickname", nickname);

      const { data: pData } = await supabaseClient.from("players").select("*").eq("room_code", room);
      setPlayers((pData || []).map(mapPlayer));

      channel = supabaseClient
        .channel(`word:${room}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "players", filter: `room_code=eq.${room}` },
          () => {
            supabaseClient
              .from("players")
              .select("*")
              .eq("room_code", room)
              .then(({ data }) => setPlayers((data || []).map(mapPlayer)));
          },
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "rounds", filter: `room_code=eq.${room}` },
          ({ new: n }) => {
            setDrawStartsAt(n?.draw_starts_at ?? null);
            setTimerSeconds(n?.timer_seconds ?? 60);
          },
        )
        .subscribe();

      // Polling de secours toutes les 0.5s pour refléter les statuts Prêt si le realtime ne passe pas
      pollId = setInterval(() => {
        supabaseClient
          .from("players")
          .select("*")
          .eq("room_code", room)
          .then(({ data }) => setPlayers((data || []).map(mapPlayer)));
      }, 500);

      // Polling de secours (rapide) pour récupérer draw_starts_at si l'event rounds ne passe pas
      pollRound = setInterval(() => {
        supabaseClient
          .from("rounds")
          .select("draw_starts_at, timer_seconds")
          .eq("room_code", room)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()
          .then(({ data }) => {
            if (data) {
              setDrawStartsAt(data.draw_starts_at ?? null);
              setTimerSeconds(data.timer_seconds ?? 60);
            }
          });
      }, 500);
    }

    void init();
    return () => {
      channel?.unsubscribe();
      if (pollId) clearInterval(pollId);
      if (pollRound) clearInterval(pollRound);
    };
  }, [nickname, params.roomCode]);

  // Tous prêts ? On ne compte que les joueurs non éliminés.
  const allReady = useMemo(() => {
    const alive = players.filter((p) => !p.isEliminated);
    return alive.length > 0 && alive.every((p) => p.isReady);
  }, [players]);

  const me = players.find((p) => p.nickname === nickname);

  // Quand tous prêts et pas encore de départ, un seul joueur (hôte) déclenche le départ (draw_starts_at)
  useEffect(() => {
    if (isEliminated) return; // spectateur
    const room = params.roomCode;
    if (!room || !roundId) return;
    if (!allReady || drawStartsAt) return;
    if (!me?.isHost) return;

    const start = new Date(Date.now() + 3000).toISOString(); // 3s de pré-compte
    supabaseClient
      .from("rounds")
      .update({ draw_starts_at: start, phase: "DRAW" })
      .eq("id", roundId)
      .then();
  }, [allReady, drawStartsAt, isEliminated, me?.isHost, params.roomCode, roundId]);

  // Dès qu'un départ est fixé, tout le monde va sur la page dessin (le compte à rebours s'y affichera)
  useEffect(() => {
    if (isEliminated) {
      router.replace(`/room/${params.roomCode}/reveal?nickname=${encodeURIComponent(nickname)}`);
      return;
    }
    if (drawStartsAt) {
      router.replace(
        `/room/${params.roomCode}/draw?nickname=${encodeURIComponent(nickname)}&timer=${timerSeconds}`,
      );
    }
  }, [drawStartsAt, isEliminated, nickname, params.roomCode, router, timerSeconds]);

  const displayedWord = role === "HORS_THEME" ? wordHorsTheme : wordCivil;
  const roleLabel =
    role === "HORS_THEME"
      ? "Hors-Thème"
      : role === "CAMELEON"
        ? "Caméléon"
        : role === "DICTATOR"
          ? "Dictateur"
          : "Civil";
  const roleDescription =
    role === "HORS_THEME"
      ? "Tu as un mot légèrement différent des civils. Ne te fais pas démasqué par les autres joueurs pour gagner."
      : role === "CAMELEON"
        ? "Tu as le même mot que les civils et tu dois te faire passer pour un hors-thème et te faire éliminé pour gagner. attention tu ne dois pas te faire repérer par les autres joueurs."
        : role === "DICTATOR"
          ? "Tu joue comme un civil mais si une majorité vote contre toi la première fois, tu survis et ton prochain vote comptera double. La seconde fois, tu es éliminé."
          : "Tu es un civil : dessine le mot subtilement pour débusquer les Hors-Thème.";

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>Mot secret</h2>
      <WordCard word={displayedWord} roleLabel={`Tu es ${roleLabel}`} />
      <div className="card" style={{ display: "grid", gap: 6 }}>
        <strong>Ton rôle : {roleLabel}</strong>
        <p style={{ margin: 0 }}>{roleDescription}</p>
      </div>

      <div className="card" style={{ display: "grid", gap: 8, padding: 12 }}>
        <strong style={{ fontSize: 14, letterSpacing: 0.2, textAlign: "center" }}>Prêts</strong>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 4 }}>
          {players
            .filter((p) => !p.isEliminated) // les éliminés ne sont plus dans la liste des prêts
            .map((p) => (
            <li
              key={p.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 10px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span style={{ fontWeight: 600 }}>{p.nickname}</span>
              <span style={{ fontSize: 13 }}>{p.isReady ? "✏️" : "..."}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        className="btn btn-compact"
        disabled={me?.isReady || pendingReady}
        style={{ opacity: me?.isReady || pendingReady ? 0.5 : 1 }}
        onClick={async () => {
          setPendingReady(true);
          // Optimiste : on marque prêt localement pour désactiver le bouton tout de suite
          setPlayers((prev) => prev.map((p) => (p.nickname === nickname ? { ...p, isReady: true } : p)));
          await supabaseClient
            .from("players")
            .update({ is_ready: true })
            .eq("room_code", params.roomCode)
            .eq("nickname", nickname);
          // Rafraîchit la liste au cas où l'événement Realtime tarderait
          const { data } = await supabaseClient.from("players").select("*").eq("room_code", params.roomCode);
          setPlayers((data || []).map(mapPlayer));
        }}
      >
        Prêt
      </button>
      {drawStartsAt && <p>Départ imminent…</p>}
    </div>
  );
}
