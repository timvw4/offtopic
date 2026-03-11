"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import titleLogo from "../public/title.png";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabaseClient";

type Mode = "create" | "join" | null;

// ─── Contenu du guide ────────────────────────────────────────────────────────
const ROLES = [
  {
    name: "Civil",
    desc: "Tu reçois le mot du thème. Dessine-le pour que les autres Civils te reconnaissent, sans te faire piéger par les Hors-Thème. Ton but : faire éliminer un Hors-Thème.",
  },
  {
    name: "Hors-Thème",
    desc: "Tu reçois un mot légèrement différent de celui des Civils, mais tu es affiché comme « Civil » — tu ne sais même pas que ton mot est différent ! Dessine naturellement et espère passer inaperçu.",
  },
  {
    name: "Caméléon",
    desc: "Surprise : tu reçois le même mot que les Civils. Mais ton but est de te faire éliminer ! Joue de façon suspecte pour convaincre les autres que tu es Hors-Thème, sans te faire démasquer trop tôt.",
  },
  {
    name: "Dictateur",
    desc: "Tu joues comme un Civil, mais tu as une immunité : la première fois que la majorité vote contre toi, tu survives et ton vote suivant compte double. La deuxième fois, tu es éliminé.",
  },
  {
    name: "Fantôme",
    desc: "Tu joues normalement comme un Civil. Mais si tu es éliminé, tu ne quittes pas la partie : tu continues à voter depuis l'au-delà pour influencer le résultat final !",
  },
];

const STEPS = [
  { num: "1", title: "Reçois ton mot", desc: "Chaque joueur reçoit un mot secret selon son rôle." },
  { num: "2", title: "Dessine !", desc: "Tout le monde dessine son mot en même temps dans le temps imparti." },
  { num: "3", title: "Révélation", desc: "Les dessins se retournent. Observez, comparez, suspectez." },
  { num: "4", title: "Vote", desc: "Votez pour éliminer celui qui semble Hors-Thème." },
];

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

      {/* ─── Bouton "i" fixe en haut à gauche ─────────────────────────────── */}
      <button
        onClick={() => setShowHelp(true)}
        aria-label="Aide / Comment jouer"
        style={{
          position: "fixed",
          top: 14,
          left: 14,
          zIndex: 1000,
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: "var(--accent)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          fontWeight: 900,
          color: "#070c16",
          boxShadow: "0 2px 12px rgba(255,213,45,0.45)",
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        i
      </button>

      {/* ─── Modal Guide du jeu ────────────────────────────────────────────── */}
      {showHelp && (
        <div
          onClick={() => setShowHelp(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "rgba(7,12,22,0.85)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px 12px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-strong)",
              border: "1px solid var(--stroke)",
              borderRadius: 18,
              width: "100%",
              maxWidth: 480,
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "24px 20px 20px",
              display: "grid",
              gap: 20,
              position: "relative",
            }}
          >
            {/* Croix fermer */}
            <button
              onClick={() => setShowHelp(false)}
              aria-label="Fermer"
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                background: "rgba(255,255,255,0.08)",
                border: "none",
                borderRadius: "50%",
                width: 30,
                height: 30,
                cursor: "pointer",
                color: "var(--text)",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>

            {/* Titre */}
            <div>
              <h2 style={{ fontSize: 20, color: "var(--accent)", marginBottom: 4 }}>Comment jouer ?</h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                Off-Topic est un jeu de dessin et de déduction. Chaque joueur a un rôle secret.
              </p>
            </div>

            {/* Étapes */}
            <div style={{ display: "grid", gap: 10 }}>
              {STEPS.map((s) => (
                <div
                  key={s.num}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 10,
                    padding: "10px 12px",
                  }}
                >
                  <span
                    style={{
                      background: "var(--accent)",
                      color: "#070c16",
                      borderRadius: "50%",
                      width: 26,
                      height: 26,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    {s.num}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Séparateur */}
            <div style={{ borderTop: "1px solid var(--stroke)" }} />

            {/* Rôles */}
            <div>
              <h3 style={{ fontSize: 15, marginBottom: 10, color: "var(--accent)" }}>Les rôles</h3>
              <div style={{ display: "grid", gap: 8 }}>
                {ROLES.map((r) => (
                  <div
                    key={r.name}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 10,
                      padding: "9px 12px",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{r.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Séparateur */}
            <div style={{ borderTop: "1px solid var(--stroke)" }} />

            {/* Mode Duel */}
            <div
              style={{
                background: "rgba(255,213,45,0.07)",
                border: "1px solid rgba(255,213,45,0.2)",
                borderRadius: 12,
                padding: "12px 14px",
                display: "grid",
                gap: 6,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14 }}>⚔️ Mode Duel (2 joueurs)</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
                Les deux joueurs reçoivent le <strong>même mot</strong> et le dessinent chacun de leur côté. À la fin, un
                <strong> score de ressemblance</strong> en % est calculé entre les deux dessins. Plus vos traits se ressemblent, plus
                le score est élevé !
              </div>
            </div>

            {/* Bouton fermer */}
            <button
              className="btn btn-compact"
              onClick={() => setShowHelp(false)}
              style={{ justifySelf: "center", minWidth: 120 }}
            >
              Compris !
            </button>
          </div>
        </div>
      )}
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
