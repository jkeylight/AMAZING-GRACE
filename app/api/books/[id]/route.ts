import { NextResponse } from "next/server";
import { deleteBook, getBook, updateBook } from "@/lib/books";
import { deleteFromBlob } from "@/lib/storage";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const book = await getBook(params.id);
    if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ book });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to get book" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const book = await updateBook(params.id, {
      title: body.title,
      author: body.author,
    });
    if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ book });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to update book" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const book = await deleteBook(params.id);
    if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await Promise.all([
      deleteFromBlob(book.filePathname || book.fileUrl),
      deleteFromBlob(book.coverPathname || book.coverUrl),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to delete book" }, { status: 500 });
  }
}
