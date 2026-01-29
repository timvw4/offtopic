"use client";

import { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    const room = params.roomCode;
    let channel: ReturnType<typeof supabaseClient.channel> | null = null;
    let pollId: NodeJS.Timeout | null = null;
    let pollDrawings: NodeJS.Timeout | null = null;

    supabaseClient
      .from("drawings")
      .select("id, nickname, data_url")
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
      .from("players")
      .select("is_eliminated")
      .eq("room_code", room)
      .eq("nickname", nickname)
      .maybeSingle()
      .then(({ data }) => setIsEliminated(!!data?.is_eliminated));

    supabaseClient
      .from("rooms")
      .select("host_nickname, current_phase")
      .eq("code", room)
      .maybeSingle()
      .then(({ data }) => {
        setHost(data?.host_nickname || null);
        setPhase(data?.current_phase || null);
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
            .eq("room_code", room)
            .then(({ data }) => setDrawings((data as DrawingRow[]) || []));
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
        .eq("room_code", room)
        .then(({ data }) => setDrawings((data as DrawingRow[]) || []));
    }, 2000);

    return () => {
      channel?.unsubscribe();
      if (pollId) clearInterval(pollId);
      if (pollDrawings) clearInterval(pollDrawings);
    };
  }, [params.roomCode]);

  const isHost = useMemo(() => host === nickname, [host, nickname]);
  const allDrawingsDone = useMemo(
    () => expectedDrawings !== null && drawings.length >= expectedDrawings,
    [drawings.length, expectedDrawings],
  );

  // S'assure que la phase passe à REVEAL (sinon le passage à VOTE échoue avec DRAW→VOTE)
  useEffect(() => {
    const room = params.roomCode;
    if (!room) return;
    if (phase === "REVEAL") return;
    // On force la phase côté room ; appels multiples inoffensifs.
    supabaseClient.from("rooms").update({ current_phase: "REVEAL" }).eq("code", room).then();
  }, [params.roomCode, phase]);

  // Redirige tout le monde quand la phase passe à VOTE
  useEffect(() => {
    if (phase === "VOTE") {
      router.replace(`/room/${params.roomCode}/vote?nickname=${encodeURIComponent(nickname)}`);
    }
  }, [phase, nickname, params.roomCode, router]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2>Révélation des dessins</h2>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
        {drawings
          .filter((d) => d.data_url && d.nickname) // sécurité
          .map((d) => (
          <div key={d.id} className="card">
            <strong>{d.nickname}</strong>
            <img src={d.data_url} alt={`Dessin de ${d.nickname}`} style={{ width: "100%", borderRadius: 8 }} />
          </div>
        ))}
      </div>
      {isHost ? (
        <button
          className="btn"
          disabled={!allDrawingsDone}
          style={{ opacity: allDrawingsDone ? 1 : 0.5 }}
          onClick={async () => {
            // Met à jour la phase pour synchroniser tous les joueurs
            const resp = await fetch("/api/phase/vote", {
              method: "POST",
              body: JSON.stringify({ roomCode: params.roomCode }),
            });
            if (resp.ok) {
              setPhase("VOTE"); // force le trigger local immédiat pour l'hôte
            }
          }}
        >
          Passer au vote
        </button>
      ) : (
        <p>En attente de l&apos;hôte pour passer au vote…</p>
      )}
      {isHost && !allDrawingsDone && <p>En attente que tous les dessins soient soumis…</p>}
    </div>
  );
}
