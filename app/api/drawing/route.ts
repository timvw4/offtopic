import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Service key manquant" }, { status: 500 });

  const { roomCode, nickname, dataUrl } = await request.json();

  // ─── Upload vers Supabase Storage ────────────────────────────────────────
  //
  // Avant : on stockait le base64 entier (~150 Ko de texte) directement en DB.
  // Maintenant : on convertit en PNG binaire, on l'upload dans le bucket
  // "drawings", et on ne stocke en DB que l'URL courte (~80 caractères).
  //
  // Gain : ~1000× moins de données en DB, lectures/Realtime ultra-légères.

  // Nettoie le préfixe "data:image/png;base64," pour récupérer le base64 brut
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  // Chemin dans le bucket : drawings/{roomCode}/{nickname}.png
  // Le nickname est sanitisé pour éviter les caractères interdits dans les chemins.
  const safeName = nickname.replace(/[^a-zA-Z0-9_\-]/g, "_");
  const storagePath = `${roomCode}/${safeName}.png`;

  // Upload du fichier PNG (upsert = écrase si le joueur re-soumet son dessin)
  const { error: uploadError } = await supabaseAdmin.storage
    .from("drawings")
    .upload(storagePath, buffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadError) {
    console.error("[drawing] Erreur upload Storage:", uploadError.message);
    return NextResponse.json({ error: "Erreur upload Storage" }, { status: 500 });
  }

  // Récupère l'URL publique permanente du fichier
  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from("drawings").getPublicUrl(storagePath);

  // On ajoute un paramètre ?v=timestamp à l'URL pour éviter le cache du navigateur.
  // Sans ça, le navigateur garde l'ancien dessin car l'URL du fichier Storage
  // est identique d'une partie à l'autre (même room, même joueur).
  const cacheBustUrl = `${publicUrl}?v=${Date.now()}`;

  // Enregistre l'URL (avec anti-cache) dans la table drawings
  const { error: dbError } = await supabaseAdmin
    .from("drawings")
    .upsert({ room_code: roomCode, nickname, data_url: cacheBustUrl });

  if (dbError) {
    console.error("[drawing] Erreur upsert DB:", dbError.message);
    return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
