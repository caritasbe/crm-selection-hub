"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { tr } from "@/lib/i18n";

export function AskBox({ suggestions }: { suggestions: string[] }) {
  const [q, setQ] = useState("");
  const router = useRouter();
  const go = (text: string) => text.trim() && router.push(`/explorer?q=${encodeURIComponent(text.trim())}`);
  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); go(q); }} className="flex items-center gap-2 rounded-2xl border border-paper-line bg-paper p-1.5 pl-4 shadow-card focus-within:border-ink-faint focus-within:bg-white">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-ink-mute" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <label htmlFor="ask" className="sr-only">{tr("Rechercher dans le dossier")}</label>
        <input id="ask" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr("Un sujet : réversibilité, API, paliers de contacts, hébergement…")} className="min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none placeholder:text-ink-faint" />
        <button className="rounded-xl bg-caritas-red px-4 py-2 text-[14px] font-medium text-white transition hover:bg-[#c90714]">{tr("Explorer")}</button>
      </form>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-ink-mute">{tr("Essayez :")}</span>
        {suggestions.map((s) => (
          <button key={s} onClick={() => go(s)} className="rounded-lg bg-paper-warm px-3 py-1.5 text-left text-[12.5px] text-ink-soft transition hover:bg-paper-deep hover:text-ink">
            {s}
          </button>
        ))}
      </div>
      <p className="mt-3 text-[12px] text-ink-mute">
        {tr("Astuce :")} <kbd className="rounded border border-paper-line bg-white px-1.5 py-0.5 font-sans text-[11px]">Ctrl</kbd> + <kbd className="rounded border border-paper-line bg-white px-1.5 py-0.5 font-sans text-[11px]">K</kbd> {tr("pour aller n'importe où.")}
      </p>
    </div>
  );
}
