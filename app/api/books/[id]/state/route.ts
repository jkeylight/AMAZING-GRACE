import { NextResponse } from "next/server";
import { getReadingState, upsertReadingState } from "@/lib/books";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const state = await getReadingState(params.id);
    return NextResponse.json({ state });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to get state" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const location = String(body.location ?? "");
    const progress = Math.max(0, Math.min(1, Number(body.progress ?? 0)));
    await upsertReadingState(params.id, location, progress);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to save state" }, { status: 500 });
  }
}
