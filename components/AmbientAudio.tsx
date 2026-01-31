"use client";

import { useEffect, useRef, useState } from "react";

const SOURCE = "/embience.wav"; // veille à ce que le fichier soit présent dans public/

export function AmbientAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = new Audio(SOURCE);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.15; // ajuste ici si trop faible ou trop fort (0.0 à 1.0)
    audioRef.current = audio;

    const tryPlay = async () => {
      try {
        setError(null);
        await audio.play();
        setPlaying(true);
      } catch (err) {
        // Autoplay bloqué : on affiche le bouton pour déclencher manuellement
        setPlaying(false);
        setError("Autoplay bloqué.");
      }
    };

    // tentative auto au chargement
    void tryPlay();

    // tentative dès la première interaction utilisateur (débloque l'autoplay)
    const onFirstInteract = () => {
      void tryPlay();
      document.removeEventListener("pointerdown", onFirstInteract);
    };
    document.addEventListener("pointerdown", onFirstInteract, { once: true });

    return () => {
      audio.pause();
      audioRef.current = null;
      document.removeEventListener("pointerdown", onFirstInteract);
    };
  }, []);

  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (audio.paused) {
        setError(null);
        await audio.play();
        setPlaying(true);
      } else {
        audio.pause();
        setPlaying(false);
      }
    } catch (err) {
      setError("Lecture bloquée.");
    }
  }

  return (
    <div
      className="audio-floating"
      style={{
        right: 16,
        left: "auto",
        transform: "none",
        bottom: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        textAlign: "center",
      }}
    >
      <button
        className="btn btn-compact btn-ghost"
        style={{
          color: "#facc15",
          padding: "6px 8px",
          minHeight: "32px",
          height: "32px",
          fontSize: 13,
          width: "fit-content",
          minWidth: "unset",
        }}
        onClick={toggle}
      >
        {playing ? "⏸️ OFF" : "▶️ ON"}
      </button>
      {error && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#e5e7eb" }}>{error}</p>}
    </div>
  );
}
