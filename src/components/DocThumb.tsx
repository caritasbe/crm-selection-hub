"use client";

import { useEffect, useRef, useState } from "react";
import { thumbUrl } from "@/lib/vault";

/** Vignette de la première page, déchiffrée à l'approche de l'écran. */
export function DocThumb({ docId, format, className = "" }: { docId: string; format: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let alive = true;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        thumbUrl(docId).then((u) => alive && (u ? setSrc(u) : setFailed(true)));
      },
      { rootMargin: "300px" },
    );
    obs.observe(el);
    return () => {
      alive = false;
      obs.disconnect();
    };
  }, [docId]);

  return (
    <div ref={ref} className={`relative overflow-hidden bg-paper-deep ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover object-left-top transition-opacity duration-300" />
      ) : (
        <div className={`h-full w-full ${failed ? "" : "animate-pulse"}`} />
      )}
      <span className="absolute left-2 top-2 rounded bg-white/90 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink-soft shadow-card">{format}</span>
    </div>
  );
}
