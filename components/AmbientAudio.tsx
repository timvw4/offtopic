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
    audio.volume = 0.15;
    audioRef.current = audio;

    const tryPlay = async () => {
      try {
        await audio.play();
        setPlaying(true);
      } catch (err) {
        // Autoplay bloqué : on affiche le bouton pour déclencher manuellement
        setPlaying(false);
        setError("Clique pour lancer la musique");
      }
    };

    void tryPlay();

    return () => {
      audio.pause();
      audioRef.current = null;
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
      <button className="btn btn-compact btn-ghost" style={{ color: "#facc15" }} onClick={toggle}>
        {playing ? "⏸️ Pause ambiance" : "▶️ Musique ON"}
      </button>
      {error && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#e5e7eb" }}>{error}</p>}
    </div>
  );
}
