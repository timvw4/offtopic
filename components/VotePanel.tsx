"use client";

import { Player } from "@/lib/types";
import { useState } from "react";

interface Props {
  players: Player[];
  onVote: (playerId: string) => void;
  onAccuseChameleon: (playerId: string) => void;
  accusationAvailable: boolean;
  showAccusation?: boolean;
  disableAccusation?: boolean;
  disableVote?: boolean;
  hideVoteButton?: boolean;
}

export function VotePanel({
  players,
  onVote,
  onAccuseChameleon,
  accusationAvailable,
  showAccusation = true,
  disableAccusation = false,
  disableVote = false,
  hideVoteButton = false,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedAccuse, setSelectedAccuse] = useState<string | null>(null);

  return (
    <div className="card" style={{ display: "grid", gap: 10, padding: 16 }}>
      <h3>Vote secret: éliminer un Hors-Thème</h3>
      {players
        .filter((p) => !p.isEliminated)
        .map((p) => (
          <label
            key={p.id}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              padding: "10px 12px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <input
              type="radio"
              name="vote"
              value={p.id}
              checked={selected === p.id}
                disabled={disableVote}
                onChange={() => setSelected(p.id)}
              style={{ accentColor: "#ffffff", width: 18, height: 18 }}
            />
            <span style={{ fontWeight: 600 }}>{p.nickname}</span>
          </label>
        ))}
      {!hideVoteButton && (
        <button className="btn btn-compact" disabled={!selected || disableVote} onClick={() => selected && onVote(selected)}>
        Voter
      </button>
      )}
      {showAccusation && (
        <>
          <hr />
          <h4>Accuser le Caméléon (1 fois par partie)</h4>
          <div style={{ display: "grid", gap: 6 }}>
            {players
              .filter((p) => !p.isEliminated)
              .map((p) => (
                <button
                  key={p.id}
                  className="btn btn-compact"
                  disabled={!accusationAvailable || disableAccusation}
                  style={{
                    opacity: !accusationAvailable || disableAccusation ? 0.5 : 1,
                    outline: selectedAccuse === p.id ? "2px solid #fff" : "none",
                  }}
                  onClick={() => {
                    setSelectedAccuse(p.id);
                    onAccuseChameleon(p.id);
                  }}
                >
                  Accuser {p.nickname}
                </button>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
