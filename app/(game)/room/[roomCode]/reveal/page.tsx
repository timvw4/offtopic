"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

interface DrawingRow {
  id: string;
  nickname: string;
  data_url: string;
}

export default function RevealPage() {
  const params = useParams<{ roomCode: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const nickname = search.get("nickname") || "Guest";
  const [drawings, setDrawings] = useState<DrawingRow[]>([]);
  const [host, setHost] = useState<string | null>(null);
  const [phase, setPhase] = useState<string | null>(null);
  const [expectedDrawings, setExpectedDrawings] = useState<number | null>(null);
  const [isEliminated, setIsEliminated] = useState(false);
  const [drawStartsAt, setDrawStartsAt] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [revealReady, setRevealReady] = useState(false);
  const [isDuelMode, setIsDuelMode] = useState(false);

  useEffect(() => {
    const room = params.roomCode;
    let channel: ReturnType<typeof supabaseClient.channel> | null = null;
    let pollId: NodeJS.Timeout | null = null;
    let pollDrawings: NodeJS.Timeout | null = null;
    let pollRound: NodeJS.Timeout | null = null;

    supabaseClient
      .from("drawings")
      .select("id, nickname, data_url")
      .order("nickname", { ascending: true })
      .order("id", { ascending: true })
      .eq("room_code", room)
      .then(({ data }) => setDrawings((data as DrawingRow[]) || []));

    // Nombre de joueurs attendus (non éliminés)
    supabaseClient
      .from("players")
      .select("*", { count: "exact", head: true })
      .eq("room_code", room)
      .eq("is_eliminated", false)
      .then(({ count }) => setExpectedDrawings(count ?? null));

    supabaseClient
      .from("rounds")
      .select("draw_starts_at, timer_seconds")
      .eq("room_code", room)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        setDrawStartsAt(data?.draw_starts_at ?? null);
        setTimerSeconds(data?.timer_seconds ?? null);
      });

    supabaseClient
      .from("players")
      .select("is_eliminated")
      .eq("room_code", room)
      .eq("nickname", nickname)
      .maybeSingle()
      .then(({ data }) => setIsEliminated(!!data?.is_eliminated));

    supabaseClient
      .from("rooms")
      .select("host_nickname, current_phase, is_duel_mode")
      .eq("code", room)
      .maybeSingle()
      .then(({ data }) => {
        setHost(data?.host_nickname || null);
        setPhase(data?.current_phase || null);
        setIsDuelMode(!!data?.is_duel_mode);
      });

    channel = supabaseClient
      .channel(`reveal:${room}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `code=eq.${room}` },
        ({ new: n }) => setPhase(n?.current_phase || null),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "drawings", filter: `room_code=eq.${room}` },
        () => {
          supabaseClient
            .from("drawings")
            .select("id, nickname, data_url")
            .order("nickname", { ascending: true })
            .order("id", { ascending: true })
            .eq("room_code", room)
            .then(({ data }) => setDrawings((data as DrawingRow[]) || []));
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rounds", filter: `room_code=eq.${room}` },
        ({ new: n }) => {
          setDrawStartsAt(n?.draw_starts_at ?? null);
          setTimerSeconds(n?.timer_seconds ?? null);
        },
      )
      .subscribe();

    // Polling de secours pour phase si Realtime ne passe pas
    pollId = setInterval(() => {
      supabaseClient
        .from("rooms")
        .select("current_phase")
        .eq("code", room)
        .single()
        .then(({ data }) => setPhase((data?.current_phase as string) || null));
    }, 500);

    // Polling de secours pour les dessins si Realtime ne passe pas
    pollDrawings = setInterval(() => {
      supabaseClient
        .from("drawings")
        .select("id, nickname, data_url")
        .order("nickname", { ascending: true })
        .order("id", { ascending: true })
        .eq("room_code", room)
        .then(({ data }) => setDrawings((data as DrawingRow[]) || []));
    }, 2000);

    pollRound = setInterval(() => {
      supabaseClient
        .from("rounds")
        .select("draw_starts_at, timer_seconds")
        .eq("room_code", room)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
        .then(({ data }) => {
          setDrawStartsAt(data?.draw_starts_at ?? null);
          setTimerSeconds(data?.timer_seconds ?? null);
        });
    }, 1500);

    return () => {
      channel?.unsubscribe();
      if (pollId) clearInterval(pollId);
      if (pollDrawings) clearInterval(pollDrawings);
      if (pollRound) clearInterval(pollRound);
    };
  }, [nickname, params.roomCode]);

  const isHost = useMemo(() => host === nickname, [host, nickname]);
  const allDrawingsDone = useMemo(
    () => expectedDrawings !== null && drawings.length >= expectedDrawings,
    [drawings.length, expectedDrawings],
  );

  const timerDeadline = useMemo(() => {
    if (!drawStartsAt || !timerSeconds) return null;
    return new Date(drawStartsAt).getTime() + timerSeconds * 1000;
  }, [drawStartsAt, timerSeconds]);

  const timerExpired = useMemo(() => {
    if (!timerDeadline) return false;
    return now >= timerDeadline;
  }, [now, timerDeadline]);

  const revealUnlocked = useMemo(() => allDrawingsDone || timerExpired, [allDrawingsDone, timerExpired]);

  // Lance le flip 1.5s après le déblocage (tous les dessins reçus ou timer écoulé)
  useEffect(() => {
    let id: NodeJS.Timeout | null = null;
    if (revealUnlocked) {
      id = setTimeout(() => setRevealReady(true), 1500);
    } else {
      setRevealReady(false);
    }
    return () => {
      if (id) clearTimeout(id);
    };
  }, [revealUnlocked]);

  // S'assure que la phase passe à REVEAL (sinon le passage à VOTE échoue avec DRAW→VOTE)
  useEffect(() => {
    const room = params.roomCode;
    if (!room) return;
    // Ne force la phase que si on est encore en DRAW (sécurité) et seulement côté hôte.
    if (phase !== "DRAW") return;
    if (!isHost) return;
    supabaseClient.from("rooms").update({ current_phase: "REVEAL" }).eq("code", room).then();
  }, [isHost, params.roomCode, phase]);

  // Redirige tout le monde quand la phase passe à VOTE
  // En mode Duel → on va sur /guess au lieu de /vote
  useEffect(() => {
    if (phase === "VOTE") {
      if (isDuelMode) {
        router.replace(`/room/${params.roomCode}/guess?nickname=${encodeURIComponent(nickname)}`);
      } else {
        router.replace(`/room/${params.roomCode}/vote?nickname=${encodeURIComponent(nickname)}`);
      }
    }
  }, [phase, nickname, params.roomCode, router, isDuelMode]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>Révélation des dessins</h2>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "#facc15",
            border: "3px solid rgba(234,179,8,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 14,
            color: "#0b0f1a",
            boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
            opacity: revealReady ? 0 : 1,
            transform: revealReady ? "scale(0.8) translateY(-6px)" : "none",
            pointerEvents: "none",
          }}
        >
          {drawings.length}
          {expectedDrawings !== null ? `/${expectedDrawings}` : ""}
        </div>
      </div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
        {drawings
          .filter((d) => d.data_url && d.nickname) // sécurité
          .map((d) => (
          <div
            key={d.id}
            style={{
              display: "grid",
              gap: 8,
              padding: 8,
              background: "transparent",
              color: "#e5e7eb",
              borderRadius: 12,
            }}
          >
            <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", perspective: "1200px" }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 10,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                  transformStyle: "preserve-3d",
                  transition: "transform 0.7s ease",
                  transform: revealReady ? "rotateY(0deg)" : "rotateY(180deg)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backfaceVisibility: "hidden",
                    overflow: "hidden",
                    borderRadius: 10,
                    background: "#ffffff",
                  }}
                >
                  <Image
                    src={d.data_url}
                    alt={`Dessin de ${d.nickname}`}
                    fill
                    sizes="320px"
                    style={{ objectFit: "contain", background: "#ffffff" }}
                  />
                </div>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    overflow: "hidden",
                    borderRadius: 10,
                  }}
                >
                  <Image
                    src="/backcard.png"
                    alt="Dos de carte"
                    fill
                    sizes="320px"
                    style={{ objectFit: "cover" }}
                    priority={false}
                  />
                </div>
              </div>
            </div>
              <strong style={{ textAlign: "center", color: "#ffffff" }}>{d.nickname}</strong>
          </div>
        ))}
      </div>
      {isHost ? (
        <button
          className="btn btn-compact"
          disabled={!revealUnlocked}
          style={{ opacity: revealUnlocked ? 1 : 0.5 }}
          onClick={async () => {
            // Met à jour la phase pour synchroniser tous les joueurs
            // En mode Duel, la phase passe à VOTE mais la redirection va vers /guess
            const resp = await fetch("/api/phase/vote", {
              method: "POST",
              body: JSON.stringify({ roomCode: params.roomCode }),
            });
            if (resp.ok) {
              setPhase("VOTE"); // force le trigger local immédiat pour l'hôte
            }
          }}
        >
          {isDuelMode ? "⚔️ Passer à la devinette" : "Passer au vote"}
        </button>
      ) : (
        <p>En attente de l&apos;hôte pour {isDuelMode ? "passer à la devinette" : "passer au vote"}…</p>
      )}
      {!revealUnlocked && (
        <p>
          Dessins reçus : {drawings.length}
          {expectedDrawings !== null ? `/${expectedDrawings}` : ""}. Les cartes se retournent quand tous ont soumis ou à la fin du timer.
        </p>
      )}
    </div>
  );
}
