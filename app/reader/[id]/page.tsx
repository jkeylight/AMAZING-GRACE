"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Settings2 } from "lucide-react";
import EpubReader from "@/components/EpubReader";
import PdfReader from "@/components/PdfReader";

type Book = {
  id: string; title: string; author: string; format: "epub" | "pdf"; fileUrl: string;
};
type Settings = {
  theme: "light" | "sepia" | "dark";
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  pdfScale: number;
};

const defaultSettings: Settings = { theme: "dark", fontSize: 100, lineHeight: 1.6, fontFamily: "serif", pdfScale: 1.0 };

export default function ReaderPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [book, setBook] = useState<Book | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const saveTimer = useRef<any>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [bRes, sRes, stRes] = await Promise.all([
          fetch(`/api/books/${id}`, { cache: "no-store" }),
          fetch(`/api/books/${id}/state`, { cache: "no-store" }),
          fetch(`/api/settings`, { cache: "no-store" }),
        ]);
        const b = await bRes.json();
        if (!bRes.ok) throw new Error(b.error || "Book not found");
        setBook(b.book);
        if (sRes.ok) { const s = await sRes.json(); setLocation(s.state?.location ?? null); }
        if (stRes.ok) { const st = await stRes.json(); if (st.settings) setSettings({ ...defaultSettings, ...st.settings }); }
      } catch (e: any) {
        setError(e.message || "Failed to load reader");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function persistLocation(loc: string, progress: number) {
    if (!id) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch(`/api/books/${id}/state`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: loc, progress }),
      }).catch(() => {});
    }, 800);
  }

  async function updateSettings(patch: Partial<Settings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    }).catch(() => {});
  }

  const bg = settings.theme === "sepia" ? "#f4ecd8" : settings.theme === "light" ? "#ffffff" : "#0b0d11";

  if (loading) return <main className="min-h-screen flex items-center justify-center text-slate-400">Loading reader…</main>;
  if (error || !book) return <main className="min-h-screen flex items-center justify-center text-red-400 p-4">{error || "Book not found"}</main>;

  return (
    <main className="h-screen flex flex-col" style={{ background: bg }}>
      <header className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-800/60 bg-[#0f131a] text-slate-100 safe-top z-20">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/" className="p-2 -ml-1 rounded hover:bg-slate-800"><ArrowLeft className="w-4 h-4" /></Link>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate max-w-[45vw]">{book.title}</p>
            <p className="text-[11px] text-slate-400 truncate max-w-[45vw]">{book.author} · {book.format.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <a href={book.fileUrl} download className="p-2 rounded hover:bg-slate-800" title="Download"><Download className="w-4 h-4" /></a>
          <button onClick={() => setShowSettings((v) => !v)} className="p-2 rounded hover:bg-slate-800" title="Settings"><Settings2 className="w-4 h-4" /></button>
        </div>
      </header>

      {showSettings && (
        <div className="bg-[#141821] border-b border-slate-800 p-3 text-sm space-y-3 z-20">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 w-20">Theme</span>
            {(["light", "sepia", "dark"] as const).map((t) => (
              <button key={t} onClick={() => updateSettings({ theme: t })} className={`px-3 py-1 rounded capitalize ${settings.theme === t ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-200"}`}>{t}</button>
            ))}
          </div>
          {book.format === "epub" && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 w-20">Font size</span>
                <input type="range" min={80} max={160} value={settings.fontSize} onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })} />
                <span className="text-slate-300 w-12">{settings.fontSize}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 w-20">Line height</span>
                <input type="range" min={1.2} max={2.2} step={0.1} value={settings.lineHeight} onChange={(e) => updateSettings({ lineHeight: Number(e.target.value) })} />
                <span className="text-slate-300 w-12">{settings.lineHeight.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 w-20">Font</span>
                {(["serif", "sans", "mono"] as const).map((f) => (
                  <button key={f} onClick={() => updateSettings({ fontFamily: f })} className={`px-3 py-1 rounded capitalize ${settings.fontFamily === f ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-200"}`}>{f}</button>
                ))}
              </div>
            </>
          )}
          {book.format === "pdf" && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 w-20">Zoom</span>
              <input type="range" min={0.6} max={2} step={0.1} value={settings.pdfScale} onChange={(e) => updateSettings({ pdfScale: Number(e.target.value) })} />
              <span className="text-slate-300 w-12">{settings.pdfScale.toFixed(1)}x</span>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 min-h-0 relative">
        {book.format === "epub" ? (
          <EpubReader
            url={book.fileUrl}
            initialLocation={location}
            settings={{ theme: settings.theme, fontSize: settings.fontSize, lineHeight: settings.lineHeight, fontFamily: settings.fontFamily }}
            onLocationChange={persistLocation}
          />
        ) : (
          <PdfReader
            url={book.fileUrl}
            initialLocation={location}
            scale={settings.pdfScale}
            onLocationChange={persistLocation}
          />
        )}
      </div>
    </main>
  );
}
