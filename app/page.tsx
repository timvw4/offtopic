"use client";

import { useEffect, useState } from "react";
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
  const [generatedRoom, setGeneratedRoom] = useState<string>("-----");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === "create") {
      setGeneratedRoom(generateRoomCode());
    }
  }, [mode]);

  const ready =
    (mode === "create" && nickname.length >= 2) ||
    (mode === "join" && nickname.length >= 2 && roomCode.length >= 3);

  async function handleContinue() {
    if (!mode) return;
    setError(null);
    if (!ready) return;

    if (mode === "create") {
      router.push(`/room/${generatedRoom}?nickname=${encodeURIComponent(nickname || "Hôte")}`);
      return;
    }

    // Join: vérifier que la salle existe
    try {
      setLoading(true);
      const { data } = await supabaseClient.from("rooms").select("code, current_phase").eq("code", roomCode).maybeSingle();
      if (!data) {
        setError("Code de salle invalide ou inexistant.");
        return;
      }
      if (data.current_phase && data.current_phase !== "LOBBY") {
        setError("Partie déjà en cours, impossible de rejoindre.");
        return;
      }
      router.push(`/room/${roomCode}?nickname=${encodeURIComponent(nickname)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="card"
      style={{ display: "grid", gap: 24, textAlign: "center", justifyItems: "center", padding: 24 }}
    >
      <div>
        <h1 style={{ margin: 0 }}>OFF-TOPIC</h1>
        <p style={{ marginTop: 8 }}>Dessine. Devine. Dénonce… ou fais-toi démasquer.</p>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button className="btn" onClick={() => setMode("create")}>
          Créer une partie
        </button>
        <button className="btn" onClick={() => setMode("join")}>
          Rejoindre une partie
        </button>
      </div>

      {mode && (
        <div style={{ display: "grid", gap: 10, width: "100%", maxWidth: 420 }}>
          <input
            className="input"
            placeholder="Ton pseudo"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />

          {mode === "join" && (
            <input
              className="input"
              placeholder="Code de salle (ex: ABC123)"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            />
          )}

          {mode === "create" && <p>Code généré : {generatedRoom}</p>}
          {error && <p style={{ color: "#f87171" }}>{error}</p>}

          <button
            className="btn"
            disabled={!ready || loading}
            style={{ opacity: !ready || loading ? 0.5 : 1 }}
            onClick={handleContinue}
          >
            {loading ? "Vérification..." : "Continuer"}
          </button>
        </div>
      )}
      <Link href="/rules" className="btn" style={{ marginTop: 8 }}>
        Règles
      </Link>
    </div>
  );
}
