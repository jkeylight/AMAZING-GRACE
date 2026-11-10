import { NextResponse } from "next/server";
import { createBook, listBooks } from "@/lib/books";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || undefined;
  try {
    const data = await listBooks(q);
    return NextResponse.json({ books: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to list books" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, author, format, fileUrl, filePathname, coverUrl, coverPathname, fileSize } = body;
    if (!title || !format || !fileUrl || !filePathname) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (format !== "epub" && format !== "pdf") {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }
    const book = await createBook({
      title,
      author: author || "Unknown",
      format,
      fileUrl,
      filePathname,
      coverUrl: coverUrl || null,
      coverPathname: coverPathname || null,
      fileSize: Number(fileSize || 0),
    });
    return NextResponse.json({ book }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to create book" }, { status: 500 });
  }
}
