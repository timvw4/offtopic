"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { WordCard } from "@/components/WordCard";
import { Player } from "@/lib/types";

// Ajoute un paramètre de version pour forcer le rechargement des nouvelles images.
const ASSET_VERSION = "v2";
const asset = (path: string) => `${path}?v=${ASSET_VERSION}`;

function mapPlayer(row: any): Player {
  return {
    id: row.id,
    nickname: row.nickname,
    role: row.role,
    hasUsedChameleonAccusation: row.has_used_chameleon_accusation ?? false,
    isEliminated: row.is_eliminated ?? false,
    isHost: row.is_host ?? false,
    isReady: row.is_ready ?? false,
    dictatorImmunityUsed: row.dictator_immunity_used ?? false,
    dictatorDoubleVoteActive: row.dictator_double_vote_active ?? false,
  };
}

function sortPlayers(list: Player[]) {
  return [...list].sort((a, b) => a.nickname.localeCompare(b.nickname));
}

// Conserve un ordre stable : on garde l'ordre précédent, on met à jour les données,
// et on ajoute les nouveaux joueurs à la fin (triés pour rester déterministes).
function mergePlayers(prev: Player[], incoming: Player[]) {
  const incomingMap = new Map(incoming.map((p) => [p.id, p]));
  const ordered: Player[] = [];

  // On conserve l'ordre existant pour les joueurs déjà connus
  for (const p of prev) {
    const fresh = incomingMap.get(p.id);
    if (fresh) {
      ordered.push(fresh);
      incomingMap.delete(p.id);
    }
  }

  // On ajoute les nouveaux joueurs (si arrivés pendant la partie), triés pour rester prévisible
  const remaining = sortPlayers([...incomingMap.values()]);
  return ordered.concat(remaining);
}

function mapPlayers(rows: any[]) {
  return (rows || []).map(mapPlayer);
}

export default function WordRevealPage() {
  const router = useRouter();
  const params = useParams<{ roomCode: string }>();
  const search = useSearchParams();
  const nickname = search.get("nickname") || "Guest";

  const [wordCivil, setWordCivil] = useState("");
  const [wordHorsTheme, setWordHorsTheme] = useState("");
  const [role, setRole] = useState("CIVIL");
  const [players, setPlayers] = useState<Player[]>([]);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [drawStartsAt, setDrawStartsAt] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [pendingReady, setPendingReady] = useState(false);
  const [isEliminated, setIsEliminated] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const wordSectionRef = useRef<HTMLDivElement | null>(null);

  // Charge données et subscriptions
  useEffect(() => {
    const room = params.roomCode;
    if (!room) return;
    let channel: ReturnType<typeof supabaseClient.channel> | null = null;
    let pollId: NodeJS.Timeout | null = null;
    let pollRound: NodeJS.Timeout | null = null;

    async function init() {
      const { data: round } = await supabaseClient
        .from("rounds")
        .select("id, word_civil, word_hors_theme, draw_starts_at, timer_seconds")
        .eq("room_code", room)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (round) {
        setWordCivil(round.word_civil);
        setWordHorsTheme(round.word_hors_theme);
        setRoundId(round.id);
        setDrawStartsAt(round.draw_starts_at);
        setTimerSeconds(round.timer_seconds ?? 60);
      }

      const { data: myRole } = await supabaseClient
        .from("players")
        .select("role, is_eliminated")
        .eq("room_code", room)
        .eq("nickname", nickname)
        .single();
      setRole(myRole?.role || "CIVIL");
      setIsEliminated(!!myRole?.is_eliminated);

      const { data: pData } = await supabaseClient.from("players").select("*").eq("room_code", room);
      setPlayers((prev) => mergePlayers(prev, mapPlayers(pData || [])));

      channel = supabaseClient
        .channel(`word:${room}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "players", filter: `room_code=eq.${room}` },
          () => {
            supabaseClient
              .from("players")
              .select("*")
              .eq("room_code", room)
              .then(({ data }) => setPlayers((prev) => mergePlayers(prev, mapPlayers(data || []))));
          },
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "rounds", filter: `room_code=eq.${room}` },
          ({ new: n }) => {
            setDrawStartsAt(n?.draw_starts_at ?? null);
            setTimerSeconds(n?.timer_seconds ?? 60);
          },
        )
        .subscribe();

      // Polling de secours toutes les 0.5s pour refléter les statuts Prêt si le realtime ne passe pas
      pollId = setInterval(() => {
        supabaseClient
          .from("players")
          .select("*")
          .eq("room_code", room)
          .then(({ data }) => setPlayers((prev) => mergePlayers(prev, mapPlayers(data || []))));
      }, 500);

      // Polling de secours (rapide) pour récupérer draw_starts_at si l'event rounds ne passe pas
      pollRound = setInterval(() => {
        supabaseClient
          .from("rounds")
          .select("draw_starts_at, timer_seconds")
          .eq("room_code", room)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()
          .then(({ data }) => {
            if (data) {
              setDrawStartsAt(data.draw_starts_at ?? null);
              setTimerSeconds(data.timer_seconds ?? 60);
            }
          });
      }, 500);

      // Les données initiales sont chargées (round + rôle)
      setDataLoaded(true);
    }

    void init();
    return () => {
      channel?.unsubscribe();
      if (pollId) clearInterval(pollId);
      if (pollRound) clearInterval(pollRound);
    };
  }, [nickname, params.roomCode]);

  // Dès l'arrivée sur la page, on se place directement sur la section "Mot secret"
  useEffect(() => {
    const id = setTimeout(() => {
      wordSectionRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
    }, 0); // laisse le temps au layout de se peindre
    return () => clearTimeout(id);
  }, []);

  // Si le contenu se charge plus tard (rôle/mot), on recentre encore
  useEffect(() => {
    if (!dataLoaded) return;
    wordSectionRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
  }, [dataLoaded]);

  // Tous prêts ? On ne compte que les joueurs non éliminés.
  const allReady = useMemo(() => {
    const alive = players.filter((p) => !p.isEliminated);
    return alive.length > 0 && alive.every((p) => p.isReady);
  }, [players]);

  const me = players.find((p) => p.nickname === nickname);

  // Quand tous prêts et pas encore de départ, un seul joueur (hôte) déclenche le départ (draw_starts_at)
  useEffect(() => {
    if (isEliminated) return; // spectateur
    const room = params.roomCode;
    if (!room || !roundId) return;
    if (!allReady || drawStartsAt) return;
    if (!me?.isHost) return;

    const start = new Date(Date.now() + 3000).toISOString(); // 3s de pré-compte
    supabaseClient
      .from("rounds")
      .update({ draw_starts_at: start, phase: "DRAW" })
      .eq("id", roundId)
      .then();
  }, [allReady, drawStartsAt, isEliminated, me?.isHost, params.roomCode, roundId]);

  // Dès qu'un départ est fixé, tout le monde va sur la page dessin (le compte à rebours s'y affichera)
  useEffect(() => {
    if (isEliminated) {
      router.replace(`/room/${params.roomCode}/reveal?nickname=${encodeURIComponent(nickname)}`);
      return;
    }
    if (drawStartsAt) {
      router.replace(
        `/room/${params.roomCode}/draw?nickname=${encodeURIComponent(nickname)}&timer=${timerSeconds}`,
      );
    }
  }, [drawStartsAt, isEliminated, nickname, params.roomCode, router, timerSeconds]);

  // Ne montre pas le mot tant que le round + rôle ne sont pas chargés
  // HORS_THEME et FANTOME_HT reçoivent le mot hors-thème (le Fantôme-HT ne sait pas qu'il a un mot différent)
  const displayedWord = dataLoaded ? (role === "HORS_THEME" || role === "FANTOME_HT" ? wordHorsTheme : wordCivil) : "...";

  // Le Hors-Thème est traité visuellement comme un Civil : il ne sait pas qu'il a un mot différent.
  // Le FANTOME_HT voit les infos Fantôme (il sait qu'il est Fantôme) mais reçoit le mot HT à son insu.
  // On utilise displayedRole pour tout ce qui est affiché (label, image, description).
  const displayedRole = role === "HORS_THEME" ? "CIVIL" : role === "FANTOME_HT" ? "FANTOME" : role;

  const roleLabel = !dataLoaded
    ? "..."
    : displayedRole === "CAMELEON"
      ? "Caméléon"
      : displayedRole === "DICTATOR"
        ? "Dictateur"
        : displayedRole === "FANTOME"
          ? "Fantôme"
          : "Civil"; // CIVIL et HORS_THEME affichent tous les deux "Civil"
  const roleDescription = !dataLoaded
    ? "Chargement..."
    : displayedRole === "CAMELEON"
      ? "Tu as le même mot que les civils et tu dois te faire passer pour un hors-thème et te faire éliminé pour gagner. attention tu ne dois pas te faire repérer par les autres joueurs."
      : displayedRole === "DICTATOR"
        ? "Tu joue comme un civil mais si une majorité vote contre toi la première fois, tu survis et ton prochain vote comptera double. La seconde fois, tu es éliminé."
        : displayedRole === "FANTOME"
          ? "Tu es un Fantôme : joue comme un civil et dessine le mot normalement. Mais si tu es éliminé, tu pourras continuer à voter depuis l'au-delà !"
          : "Tu es un civil : dessine le mot subtilement pour débusquer les Hors-Thème."; // CIVIL et HORS_THEME voient la même description
  const roleMedia =
    dataLoaded && displayedRole === "CAMELEON"
      ? { src: asset("/roles/chameleon.png"), alt: "Caméléon" }
      : dataLoaded && displayedRole === "DICTATOR"
        ? { src: asset("/roles/dictator.png"), alt: "Dictateur" }
        : dataLoaded && displayedRole === "FANTOME"
          ? { src: asset("/roles/ghost.png"), alt: "Fantôme" }
          : dataLoaded
            ? { src: asset("/roles/civil.png"), alt: "Civil" } // CIVIL et HORS_THEME voient l'image Civil
            : null;
  // Images et titres légèrement réduits pour Civil / Hors-Thème (plus lisible sur mobile)
  const roleImageSize = displayedRole === "CIVIL" ? 130 : 170;
  const roleImageStyle = {
    objectFit: "contain",
    filter: "drop-shadow(0 0 8px rgba(0,0,0,0.25))",
    marginTop: -10,
    marginBottom: displayedRole === "CIVIL" ? -12 : 0,
  } as const;
  const roleLabelMarginTop = displayedRole === "CIVIL" ? 0 : -30;

  return (
    <div ref={wordSectionRef} style={{ display: "grid", gap: 16 }}>
      <div
        className="card"
        style={{ display: "grid", gap: 6, textAlign: "center", alignItems: "center", justifyItems: "center" }}
      >
        {roleMedia && (
          <Image
            src={roleMedia.src}
            alt={roleMedia.alt}
            width={roleImageSize}
            height={roleImageSize}
            style={roleImageStyle}
          />
        )}
        <strong
          style={{
            marginTop: roleLabelMarginTop,
            marginBottom: 12,
            fontSize: role === "HORS_THEME" || role === "CIVIL" ? 22 : 26,
            lineHeight: 1.1,
            letterSpacing: 0.2,
          }}
        >
          {roleLabel}
        </strong>
        <p style={{ margin: 0 }}>{roleDescription}</p>
      </div>

      <div style={{ display: "grid", gap: 6, padding: "8px 0 14px 0" }}>
        <h2 style={{ textAlign: "center", margin: 0, fontSize: 18 }}>Ton mot secret</h2>
        <WordCard word={displayedWord} />
      </div>

      <div className="card" style={{ display: "grid", gap: 8, padding: 12 }}>
        <strong style={{ fontSize: 14, letterSpacing: 0.2, textAlign: "center" }}>Prêts</strong>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 4 }}>
          {players
            .filter((p) => !p.isEliminated) // les éliminés ne sont plus dans la liste des prêts
            .map((p) => (
            <li
              key={p.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 10px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span style={{ fontWeight: 600 }}>{p.nickname}</span>
              <span style={{ fontSize: 13 }}>{p.isReady ? "✏️" : "..."}</span>
            </li>
          ))}
        </ul>
      </div>

      {me?.isReady || pendingReady ? (
        <p style={{ margin: 0, textAlign: "left", color: "rgba(255,255,255,0.8)" }}>En attente des autres joueurs…</p>
      ) : (
        <button
          className="btn btn-compact"
          onClick={async () => {
            setPendingReady(true);
            // Optimiste : on marque prêt localement pour désactiver le bouton tout de suite (ordre conservé)
            setPlayers((prev) =>
              mergePlayers(
                prev,
                prev.map((p) => (p.nickname === nickname ? { ...p, isReady: true } : p)),
              ),
            );
            await supabaseClient
              .from("players")
              .update({ is_ready: true })
              .eq("room_code", params.roomCode)
              .eq("nickname", nickname);
          // Rafraîchit la liste au cas où l'événement Realtime tarderait
          const { data } = await supabaseClient.from("players").select("*").eq("room_code", params.roomCode);
          setPlayers((prev) => mergePlayers(prev, mapPlayers(data || [])));
          }}
        >
          Prêt
        </button>
      )}
      {drawStartsAt && <p>Départ imminent…</p>}
    </div>
  );
}
