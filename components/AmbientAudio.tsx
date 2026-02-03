"use client";

import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const SOURCE = "/embience.wav"; // veille à ce que le fichier soit présent dans public/

type Placement = "top" | "bottom";
type Variant = "floating" | "inline";

type AmbientAudioContextValue = {
  playing: boolean;
  error: string | null;
  toggle: () => Promise<void>;
};

const AmbientAudioContext = createContext<AmbientAudioContextValue | null>(null);

// Hook pratique pour récupérer l'état (ON/OFF) et l'action toggle dans n'importe quel composant.
export function useAmbientAudio() {
  const ctx = useContext(AmbientAudioContext);
  if (!ctx) {
    throw new Error("useAmbientAudio doit être utilisé dans un AmbientAudioProvider");
  }
  return ctx;
}

type ProviderProps = {
  children: ReactNode;
  placement?: Placement;
  showFloatingButton?: boolean;
};

// Provider : gère le son et expose un état + un toggle accessibles partout via le hook ci-dessus.
export function AmbientAudioProvider({ children, placement = "bottom", showFloatingButton = false }: ProviderProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = new Audio(SOURCE);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.05; // ajuste ici si trop faible ou trop fort (0.0 à 1.0)
    audioRef.current = audio;

    const tryPlay = async () => {
      try {
        setError(null);
        await audio.play();
        setPlaying(true);
      } catch (err) {
        // Autoplay bloqué : on affiche le bouton pour déclencher manuellement
        setPlaying(false);
        setError("");
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

  const toggle = useCallback(async () => {
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
  }, []);

  const value = useMemo(
    () => ({
      playing,
      error,
      toggle,
    }),
    [playing, error, toggle],
  );

  return (
    <AmbientAudioContext.Provider value={value}>
      {children}
      {showFloatingButton && <AmbientAudioButton placement={placement} variant="floating" />}
    </AmbientAudioContext.Provider>
  );
}

type ButtonProps = {
  placement?: Placement;
  variant?: Variant;
};

// Bouton réutilisable : floating (comme avant) ou inline (parfait dans un menu).
export function AmbientAudioButton({ placement = "bottom", variant = "floating" }: ButtonProps) {
  const { playing, error, toggle } = useAmbientAudio();

  if (variant === "inline") {
    return (
      <div style={{ display: "grid", gap: 4 }}>
        <button
          className="btn btn-compact btn-ghost"
          style={{ justifyContent: "flex-start" }}
          onClick={toggle}
        >
          {playing ? "🔊  Musique : ON" : "🔇  Musique : OFF"}
        </button>
        {error && <small style={{ margin: 0, color: "#e5e7eb" }}>{error || "Lecture bloquée"}</small>}
      </div>
    );
  }

  return (
    <div
      className="audio-floating"
      style={{
        top: placement === "top" ? "max(12px, env(safe-area-inset-top))" : "auto",
        bottom: placement === "bottom" ? "max(12px, env(safe-area-inset-bottom, 12px))" : "auto",
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
        {playing ? "▶️ ON" : "⏸️ OFF"}
      </button>
      {error && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#e5e7eb" }}>{error}</p>}
    </div>
  );
}
