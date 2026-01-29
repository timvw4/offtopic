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
}

export function VotePanel({
  players,
  onVote,
  onAccuseChameleon,
  accusationAvailable,
  showAccusation = true,
  disableAccusation = false,
  disableVote = false,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedAccuse, setSelectedAccuse] = useState<string | null>(null);

  return (
    <div className="card" style={{ display: "grid", gap: 8 }}>
      <h3>Vote secret: éliminer un Hors-Thème</h3>
      {players
        .filter((p) => !p.isEliminated)
        .map((p) => (
          <label key={p.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="radio"
              name="vote"
              value={p.id}
              checked={selected === p.id}
                disabled={disableVote}
                onChange={() => setSelected(p.id)}
            />
            {p.nickname}
          </label>
        ))}
      <button className="btn" disabled={!selected || disableVote} onClick={() => selected && onVote(selected)}>
        Voter
      </button>
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
                  className="btn"
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
