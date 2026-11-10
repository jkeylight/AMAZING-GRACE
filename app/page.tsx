"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Download, LogOut, Plus, Search, Trash2 } from "lucide-react";

type Book = {
  id: string;
  title: string;
  author: string;
  format: "epub" | "pdf";
  fileUrl: string;
  coverUrl: string | null;
  lastOpenedAt: string | null;
  addedAt: string;
};

export default function LibraryPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(q?: string) {
    setLoading(true);
    setError("");
    try {
      const url = q ? `/api/books?q=${encodeURIComponent(q)}` : "/api/books";
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load books");
      setBooks(data.books || []);
    } catch (e: any) {
      setError(e.message || "Failed to load books");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const continueBook = useMemo(() => books.find((b) => b.lastOpenedAt) || books[0], [books]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this book and its files?")) return;
    const res = await fetch(`/api/books/${id}`, { method: "DELETE" });
    if (res.ok) setBooks((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <main className="min-h-screen max-w-xl mx-auto p-4 pb-24 safe-top safe-bottom">
      <header className="flex items-start justify-between gap-3 pt-2 mb-4">
        <div>
          <h1 className="text-2xl font-bold">My Library</h1>
          <p className="text-xs text-slate-400">{books.length} book{books.length === 1 ? "" : "s"} · EPUB + PDF</p>
        </div>
        <button onClick={logout} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800" title="Logout">
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      <div className="relative mb-4">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title or author..."
          className="w-full bg-[#141821] border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-indigo-500"
        />
      </div>

      {continueBook && !loading && !query && (
        <Link href={`/reader/${continueBook.id}`} className="block mb-5 bg-gradient-to-r from-indigo-600/30 to-violet-600/20 border border-indigo-500/30 rounded-2xl p-4">
          <p className="text-xs text-indigo-300 mb-1">Continue reading</p>
          <p className="font-semibold line-clamp-1">{continueBook.title}</p>
          <p className="text-sm text-slate-300 line-clamp-1">{continueBook.author}</p>
        </Link>
      )}

      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
      {loading && <p className="text-sm text-slate-400">Loading library...</p>}
      {!loading && books.length === 0 && !error && (
        <div className="text-center text-slate-400 py-16 border border-dashed border-slate-800 rounded-2xl">
          <p className="mb-2">No books yet</p>
          <Link href="/upload" className="text-indigo-400 underline">Upload your first EPUB or PDF</Link>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3">
        {books.map((book) => (
          <article key={book.id} className="bg-[#141821] border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
            <div className="aspect-[2/3] bg-slate-900">
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs uppercase tracking-wide p-3 text-center">
                  {book.format} · No cover
                </div>
              )}
            </div>
            <div className="p-3 flex-1 flex flex-col">
              <h2 className="text-sm font-semibold line-clamp-2 leading-snug">{book.title}</h2>
              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{book.author}</p>
              <span className="mt-2 inline-flex w-fit text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-slate-800 text-slate-300">{book.format}</span>
              <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-2">
                <Link href={`/reader/${book.id}`} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium py-2 px-2">
                  <BookOpen className="w-3.5 h-3.5" /> Read
                </Link>
                <a href={book.fileUrl} download className="inline-flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 p-2" title="Download">
                  <Download className="w-3.5 h-3.5" />
                </a>
                <button onClick={() => remove(book.id)} className="inline-flex items-center justify-center rounded-lg bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-red-300 p-2" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <Link href="/upload" className="fixed right-4 bottom-4 safe-bottom inline-flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 shadow-lg font-medium">
        <Plus className="w-4 h-4" /> Upload
      </Link>
    </main>
  );
}
