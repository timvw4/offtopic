"use client";

interface Props {
  word: string;
  roleLabel: string;
}

export function WordCard({ word, roleLabel }: Props) {
  return (
    <div className="card" style={{ textAlign: "center" }}>
      <p style={{ fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase" }}>{roleLabel}</p>
      <p style={{ fontSize: 32, fontWeight: 800 }}>{word}</p>
    </div>
  );
}
