import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Service key manquant" }, { status: 500 });
  }

  const { roomCode, playerNickname, guessedWord } = await request.json();

  if (!roomCode || !playerNickname || !guessedWord) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  // 1. Récupère le round en cours
  const { data: round } = await supabaseAdmin
    .from("rounds")
    .select("id, word_civil, word_hors_theme")
    .eq("room_code", roomCode)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!round) {
    return NextResponse.json({ error: "Round introuvable" }, { status: 404 });
  }

  // 2. Récupère le rôle du joueur qui devine
  const { data: player } = await supabaseAdmin
    .from("players")
    .select("role")
    .eq("room_code", roomCode)
    .eq("nickname", playerNickname)
    .single();

  if (!player) {
    return NextResponse.json({ error: "Joueur introuvable" }, { status: 404 });
  }

  // 3. Le mot à deviner est celui de L'AUTRE joueur :
  //    - Si je suis CIVIL, je dois deviner le mot du HORS_THEME (word_hors_theme)
  //    - Si je suis HORS_THEME, je dois deviner le mot du CIVIL (word_civil)
  const correctWord =
    player.role === "CIVIL" ? round.word_hors_theme : round.word_civil;

  // Comparaison insensible à la casse et aux espaces en bordure
  const isCorrect =
    guessedWord.trim().toLowerCase() === correctWord.trim().toLowerCase();

  // 4. Insère la devinette (ou met à jour si le joueur renvoyait)
  const { error: insertError } = await supabaseAdmin
    .from("duel_guesses")
    .upsert(
      {
        room_code: roomCode,
        round_id: round.id,
        player_nickname: playerNickname,
        guessed_word: guessedWord.trim(),
        is_correct: isCorrect,
      },
      { onConflict: "round_id,player_nickname" },
    );

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // 5. Vérifie si les 2 joueurs ont deviné
  const { data: guesses } = await supabaseAdmin
    .from("duel_guesses")
    .select("player_nickname, is_correct")
    .eq("round_id", round.id);

  const bothGuessed = (guesses?.length ?? 0) >= 2;

  // 6. Si les 2 ont soumis → passe la phase à RESULTS
  if (bothGuessed) {
    await supabaseAdmin
      .from("rooms")
      .update({ current_phase: "RESULTS" })
      .eq("code", roomCode);
  }

  return NextResponse.json({ ok: true, isCorrect, bothGuessed });
}
