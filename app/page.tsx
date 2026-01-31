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
      const { data } = await supabaseClient.from("rooms").select("code, current_phase").eq("code", code).maybeSingle();
      if (!data) {
        setError("Code de salle invalide ou inexistant.");
        return;
      }
      if (data.current_phase && data.current_phase !== "LOBBY") {
        setError("Partie déjà en cours, impossible de rejoindre.");
        return;
      }
      router.push(`/room/${code}?nickname=${encodeURIComponent(nickname.trim())}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        padding: "4px 8px 8px",
        maxWidth: 960,
        margin: "0 auto",
        minHeight: "calc(100vh - 120px)",
        alignContent: "start",
      }}
    >
      <div style={{ display: "grid", gap: 10, textAlign: "center", marginTop: -12 }}>
        <div style={{ justifySelf: "center", width: "100%", maxWidth: 200, marginBottom: 48 }}>
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
          marginTop: -24,
          alignSelf: "center",
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
  );
}
