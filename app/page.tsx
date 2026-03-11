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
  const [showInfo, setShowInfo] = useState(false);

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

      {/* ── Bouton info fixe en haut à droite ── */}
      <button
        onClick={() => setShowInfo(true)}
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 100,
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.15)",
          border: "2px solid rgba(255,255,255,0.35)",
          color: "#fff",
          fontSize: 18,
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(6px)",
          transition: "background 0.2s",
        }}
        title="Comment jouer ?"
      >
        i
      </button>

      {/* ── Modale "Comment jouer" ── */}
      {showInfo && (
        <div
          onClick={() => setShowInfo(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#1e1b2e",
              border: "1.5px solid rgba(255,255,255,0.12)",
              borderRadius: 20,
              padding: "28px 24px",
              maxWidth: 500,
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              display: "grid",
              gap: 18,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>🎮 Comment jouer ?</h2>
              <button
                onClick={() => setShowInfo(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#fff",
                  fontSize: 22,
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {/* Principe */}
            <div style={{ display: "grid", gap: 6 }}>
              <h3 style={{ margin: 0, fontSize: 15, color: "#f9c74f" }}>🎯 Le principe</h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.85)" }}>
                Tout le monde reçoit un mot secret et doit le <strong>dessiner</strong>. La plupart des joueurs ont le
                même mot… mais <strong>un ou plusieurs Hors-Thème</strong> ont un mot différent et doivent passer
                inaperçus ! Après avoir vu les dessins, les joueurs votent pour désigner les Hors-Thème.
              </p>
            </div>

            {/* Rôles */}
            <div style={{ display: "grid", gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 15, color: "#f9c74f" }}>🃏 Les rôles</h3>
              {[
                { emoji: "🙂", name: "Civil", desc: "Tu as le mot du groupe. Dessine-le subtilement pour ne pas trop aider les Hors-Thème." },
                { emoji: "🕵️", name: "Hors-Thème", desc: "Tu as un mot différent ! Dessine quelque chose de flou pour te fondre dans la masse sans te faire repérer." },
                { emoji: "🦎", name: "Caméléon", desc: "Tu ne connais pas le mot ! Regarde les dessins des autres et imite-les discrètement." },
                { emoji: "👑", name: "Dictateur", desc: "Tu connais le mot des Civils ET celui du Hors-Thème. Tu dois orienter le vote dans la mauvaise direction." },
                { emoji: "👻", name: "Fantôme", desc: "Tu es éliminé mais tu restes dans la partie. Selon ta variante, tu peux encore voter ou tenter de trouver le mot." },
              ].map((r) => (
                <div
                  key={r.name}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    display: "grid",
                    gap: 2,
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{r.emoji} {r.name}</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{r.desc}</span>
                </div>
              ))}
            </div>

            {/* Mode duel */}
            <div style={{ display: "grid", gap: 6 }}>
              <h3 style={{ margin: 0, fontSize: 15, color: "#f9c74f" }}>⚔️ Mode Duel (2 joueurs)</h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.85)" }}>
                Les deux joueurs reçoivent le <strong>même mot</strong> et doivent le dessiner. À la fin, un{" "}
                <strong>score de ressemblance</strong> entre les deux dessins est calculé automatiquement. Plus vos
                dessins se ressemblent, plus votre score est élevé ! 🎨
              </p>
            </div>

            {/* Déroulement */}
            <div style={{ display: "grid", gap: 6 }}>
              <h3 style={{ margin: 0, fontSize: 15, color: "#f9c74f" }}>📋 Déroulement d&apos;une partie</h3>
              <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 2, color: "rgba(255,255,255,0.85)" }}>
                <li>L&apos;hôte crée une salle et configure les paramètres</li>
                <li>Les joueurs rejoignent via le code de salle</li>
                <li>Chacun découvre son rôle et son mot secret</li>
                <li>Tout le monde dessine en même temps (chronomètre)</li>
                <li>Les dessins sont révélés un par un</li>
                <li>Vote : qui est le Hors-Thème ?</li>
                <li>Les scores sont affichés et on peut rejouer !</li>
              </ol>
            </div>

            <button
              className="btn btn-compact"
              onClick={() => setShowInfo(false)}
              style={{ marginTop: 4 }}
            >
              C&apos;est parti ! 🚀
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
