"use client";

import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const SOURCE = "/ambience.mp3";
const STORAGE_KEY = "off-topic-ambient-audio";

type Placement = "top" | "bottom";
type Variant = "floating" | "inline";

type AmbientAudioContextValue = {
  playing: boolean;
  error: string | null;
  toggle: () => Promise<void>;
};

const AmbientAudioContext = createContext<AmbientAudioContextValue | null>(null);

function readUserWantsMusic(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

function saveUserWantsMusic(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    // localStorage indisponible (mode privé strict, etc.)
  }
}

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

export function AmbientAudioProvider({ children, placement = "bottom", showFloatingButton = false }: ProviderProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = new Audio(SOURCE);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.05;
    audioRef.current = audio;

    const tryPlay = async () => {
      if (!readUserWantsMusic()) {
        audio.pause();
        setPlaying(false);
        return;
      }
      try {
        setError(null);
        await audio.play();
        setPlaying(true);
      } catch {
        audio.pause();
        setPlaying(false);
        setError(null);
      }
    };

    const onAudioError = () => {
      audio.pause();
      setPlaying(false);
      setError("Impossible de charger la musique.");
    };

    audio.addEventListener("error", onAudioError);

    if (readUserWantsMusic()) {
      void tryPlay();
    } else {
      setPlaying(false);
    }

    // Débloque l'autoplay uniquement si l'utilisateur avait déjà choisi « musique ON ».
    const onFirstInteract = () => {
      if (readUserWantsMusic() && audio.paused) {
        void tryPlay();
      }
    };
    document.addEventListener("pointerdown", onFirstInteract, { once: true });

    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      if (event.newValue === "on") {
        void tryPlay();
      } else {
        audio.pause();
        setPlaying(false);
        setError(null);
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      audio.removeEventListener("error", onAudioError);
      document.removeEventListener("pointerdown", onFirstInteract);
      window.removeEventListener("storage", onStorage);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const toggle = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (audio.paused) {
        saveUserWantsMusic(true);
        setError(null);
        await audio.play();
        setPlaying(true);
      } else {
        saveUserWantsMusic(false);
        audio.pause();
        setPlaying(false);
        setError(null);
      }
    } catch {
      saveUserWantsMusic(false);
      audio.pause();
      setPlaying(false);
      setError("Lecture bloquée. Réessayez après un clic sur la page.");
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

export function AmbientAudioButton({ placement = "bottom", variant = "floating" }: ButtonProps) {
  const { playing, error, toggle } = useAmbientAudio();
  const ariaLabel = playing ? "Couper la musique d'ambiance" : "Activer la musique d'ambiance";

  if (variant === "inline") {
    return (
      <div style={{ display: "grid", gap: 4 }}>
        <button
          type="button"
          className="btn btn-compact btn-ghost"
          aria-label={ariaLabel}
          aria-pressed={playing}
          style={{
            justifyContent: "flex-start",
            border: "none",
            borderRadius: 10,
            background: "transparent",
            color: "#e5e7eb",
            width: "100%",
            height: "auto",
            minHeight: 44,
            padding: "10px 14px",
            fontSize: 15,
            whiteSpace: "nowrap",
          }}
          onClick={toggle}
        >
          {playing ? "🔊  Musique : ON" : "🔇  Musique : OFF"}
        </button>
        {error ? <small style={{ margin: 0, color: "#fca5a5" }}>{error}</small> : null}
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
        type="button"
        className="btn btn-compact btn-ghost"
        aria-label={ariaLabel}
        aria-pressed={playing}
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
        {playing ? "⏸️ ON" : "▶️ OFF"}
      </button>
      {error ? <p style={{ margin: "6px 0 0", fontSize: 12, color: "#fca5a5" }}>{error}</p> : null}
    </div>
  );
}
