import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { assertTransition } from "@/lib/stateMachine";

export async function POST(request: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Service key manquant" }, { status: 500 });
  const { roomCode } = await request.json();
  if (!roomCode) return NextResponse.json({ error: "roomCode manquant" }, { status: 400 });

  const { data: room } = await supabaseAdmin.from("rooms").select("current_phase").eq("code", roomCode).single();
  assertTransition(room?.current_phase || "WORD", "VOTE");

  // Pour un revote, on purge les votes existants du dernier round afin d'éviter un passage immédiat en RESULTS.
  const { data: round } = await supabaseAdmin
    .from("rounds")
    .select("id")
    .eq("room_code", roomCode)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (round?.id) {
    await supabaseAdmin.from("votes").delete().eq("round_id", round.id);
  }

  const { error } = await supabaseAdmin.from("rooms").update({ current_phase: "VOTE" }).eq("code", roomCode);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
