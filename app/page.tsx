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

// ─── Onboarding Modal ──────────────────────────────────────────────────────────
function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);

  // Les 3 étapes de l'onboarding
  const steps = [
    {
      emoji: "🎨",
      title: "Bienvenue sur OFF-TOPIC !",
      desc: "Le jeu de dessin où les imposteurs se cachent parmi vous. Testez votre flair… et votre crayon !",
      sub: "Jouez entre amis, sur téléphone ou PC, sans application à télécharger.",
    },
    {
      emoji: "🕵️",
      title: "Comment ça marche ?",
      desc: "Chaque joueur reçoit un mot secret et doit le dessiner. Mais attention… un Hors-Thème a un mot différent et tente de se fondre dans la masse !",
      sub: "Les Civils doivent le débusquer. Le Hors-Thème doit survivre.",
    },
    {
      emoji: "⚔️",
      title: "Modes de jeu",
      desc: "Classique (3 à 12 joueurs) : trouvez les imposteurs avant qu'il soit trop tard.\n\nMode Duel (2 joueurs) : même mot, deux dessins — comparez vos scores de ressemblance !",
      sub: "Créez une salle, partagez le code et c'est parti !",
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    // Fond semi-transparent derrière le modal
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "linear-gradient(145deg, #0f1a2e, #0c1524)",
          border: "1px solid rgba(255,213,45,0.25)",
          borderRadius: 20,
          padding: "32px 28px",
          maxWidth: 440,
          width: "100%",
          display: "grid",
          gap: 20,
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          animation: "fadeInUp 0.35s ease",
        }}
      >
        {/* Indicateur d'étapes */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 28 : 8,
                height: 8,
                borderRadius: 4,
                background: i === step ? "#ffd52d" : "rgba(255,255,255,0.2)",
                transition: "width 0.3s ease, background 0.3s ease",
              }}
            />
          ))}
        </div>

        {/* Contenu de l'étape */}
        <div style={{ textAlign: "center", display: "grid", gap: 14 }}>
          <div style={{ fontSize: 56 }}>{current.emoji}</div>
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              color: "#ffd52d",
              fontFamily: "'Luckiest Guy', sans-serif",
              letterSpacing: 0.5,
            }}
          >
            {current.title}
          </h2>
          <p style={{ margin: 0, color: "#eef2ff", fontSize: 15, lineHeight: 1.6, whiteSpace: "pre-line" }}>
            {current.desc}
          </p>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.5 }}>
            {current.sub}
          </p>
        </div>

        {/* Boutons de navigation */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 10,
                color: "#eef2ff",
                padding: "10px 20px",
                cursor: "pointer",
                fontSize: 14,
                fontFamily: "inherit",
              }}
            >
              ← Retour
            </button>
          )}
          <button
            onClick={() => {
              if (isLast) {
                onClose();
              } else {
                setStep((s) => s + 1);
              }
            }}
            style={{
              background: "#ffd52d",
              border: "none",
              borderRadius: 10,
              color: "#070c16",
              padding: "10px 28px",
              cursor: "pointer",
              fontSize: 15,
              fontFamily: "inherit",
              fontWeight: 700,
              flex: 1,
              maxWidth: 220,
            }}
          >
            {isLast ? "🚀 Jouer maintenant !" : "Suivant →"}
          </button>
        </div>

        {/* Lien pour passer l'onboarding */}
        {!isLast && (
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.35)",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
              textDecoration: "underline",
            }}
          >
            Passer l'introduction
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Onboarding : true = afficher le modal
  const [showOnboarding, setShowOnboarding] = useState(false);

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

    // Afficher l'onboarding uniquement si l'utilisateur ne l'a jamais vu
    const seen = localStorage.getItem("off-topic:onboarding-seen");
    if (!seen) {
      setShowOnboarding(true);
    }

    return () => cancelAnimationFrame(id);
  }, []);

  function closeOnboarding() {
    // On mémorise que l'utilisateur a vu l'onboarding pour ne plus le montrer
    localStorage.setItem("off-topic:onboarding-seen", "1");
    setShowOnboarding(false);
  }

  return (
    <>
      {/* Modal d'onboarding (visible uniquement à la première visite) */}
      {showOnboarding && <OnboardingModal onClose={closeOnboarding} />}

      <div className="home-hero" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
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

          {/* Tagline sous le logo */}
          <p
            style={{
              margin: "-36px 0 0",
              color: "rgba(255,255,255,0.55)",
              fontSize: 14,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              opacity: mounted ? 1 : 0,
              transition: "opacity 0.7s ease 0.2s",
            }}
          >
            Dessine. Trompe. Survive.
          </p>
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

          {/* Bouton "Comment jouer ?" discret en bas */}
          <div
            style={{
              justifySelf: "center",
              marginTop: 8,
              opacity: mounted ? 1 : 0,
              transition: "opacity 0.65s ease 0.3s",
            }}
          >
            <button
              onClick={() => setShowOnboarding(true)}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.4)",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
                textDecoration: "underline",
              }}
            >
              ❓ Comment jouer ?
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
