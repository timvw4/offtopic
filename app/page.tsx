"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import titleLogo from "../public/title.png";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabaseClient";

type Mode = "create" | "join" | null;

function generateRoomCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sans O, I, 0, 1 pour éviter la confusion
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const joinReady = nickname.trim().length >= 2 && roomCode.trim().length >= 3;

  function handleCreate() {
    setError(null);
    const pseudo = nickname.trim();
    if (pseudo.length < 2) {
      setError("Choisis un pseudo (au moins 2 caractères).");
      return;
    }
    const code = generateRoomCode();
    router.push(`/room/${code}?nickname=${encodeURIComponent(pseudo || "Hôte")}`);
  }

  async function handleContinue() {
    if (mode !== "join") return;
    setError(null);
    if (!joinReady) return;
    // Join: vérifier que la salle existe
    try {
      setLoading(true);
      const code = roomCode.trim().toUpperCase();
      const pseudo = nickname.trim();
      const playerStorageKey = `off-topic:player:${code}:${pseudo}`;
      const storedPlayerId = typeof window !== "undefined" ? window.localStorage.getItem(playerStorageKey) : null;
      const { data } = await supabaseClient.from("rooms").select("code, current_phase").eq("code", code).maybeSingle();
      if (!data) {
        setError("Code de salle invalide ou inexistant.");
        return;
      }
      // Bloquer uniquement pendant les phases de jeu actif.
      // "RESULTS" est autorisé car la partie est terminée et les joueurs reviennent au lobby.
      const activeGamePhases = ["WORD", "DRAW", "REVEAL", "VOTE"];
      if (data.current_phase && activeGamePhases.includes(data.current_phase)) {
        setError("Partie déjà en cours, impossible de rejoindre.");
        return;
      }
      const { data: existingPlayer, error: existingPlayerError } = await supabaseClient
        .from("players")
        .select("id")
        .eq("room_code", code)
        .eq("nickname", pseudo)
        .maybeSingle();

      if (existingPlayerError) {
        setError("Impossible de vérifier ton pseudo. Réessaie dans un instant.");
        return;
      }

      if (existingPlayer && (!storedPlayerId || existingPlayer.id !== storedPlayerId)) {
        setError("Ce pseudo est déjà utilisé dans cette salle. Choisis-en un autre.");
        return;
      }

      router.push(`/room/${code}?nickname=${encodeURIComponent(pseudo)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Déclenche les animations d'entrée au chargement
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="home-hero" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ─── Bouton "i" fixe en haut à gauche ─── */}
      <button
        onClick={() => setShowHelp(true)}
        aria-label="Règles du jeu"
        style={{
          position: "fixed",
          top: 14,
          left: 14,
          zIndex: 900,
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.15)",
          border: "1.5px solid rgba(255,255,255,0.35)",
          color: "#fff",
          fontSize: 17,
          fontWeight: 700,
          fontStyle: "italic",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(6px)",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.28)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
      >
        i
      </button>

      {/* ─── Drawer d'aide (règles du jeu) ─── */}
      {showHelp && (
        <div
          onClick={() => setShowHelp(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 560,
              maxHeight: "88vh",
              overflowY: "auto",
              background: "#1a1a2e",
              borderRadius: "20px 20px 0 0",
              padding: "24px 22px 36px",
              display: "grid",
              gap: 20,
              animation: "slideUp 0.32s cubic-bezier(0.32,0.72,0,1)",
            }}
          >
            {/* En-tête */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#fff" }}>📖 Comment jouer ?</h2>
              <button
                onClick={() => setShowHelp(false)}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  color: "#fff",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  fontSize: 16,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>

            {/* ── Section 1 : Jeu classique ── */}
            <div style={{ display: "grid", gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#facc15" }}>🎨 Jeu classique</h3>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 1.6 }}>
                Chaque joueur reçoit un mot secret. Les <strong>Civils</strong> reçoivent tous le même mot.
                Le ou les <strong>Hors-Thème</strong> reçoivent un mot légèrement différent.
              </p>
              <div style={{ display: "grid", gap: 7 }}>
                {[
                  { icon: "✏️", text: "Tout le monde dessine son mot en silence pendant le temps imparti." },
                  { icon: "🔍", text: "Les dessins sont révélés un à un. Observez bien les différences !" },
                  { icon: "🗳️", text: "Chaque joueur vote pour désigner le Hors-Thème qu'il a repéré." },
                  { icon: "🏆", text: "Les Civils gagnent s'ils trouvent le Hors-Thème. Le Hors-Thème gagne s'il passe inaperçu." },
                ].map(({ icon, text }) => (
                  <div key={text} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.5 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Séparateur */}
            <div style={{ height: 1, background: "rgba(255,255,255,0.1)" }} />

            {/* ── Section 2 : Rôles spéciaux ── */}
            <div style={{ display: "grid", gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#a78bfa" }}>🎭 Rôles spéciaux</h3>
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  {
                    role: "🦎 Caméléon",
                    desc: "Reçoit une feuille blanche. Il ne connaît pas le mot, mais doit faire croire qu'il dessine quelque chose.",
                  },
                  {
                    role: "👑 Dictateur",
                    desc: "Un Civil qui choisit seul l'ordre de révélation des dessins. Pouvoir tactique !",
                  },
                  {
                    role: "👻 Fantôme",
                    desc: "Un Civil éliminé au vote. Il peut encore voter aux tours suivants depuis l'au-delà.",
                  },
                  {
                    role: "💀 Fantôme Hors-Thème",
                    desc: "Un Hors-Thème éliminé. Il connaît le mot civil et peut tenter de faire éliminer un innocent à titre posthume.",
                  },
                ].map(({ role, desc }) => (
                  <div
                    key={role}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      display: "grid",
                      gap: 3,
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#e2e8f0" }}>{role}</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Séparateur */}
            <div style={{ height: 1, background: "rgba(255,255,255,0.1)" }} />

            {/* ── Section 3 : Mode Duel ── */}
            <div style={{ display: "grid", gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#f97316" }}>⚔️ Mode Duel (2 joueurs)</h3>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 1.6 }}>
                Deux joueurs, un seul mot commun. Dessinez-le chacun de votre côté, puis comparez vos œuvres !
              </p>
              <div style={{ display: "grid", gap: 7 }}>
                {[
                  { icon: "🎯", text: "Les deux joueurs reçoivent exactement le même mot." },
                  { icon: "✏️", text: "Chacun dessine le mot de son côté sans voir celui de l'autre." },
                  { icon: "📊", text: "À la fin, un algorithme compare les deux dessins et affiche un score de ressemblance en pourcentage." },
                  { icon: "🥇", text: "Plus le score est élevé, plus vos dessins se ressemblent. Visez 100% !" },
                ].map(({ icon, text }) => (
                  <div key={text} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.5 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Styles d'animation ─── */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
      <div
        style={{
          display: "grid",
          gap: 12,
          padding: "4px 8px 8px",
          maxWidth: 960,
          margin: "0 auto",
          minHeight: "calc(100vh - 120px)",
          alignContent: "start",
          flex: 1,
        }}
      >
        <div style={{ display: "grid", gap: 10, textAlign: "center", marginTop: 25 }}>
          <div
            style={{
              justifySelf: "center",
              width: "100%",
              maxWidth: 200,
              marginBottom: 48,
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0px) scale(1)" : "translateY(-12px) scale(0.97)",
              transition: "opacity 0.6s ease, transform 0.6s ease",
            }}
          >
            <Image src={titleLogo} alt="OFF-TOPIC" priority style={{ width: "100%", height: "auto" }} sizes="300px" />
          </div>
        </div>
        <div
          className="panel"
          style={{
            display: "grid",
            gap: 14,
            width: "100%",
            maxWidth: 520,
            justifySelf: "center",
            marginTop: 12,
            alignSelf: "center",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0px)" : "translateY(18px)",
            transition: "opacity 0.65s ease 0.12s, transform 0.65s ease 0.12s",
          }}
        >
          <label style={{ textAlign: "left", display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Ton pseudo</span>
            <input
              className="input"
              placeholder="Ex: BigbougGius"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </label>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <button className="btn btn-compact" onClick={handleCreate}>
              Créer une partie
            </button>
            <button
              className={`btn btn-compact ${mode === "join" ? "" : "btn-ghost"}`}
              onClick={() => {
                setMode((m) => (m === "join" ? null : "join"));
                setError(null);
              }}
            >
              Rejoindre une partie
            </button>
          </div>

          {mode === "join" && (
            <div style={{ display: "grid", gap: 10, width: "100%" }}>
              <label style={{ textAlign: "left", display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 600 }}>Code de salle</span>
                <input
                  className="input"
                  placeholder="Ex: ABC23"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                />
              </label>
              {error && <p style={{ color: "#f87171" }}>{error}</p>}

              <button
                className="btn btn-compact"
                disabled={!joinReady || loading}
                style={{ opacity: !joinReady || loading ? 0.5 : 1 }}
                onClick={handleContinue}
              >
                {loading ? "Vérification..." : "Continuer"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
