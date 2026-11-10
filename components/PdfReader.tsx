"use client";

import { useEffect, useMemo, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfReader({
  url,
  initialLocation,
  scale,
  onLocationChange,
}: {
  url: string;
  initialLocation?: string | null;
  scale: number;
  onLocationChange: (location: string, progress: number) => void;
}) {
  const initialPage = useMemo(() => {
    const n = parseInt(initialLocation || "1", 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [initialLocation]);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [width, setWidth] = useState<number>(Math.min(typeof window !== "undefined" ? window.innerWidth - 24 : 600, 900));

  useEffect(() => {
    function onResize() { setWidth(Math.min(window.innerWidth - 24, 900)); }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => { setPage(initialPage); }, [initialPage]);

  function report(p: number, total: number) {
    const progress = total > 0 ? p / total : 0;
    onLocationChange(String(p), progress);
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-800 bg-[#0f131a] text-sm">
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded bg-slate-800 disabled:opacity-40" disabled={page <= 1} onClick={() => { const p = Math.max(1, page - 1); setPage(p); report(p, numPages); }}>Prev</button>
          <button className="px-3 py-1.5 rounded bg-slate-800 disabled:opacity-40" disabled={numPages > 0 && page >= numPages} onClick={() => { const p = numPages ? Math.min(numPages, page + 1) : page + 1; setPage(p); report(p, numPages); }}>Next</button>
        </div>
        <div className="text-slate-300">{numPages ? `Page ${page} / ${numPages}` : "Loading PDF..."}</div>
      </div>
      <div className="flex-1 overflow-auto flex justify-center p-3 bg-[#0b0d11]">
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => { setNumPages(numPages); report(Math.min(page, numPages), numPages); }}
          loading={<p className="text-slate-400 p-4">Loading PDF…</p>}
          error={<p className="text-red-400 p-4">Failed to load PDF.</p>}
        >
          <Page pageNumber={page} width={width} scale={scale} renderTextLayer={true} renderAnnotationLayer={true} />
        </Document>
      </div>
    </div>
  );
}
