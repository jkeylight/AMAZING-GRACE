"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Rendition } from "epubjs";

const ReactReader = dynamic(() => import("react-reader").then((m) => m.ReactReader), { ssr: false });

type Settings = {
  theme: "light" | "sepia" | "dark";
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
};

export default function EpubReader({
  url,
  initialLocation,
  settings,
  onLocationChange,
}: {
  url: string;
  initialLocation?: string | null;
  settings: Settings;
  onLocationChange: (location: string, progress: number) => void;
}) {
  const [location, setLocation] = useState<string | number>(initialLocation || 0);
  const renditionRef = useRef<Rendition | null>(null);
  const tocRef = useRef<any[]>([]);

  useEffect(() => {
    if (initialLocation) setLocation(initialLocation);
  }, [initialLocation]);

  function applyTheme(rendition: Rendition, s: Settings) {
    const themes: Record<string, any> = {
      light: { body: { background: "#ffffff", color: "#111827" } },
      sepia: { body: { background: "#f4ecd8", color: "#5b4636" } },
      dark: { body: { background: "#0b0d11", color: "#e5e7eb" } },
    };
    rendition.themes.register("light", themes.light);
    rendition.themes.register("sepia", themes.sepia);
    rendition.themes.register("dark", themes.dark);
    rendition.themes.select(s.theme);
    rendition.themes.fontSize(`${s.fontSize}%`);
    rendition.themes.override("line-height", String(s.lineHeight));
    const font = s.fontFamily === "sans" ? "ui-sans-serif, system-ui, sans-serif" : s.fontFamily === "mono" ? "ui-monospace, monospace" : "Georgia, serif";
    rendition.themes.override("font-family", font);
  }

  useEffect(() => {
    if (renditionRef.current) applyTheme(renditionRef.current, settings);
  }, [settings]);

  return (
    <div className="h-full w-full">
      <ReactReader
        url={url}
        location={location}
        locationChanged={(epubcifi: string) => {
          setLocation(epubcifi);
          let progress = 0;
          try {
            const rendition = renditionRef.current as any;
            if (rendition?.book?.locations?.length() && rendition?.currentLocation) {
              const current = rendition.currentLocation();
              const cfi = current?.start?.cfi;
              if (cfi) progress = rendition.book.locations.percentageFromCfi(cfi) || 0;
            }
          } catch {}
          onLocationChange(epubcifi, progress);
        }}
        tocChanged={(toc) => (tocRef.current = toc)}
        getRendition={(rendition) => {
          renditionRef.current = rendition;
          applyTheme(rendition, settings);
          try {
            rendition.book.ready.then(() => rendition.book.locations.generate(1024)).catch(() => {});
          } catch {}
        }}
        epubOptions={{ allowPopups: true, allowScriptedContent: false }}
        showToc={true}
      />
    </div>
  );
}
