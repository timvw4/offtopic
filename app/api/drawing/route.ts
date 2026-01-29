import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Service key manquant" }, { status: 500 });
  const { roomCode, nickname, dataUrl } = await request.json();
  await supabaseAdmin.from("drawings").upsert({ room_code: roomCode, nickname, data_url: dataUrl });
  return NextResponse.json({ ok: true });
}
