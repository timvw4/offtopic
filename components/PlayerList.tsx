"use client";

import { Player } from "@/lib/types";

interface Props {
  players: Player[];
  revealRoles?: boolean;
  showStatus?: boolean;
  dimNotInLobby?: boolean;
  dimEliminated?: boolean;
  showLobbyStatus?: boolean;
}

export function PlayerList({
  players,
  revealRoles = false,
  showStatus = true,
  dimNotInLobby = false,
  dimEliminated = true,
  showLobbyStatus = false,
}: Props) {
  return (
    <div
      className="card"
      style={{
        display: "grid",
        gap: 10,
        border: "1px solid rgba(250, 204, 21, 0.6)" /* contour jaune légèrement transparent */,
      }}
    >
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
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Indicateur de présence dans le lobby : point vert = présent, gris = pas encore arrivé */}
              {showLobbyStatus && (
                <span
                  title={p.isInLobby ? "Dans le lobby" : "Pas encore dans le lobby"}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: p.isInLobby ? "#22c55e" : "rgba(255,255,255,0.2)",
                    boxShadow: p.isInLobby ? "0 0 6px rgba(34,197,94,0.6)" : "none",
                    transition: "background 0.3s ease, box-shadow 0.3s ease",
                  }}
                />
              )}
            <span style={{ fontWeight: 600 }}>
              {p.nickname} {p.isHost ? "(Hôte)" : ""}
              </span>
            </span>
            {showStatus && (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {p.isEliminated ? "⛔" : "✅"} {revealRoles ? p.role : "❓"}
              </span>
            )}
            {/* Libellé de statut affiché à droite quand on est en mode lobby */}
            {showLobbyStatus && (
              <span style={{ fontSize: 12, color: p.isInLobby ? "#22c55e" : "rgba(255,255,255,0.35)" }}>
                {p.isInLobby ? "Présent" : "En route…"}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
