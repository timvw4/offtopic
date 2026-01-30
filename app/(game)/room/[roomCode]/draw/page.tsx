"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { DrawingCanvas, DrawingCanvasHandle } from "@/components/DrawingCanvas";
import { Timer } from "@/components/Timer";
import { supabaseClient } from "@/lib/supabaseClient";
import { Player } from "@/lib/types";

export default function DrawPage() {
  const router = useRouter();
  const params = useParams<{ roomCode: string }>();
  const search = useSearchParams();
  const nickname = search.get("nickname") || "Guest";
  const timer = Number(search.get("timer") || 60);

  const [drawStartsAt, setDrawStartsAt] = useState<string | null>(null);
  const [locked, setLocked] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [initialRemaining, setInitialRemaining] = useState(timer);
  const [isEliminated, setIsEliminated] = useState(false);
  const canvasRef = useRef<DrawingCanvasHandle | null>(null);

  useEffect(() => {
    const room = params.roomCode;
    if (!room) return;
    let channel: ReturnType<typeof supabaseClient.channel> | null = null;
    let pollRound: NodeJS.Timeout | null = null;

    async function init() {
      const { data } = await supabaseClient
        .from("rounds")
        .select("draw_starts_at")
        .eq("room_code", room)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      setDrawStartsAt(data?.draw_starts_at ?? null);

      // Vérifie si le joueur est éliminé pour le rediriger directement
      const { data: me } = await supabaseClient
        .from("players")
        .select("is_eliminated")
        .eq("room_code", room)
        .eq("nickname", nickname)
        .maybeSingle();
      setIsEliminated(!!me?.is_eliminated);

      channel = supabaseClient
        .channel(`draw:${room}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "rounds", filter: `room_code=eq.${room}` },
          ({ new: n }) => setDrawStartsAt(n?.draw_starts_at ?? null),
        )
        .subscribe();

      // Polling de secours si l'événement Realtime ne passe pas
      pollRound = setInterval(() => {
        supabaseClient
          .from("rounds")
          .select("draw_starts_at")
          .eq("room_code", room)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()
          .then(({ data }) => setDrawStartsAt(data?.draw_starts_at ?? null));
      }, 500);
    }

    void init();
    return () => {
      channel?.unsubscribe();
      if (pollRound) clearInterval(pollRound);
    };
  }, [nickname, params.roomCode]);

  // Gère le compte à rebours commun
  useEffect(() => {
    if (isEliminated) {
      router.replace(`/room/${params.roomCode}/reveal?nickname=${encodeURIComponent(nickname)}`);
      return;
    }
    if (!drawStartsAt) {
      setCountdown(null);
      setLocked(true);
      setInitialRemaining(timer);
      return;
    }
    const target = new Date(drawStartsAt).getTime();
    // Recalcule le temps restant au démarrage en fonction de l'horodatage commun
    const updateInitialRemaining = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - target) / 1000));
      setInitialRemaining(Math.max(0, timer - elapsed));
    };
    updateInitialRemaining();
    const tick = () => {
      const diffMs = target - Date.now();
      const diff = Math.max(0, Math.ceil(diffMs / 1000));
      setCountdown(diff);
      if (diffMs <= 0) {
        setLocked(false);
        updateInitialRemaining();
      }
    };
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [drawStartsAt, isEliminated, nickname, params.roomCode, router, timer]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>Dessine ton mot</h2>

      {countdown !== null && countdown > 0 && (
        <div className="card" style={{ textAlign: "center", fontSize: 24, fontWeight: 700 }}>
          Début dans {countdown}s
        </div>
      )}

      {!isEliminated && (
        <>
      <Timer
        duration={initialRemaining}
        running={!locked}
        tickMs={500}
            onExpire={async () => {
          setLocked(true);
              const dataUrl = canvasRef.current?.exportImage();
              if (dataUrl) {
                await fetch("/api/drawing", {
                  method: "POST",
                  body: JSON.stringify({ roomCode: params.roomCode, nickname, dataUrl }),
                });
              }
              router.push(`/room/${params.roomCode}/reveal?nickname=${encodeURIComponent(nickname)}`);
        }}
      />

      <DrawingCanvas
            ref={canvasRef}
        disabled={locked}
        onExport={async (dataUrl) => {
          setLocked(true);
          await fetch("/api/drawing", {
            method: "POST",
            body: JSON.stringify({ roomCode: params.roomCode, nickname, dataUrl }),
          });
          router.push(`/room/${params.roomCode}/reveal?nickname=${encodeURIComponent(nickname)}`);
        }}
      />
        </>
      )}
    </div>
  );
}
