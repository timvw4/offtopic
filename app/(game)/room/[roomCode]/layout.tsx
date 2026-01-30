"use client";

import { ReactNode } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

export default function RoomLayout({ children }: { children: ReactNode }) {
  const params = useParams<{ roomCode: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const nickname = search.get("nickname") || "Guest";

  async function handleLeave() {
    try {
      await fetch("/api/player/leave", {
        method: "POST",
        body: JSON.stringify({ roomCode: params.roomCode, nickname }),
      });
    } catch (e) {
      // on ignore les erreurs réseau pour ne pas bloquer la sortie
    } finally {
      router.replace("/");
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <header className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <strong>Salle</strong> {params.roomCode}
        </div>
        <button
          className="btn btn-compact btn-ghost"
          style={{ border: "1.5px solid rgba(231, 231, 231, 0.63)", color: "#e5e7eb" }}
          onClick={handleLeave}
        >
          Quitter
        </button>
      </header>
      {children}
    </div>
  );
}
