"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

// Représente une devinette soumise par un joueur
interface DuelGuess {
  player_nickname: string;
  guessed_word: string;
  is_correct: boolean;
}

export default function GuessPage() {
  const params = useParams<{ roomCode: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const nickname = search.get("nickname") || "Guest";

  // Le dessin de l'AUTRE joueur (pas le sien)
  const [otherDrawing, setOtherDrawing] = useState<{ nickname: string; data_url: string } | null>(null);

  // Champ de saisie de la devinette
  const [guess, setGuess] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Liste des devinettes soumises (mise à jour par poll)
  const [guesses, setGuesses] = useState<DuelGuess[]>([]);

  // Référence vers la poll agressive lancée après la soumission du 1er joueur
  const aggressivePollRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Fonction de chargement des devinettes ───────────────────────────────
  // Définie avec useCallback pour pouvoir l'appeler depuis useEffect ET handleSubmit.
  const loadGuesses = useCallback(() => {
    supabaseClient
      .from("duel_guesses")
      .select("player_nickname, guessed_word, is_correct")
      .eq("room_code", params.roomCode)
      .then(({ data }) => setGuesses((data as DuelGuess[]) || []));
  }, [params.roomCode]);

  // ─── Chargement initial + poll permanente ────────────────────────────────
  useEffect(() => {
    const room = params.roomCode;

    // Charge le dessin de l'autre joueur
    supabaseClient
      .from("drawings")
      .select("nickname, data_url")
      .eq("room_code", room)
      .then(({ data }) => {
        const other = (data || []).find((d) => d.nickname !== nickname);
        setOtherDrawing(other ?? null);
      });

    // Charge les devinettes au montage
    loadGuesses();

    // Poll permanente toutes les 1,5s (toujours active, pas seulement en fallback).
    // Le Realtime sur duel_guesses n'est pas fiable si la table n'est pas dans la
    // publication Realtime de Supabase, donc on s'appuie sur le polling.
    const poll = setInterval(loadGuesses, 1500);

    // Realtime sur rooms : si la phase passe à RESULTS (déclenché par l'API),
    // on redirige. C'est un filet de sécurité supplémentaire.
    const channel = supabaseClient
      .channel(`guess-room:${room}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `code=eq.${room}` },
        (payload) => {
          if (payload.new?.current_phase === "RESULTS") {
            router.replace(`/room/${room}/results?nickname=${encodeURIComponent(nickname)}`);
          }
        },
      )
      .subscribe();

    return () => {
      clearInterval(poll);
      // Arrête aussi la poll agressive si le composant est démonté
      if (aggressivePollRef.current) clearInterval(aggressivePollRef.current);
      channel.unsubscribe();
    };
  }, [nickname, params.roomCode, loadGuesses, router]);

  // ─── Redirection dès que les 2 devinettes sont soumises ─────────────────
  // Ce useEffect se déclenche chaque fois que guesses se met à jour (via poll).
  useEffect(() => {
    if (guesses.length >= 2) {
      // Arrête la poll agressive si elle tournait encore
      if (aggressivePollRef.current) {
        clearInterval(aggressivePollRef.current);
        aggressivePollRef.current = null;
      }
      router.replace(`/room/${params.roomCode}/results?nickname=${encodeURIComponent(nickname)}`);
    }
  }, [guesses.length, nickname, params.roomCode, router]);

  // ─── Valeurs dérivées ────────────────────────────────────────────────────
  const submittedCount = guesses.length;
  const iHaveSubmitted = submitted || guesses.some((g) => g.player_nickname === nickname);

  // Pseudo et statut de soumission de l'autre joueur
  const otherNickname = otherDrawing?.nickname ?? null;
  const otherHasSubmitted = otherNickname
    ? guesses.some((g) => g.player_nickname === otherNickname)
    : submittedCount >= 2; // fallback si le dessin n'est pas encore chargé

  // ─── Soumission de la devinette ──────────────────────────────────────────
  async function handleSubmit() {
    if (!guess.trim() || submitting || iHaveSubmitted) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/duel/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode: params.roomCode,
          playerNickname: nickname,
          guessedWord: guess.trim(),
        }),
      });
      const data = await res.json();
      setSubmitted(true);

      // Si on est le 2ème joueur à soumettre, l'API retourne bothGuessed: true.
      // On redirige immédiatement sans attendre la poll.
      if (data.bothGuessed) {
        if (aggressivePollRef.current) clearInterval(aggressivePollRef.current);
        router.replace(`/room/${params.roomCode}/results?nickname=${encodeURIComponent(nickname)}`);
        return;
      }

      // Si on est le 1er joueur à soumettre, on lance une poll agressive (500ms)
      // pour détecter dès que l'autre joueur répond, sans attendre la poll normale (1500ms).
      if (!aggressivePollRef.current) {
        aggressivePollRef.current = setInterval(loadGuesses, 500);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* En-tête */}
      <div style={{ display: "grid", gap: 4 }}>
        <h2 style={{ margin: 0 }}>⚔️ Mode Duel — Devine le mot !</h2>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.65)", fontSize: 14 }}>
          Regarde le dessin de l&apos;autre joueur et trouve le mot qu&apos;il a dessiné.
        </p>
      </div>

      {/* Dessin de l'autre joueur */}
      <div className="card" style={{ display: "grid", gap: 10 }}>
        <strong style={{ fontSize: 14, textAlign: "center" }}>
          Dessin de{" "}
          <span style={{ color: "#facc15" }}>
            {otherDrawing ? otherDrawing.nickname : "l'autre joueur"}
          </span>
        </strong>
        {otherDrawing ? (
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 340,
              aspectRatio: "1 / 1",
              margin: "0 auto",
              borderRadius: 12,
              overflow: "hidden",
              background: "#ffffff",
              boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
            }}
          >
            <Image
              src={otherDrawing.data_url}
              alt={`Dessin de ${otherDrawing.nickname}`}
              fill
              sizes="340px"
              style={{ objectFit: "contain", background: "#ffffff" }}
            />
          </div>
        ) : (
          <div
            style={{
              width: "100%",
              maxWidth: 340,
              aspectRatio: "1 / 1",
              margin: "0 auto",
              borderRadius: 12,
              background: "rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            Chargement…
          </div>
        )}
      </div>

      {/* Champ de devinette */}
      {!iHaveSubmitted ? (
        <div className="card" style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Quel est le mot dessiné ?</span>
            <input
              ref={inputRef}
              className="input"
              placeholder="Tape ton mot ici…"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              autoFocus
              disabled={iHaveSubmitted}
            />
          </label>
          <button
            className="btn"
            onClick={handleSubmit}
            disabled={!guess.trim() || submitting || iHaveSubmitted}
            style={{ opacity: !guess.trim() || submitting ? 0.5 : 1 }}
          >
            {submitting ? "Envoi…" : "Valider ma réponse"}
          </button>
        </div>
      ) : (
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "20px 16px",
            border: "1.5px solid rgba(250,204,21,0.4)",
            background: "rgba(250,204,21,0.06)",
          }}
        >
          <span style={{ fontSize: 28 }}>✅</span>
          <p style={{ margin: "8px 0 0", fontWeight: 600 }}>Réponse envoyée !</p>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
            En attente de l&apos;autre joueur…
          </p>
        </div>
      )}

      {/* Statut des devinettes */}
      <div className="card" style={{ display: "grid", gap: 8 }}>
        <strong style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Statut des devinettes</strong>

        {/* Ligne : joueur courant */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: iHaveSubmitted ? "#22c55e" : "rgba(255,255,255,0.3)",
              transition: "background 0.3s ease",
            }}
          />
          <span style={{ fontSize: 14 }}>
            <span style={{ color: "#facc15", fontWeight: 600 }}>{nickname}</span>
            {" "}— {iHaveSubmitted ? "✓ répondu" : "en attente…"}
          </span>
        </div>

        {/* Ligne : autre joueur (avec son vrai pseudo) */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: otherHasSubmitted ? "#22c55e" : "rgba(255,255,255,0.3)",
              transition: "background 0.3s ease",
            }}
          />
          <span style={{ fontSize: 14 }}>
            <span style={{ color: "#facc15", fontWeight: 600 }}>
              {otherNickname ?? "Autre joueur"}
            </span>
            {" "}— {otherHasSubmitted ? "✓ répondu" : "en attente…"}
          </span>
        </div>

        {submittedCount >= 2 && (
          <p style={{ margin: "4px 0 0", color: "#facc15", fontWeight: 600, fontSize: 13 }}>
            Les deux ont répondu ! Résultats en cours…
          </p>
        )}
      </div>
    </div>
  );
}
