"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AmbientAudioButton } from "@/components/AmbientAudio";

const MENU_ANIMATION = `
@keyframes menuFadeScale {
  from {
    opacity: 0;
    transform: translateY(-6px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
`;

export default function RoomLayout({ children }: { children: ReactNode }) {
  const params = useParams<{ roomCode: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const nickname = search.get("nickname") || "Guest";

  // État local pour contrôler l'ouverture du menu.
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Ferme le menu si on clique en dehors de son conteneur.
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent | TouchEvent) {
      if (!menuRef.current) return;
      const target = event.target;
      if (target instanceof Node && menuRef.current.contains(target)) return;
      setMenuOpen(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  async function handleLeave() {
    try {
      await fetch("/api/player/leave", {
        method: "POST",
        body: JSON.stringify({ roomCode: params.roomCode, nickname }),
      });
    } catch (e) {
      // on ignore les erreurs réseau pour ne pas bloquer la sortie
    } finally {
      router.replace("/");
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <style jsx global>{MENU_ANIMATION}</style>
      <header
        className="card"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 3000 }}
      >
        <div>
          <strong>Salle</strong>{" "}
          <span style={{ color: "#facc15", fontWeight: 800, letterSpacing: 0.4 }}>{params.roomCode}</span>
        </div>

        {/* Petit menu qui regroupe Quitter et un simple bouton On/Off. */}
        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            className="btn btn-compact btn-ghost"
            style={{
              border: "none",
              color: "#e5e7eb",
              outline: "none",
              boxShadow: "none",
              width: 44,
              height: 44,
              padding: 0,
              display: "grid",
              placeItems: "center",
            }}
            aria-expanded={menuOpen}
            aria-label="Ouvrir le menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span
              aria-hidden
              style={{
                display: "grid",
                gap: 5,
                width: 20,
                transition: "transform 180ms ease, gap 180ms ease",
                transform: menuOpen ? "rotate(90deg)" : "rotate(0deg)",
              }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    display: "block",
                    height: 2,
                    borderRadius: 2,
                    background: "#e5e7eb",
                    transform: menuOpen ? (i === 1 ? "scaleX(0.8)" : "scaleX(1)") : "scaleX(1)",
                    transformOrigin: "center",
                    transition: "transform 180ms ease",
                  }}
                />
              ))}
            </span>
          </button>

          {menuOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 10px)",
                display: "grid",
                gap: 6,
                padding: "12px 10px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(12,12,14,0.88)",
                backdropFilter: "blur(10px)",
                boxShadow: "0 14px 32px rgba(0,0,0,0.45)",
                minWidth: 180,
                zIndex: 4000, // au-dessus des sections animées
                animation: "menuFadeScale 160ms ease-out",
                transformOrigin: "top right",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gap: 6,
                }}
              >
                <button
                  className="btn btn-compact btn-ghost"
                  style={{
                    justifyContent: "flex-start",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.04)",
                    transition: "background 160ms ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                  onClick={() => {
                    setMenuOpen(false);
                    void handleLeave();
                  }}
                >
                  Quitter
                </button>

                <div
                  style={{
                    height: 1,
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                    margin: "4px 2px",
                  }}
                />

                <div
                  style={{
                    borderRadius: 10,
                    overflow: "hidden",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <AmbientAudioButton variant="inline" />
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}
