"use client";

import { useEffect, useState } from "react";

interface Props {
  duration: number;
  onExpire?: () => void;
  running?: boolean;
  tickMs?: number;
}

export function Timer({ duration, onExpire, running = true, tickMs = 1000 }: Props) {
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => {
    if (!running) return;
    setRemaining(duration);
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, tickMs);
    return () => clearInterval(id);
  }, [duration, onExpire, running, tickMs]);

  return (
    <div className="card" style={{ fontWeight: 700, textAlign: "center" }}>
      ⏱️ {remaining}s
    </div>
  );
}
