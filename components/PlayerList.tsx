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
    <div className="card">
      <h3>Joueurs</h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 4 }}>
        {players.map((p) => (
          <li
            key={p.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              opacity: dimEliminated && p.isEliminated ? 0.4 : dimNotInLobby && p.isInLobby === false ? 0.5 : 1,
            }}
          >
            <span>
              {p.nickname} {p.isHost ? "(Hôte)" : ""}
            </span>
            {showStatus && (
              <span>
                {p.isEliminated ? "⛔" : "✅"} {revealRoles ? p.role : "❓"}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
