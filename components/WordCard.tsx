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
        padding: "10px 12px",
      }}
    >
      <p style={{ fontSize: "clamp(20px, 5vw, 28px)", fontWeight: 800, margin: 0 }}>{word}</p>
    </div>
  );
}
