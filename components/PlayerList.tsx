"use client";

import { Player } from "@/lib/types";

interface Props {
  players: Player[];
  revealRoles?: boolean;
  showStatus?: boolean;
  dimNotInLobby?: boolean;
  dimEliminated?: boolean;
}

export function PlayerList({
  players,
  revealRoles = false,
  showStatus = true,
  dimNotInLobby = false,
  dimEliminated = true,
}: Props) {
  return (
    <div className="card" style={{ display: "grid", gap: 10 }}>
      <h3>Joueurs</h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
        {players.map((p) => (
          <li
            key={p.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              opacity: dimEliminated && p.isEliminated ? 0.4 : dimNotInLobby && p.isInLobby === false ? 0.5 : 1,
            }}
          >
            <span style={{ fontWeight: 600 }}>
              {p.nickname} {p.isHost ? "(Hôte)" : ""}
            </span>
            {showStatus && (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {p.isEliminated ? "⛔" : "✅"} {revealRoles ? p.role : "❓"}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
