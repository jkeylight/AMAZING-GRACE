import { NextResponse } from "next/server";
import { getReaderSettings, updateReaderSettings } from "@/lib/books";

export async function GET() {
  try {
    const settings = await getReaderSettings();
    return NextResponse.json({ settings });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to get settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    await updateReaderSettings({
      theme: body.theme,
      fontSize: body.fontSize,
      lineHeight: body.lineHeight,
      fontFamily: body.fontFamily,
      pdfScale: body.pdfScale,
    });
    const settings = await getReaderSettings();
    return NextResponse.json({ settings });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to update settings" }, { status: 500 });
  }
}
