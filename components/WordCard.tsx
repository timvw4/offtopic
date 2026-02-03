"use client";

interface Props {
  word: string;
}

export function WordCard({ word }: Props) {
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
      <p style={{ fontSize: 32, fontWeight: 800 }}>{word}</p>
    </div>
  );
}
