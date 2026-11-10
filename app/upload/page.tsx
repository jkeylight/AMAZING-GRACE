"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { ArrowLeft, UploadCloud } from "lucide-react";
import JSZip from "jszip";

type Meta = { title: string; author: string; coverBlob: Blob | null };

async function extractEpubMeta(file: File): Promise<Meta> {
  try {
    const zip = await JSZip.loadAsync(file);
    const containerXml = await zip.file("META-INF/container.xml")?.async("text");
    if (!containerXml) throw new Error("No container");
    const parser = new DOMParser();
    const containerDoc = parser.parseFromString(containerXml, "application/xml");
    const opfPath = containerDoc.querySelector("rootfile")?.getAttribute("full-path") || "";
    if (!opfPath) throw new Error("No opf");
    const opfText = await zip.file(opfPath)?.async("text");
    if (!opfText) throw new Error("No opf text");
    const opfDoc = parser.parseFromString(opfText, "application/xml");
    const title = opfDoc.querySelector("title, dc\\:title")?.textContent?.trim() || file.name.replace(/\.epub$/i, "");
    const author = opfDoc.querySelector("creator, dc\\:creator")?.textContent?.trim() || "Unknown";
    let coverBlob: Blob | null = null;
    const metaCover = Array.from(opfDoc.querySelectorAll("meta")).find((m) => m.getAttribute("name") === "cover")?.getAttribute("content");
    let coverHref = "";
    if (metaCover) {
      coverHref = opfDoc.querySelector(`item[id="${metaCover}"]`)?.getAttribute("href") || "";
    }
    if (!coverHref) {
      coverHref = opfDoc.querySelector('item[properties~="cover-image"]')?.getAttribute("href") || "";
    }
    if (coverHref) {
      const base = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";
      const coverPath = (base + coverHref).replace(/\\/g, "/");
      const coverFile = zip.file(coverPath) || zip.file(coverHref);
      if (coverFile) {
        const buf = await coverFile.async("uint8array");
        const lower = coverPath.toLowerCase();
        const type = lower.endsWith(".png") ? "image/png" : lower.endsWith(".webp") ? "image/webp" : "image/jpeg";
        const bytes = new Uint8Array(buf);
        coverBlob = new Blob([bytes.buffer as ArrayBuffer], { type });
      }
    }
    return { title, author, coverBlob };
  } catch {
    return { title: file.name.replace(/\.epub$/i, ""), author: "Unknown", coverBlob: null };
  }
}

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleUpload() {
    if (!files.length) return;
    setBusy(true);
    setError("");
    let done = 0;
    try {
      for (const file of files) {
        const lower = file.name.toLowerCase();
        const isEpub = lower.endsWith(".epub");
        const isPdf = lower.endsWith(".pdf");
        if (!isEpub && !isPdf) continue;
        setStatus(`Uploading ${file.name}...`);

        const format = isEpub ? "epub" : "pdf";
        const fileBlob = await upload(`books/${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
          contentType: file.type || (isEpub ? "application/epub+zip" : "application/pdf"),
        });

        let title = file.name.replace(/\.(epub|pdf)$/i, "");
        let author = "Unknown";
        let coverUrl: string | null = null;
        let coverPathname: string | null = null;

        if (isEpub) {
          const meta = await extractEpubMeta(file);
          title = meta.title || title;
          author = meta.author || author;
          if (meta.coverBlob) {
            const ext = meta.coverBlob.type === "image/png" ? "png" : meta.coverBlob.type === "image/webp" ? "webp" : "jpg";
            const coverFile = new File([meta.coverBlob], `${title}-cover.${ext}`, { type: meta.coverBlob.type });
            const coverBlob = await upload(`covers/${coverFile.name}`, coverFile, {
              access: "public",
              handleUploadUrl: "/api/upload",
              contentType: meta.coverBlob.type,
            });
            coverUrl = coverBlob.url;
            coverPathname = coverBlob.pathname;
          }
        }

        const res = await fetch("/api/books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            author,
            format,
            fileUrl: fileBlob.url,
            filePathname: fileBlob.pathname,
            coverUrl,
            coverPathname,
            fileSize: file.size,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Failed to save ${file.name}`);
        }
        done++;
      }
      setStatus(`Uploaded ${done} book(s).`);
      setTimeout(() => router.push("/"), 600);
    } catch (e: any) {
      setError(e.message || "Upload failed");
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen max-w-xl mx-auto p-4 safe-top safe-bottom">
      <header className="flex items-center gap-3 mb-6 pt-2">
        <Link href="/" className="p-2 -ml-2 rounded-lg hover:bg-slate-800 text-slate-300"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-xl font-semibold">Upload books</h1>
          <p className="text-xs text-slate-400">EPUB and PDF supported</p>
        </div>
      </header>

      <div className="bg-[#141821] border border-slate-800 rounded-2xl p-4 space-y-4">
        <label className="block border-2 border-dashed border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500/60">
          <UploadCloud className="w-8 h-8 mx-auto text-slate-400 mb-2" />
          <span className="text-sm text-slate-200 block">Tap to choose files</span>
          <span className="text-xs text-slate-500">Select one or more .epub / .pdf files</span>
          <input
            type="file"
            accept=".epub,.pdf,application/epub+zip,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
          />
        </label>

        {files.length > 0 && (
          <ul className="text-sm text-slate-300 space-y-1 max-h-48 overflow-auto">
            {files.map((f) => (
              <li key={f.name} className="truncate">• {f.name} <span className="text-slate-500">({(f.size / 1024 / 1024).toFixed(2)} MB)</span></li>
            ))}
          </ul>
        )}

        {status && <p className="text-sm text-indigo-300">{status}</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={handleUpload}
          disabled={busy || files.length === 0}
          className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2.5"
        >
          {busy ? "Uploading..." : `Upload ${files.length || ""} file${files.length === 1 ? "" : "s"}`}
        </button>
      </div>

      <p className="text-xs text-slate-500 mt-4">Requires <code>BLOB_READ_WRITE_TOKEN</code> and <code>DATABASE_URL</code> configured. EPUB title/author/cover are auto-extracted when available.</p>
    </main>
  );
}
