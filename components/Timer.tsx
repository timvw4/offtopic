"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  duration: number;
  onExpire?: () => void;
  running?: boolean;
  tickMs?: number;
}

export function Timer({ duration, onExpire, running = true, tickMs = 1000 }: Props) {
  const [remaining, setRemaining] = useState(duration);
  const onExpireRef = useRef(onExpire);

  // Garde la dernière version de la callback sans redémarrer l'intervalle.
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!running) return;
    setRemaining(duration);
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, tickMs);
    return () => clearInterval(id);
  }, [duration, running, tickMs]);

  return (
    <div
      className="card"
      style={{
        fontWeight: 700,
        textAlign: "center",
        fontSize: 18,
        background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
        border: "1px solid rgba(255,255,255,0.14)",
      }}
    >
      ⏱️ {remaining}s
    </div>
  );
}
