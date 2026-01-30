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
    audio.volume = 0.7;
    audioRef.current = audio;

    const tryPlay = async () => {
      try {
        setError(null);
        await audio.play();
        setPlaying(true);
      } catch (err) {
        // Autoplay bloqué : on affiche le bouton pour déclencher manuellement
        setPlaying(false);
        setError("Autoplay bloqué, clique pour lancer.");
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
      setError("Lecture bloquée, réessaie.");
    }
  }

  return (
    <div className="audio-floating">
      <button
        className="btn btn-compact btn-ghost"
        style={{ color: "#facc15", padding: "6px 10px", minHeight: "36px", height: "36px", fontSize: 14 }}
        onClick={toggle}
      >
        {playing ? "⏸️ Pause ambiance" : "▶️ Musique ON"}
      </button>
      {error && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#e5e7eb" }}>{error}</p>}
    </div>
  );
}
