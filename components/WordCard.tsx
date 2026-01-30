"use client";

interface Props {
  word: string;
  roleLabel: string;
}

export function WordCard({ word, roleLabel }: Props) {
  return (
    <div
      className="card"
      style={{
        textAlign: "center",
        background: "transparent",
        color: "#facc15",
        border: "2px solid #facc15",
        boxShadow: "none",
      }}
    >
      <p style={{ fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 6 }}>{roleLabel}</p>
      <p style={{ fontSize: 32, fontWeight: 800 }}>{word}</p>
    </div>
  );
}
