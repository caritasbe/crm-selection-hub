"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { VENDOR_IDS, VENDOR_META } from "@/data/vendor-meta";
import type { VendorId } from "@/data/types";
import { VendorDot } from "./ui";
import { search, snippet } from "@/lib/search";
import { getDocument } from "@/lib/knowledge";
import { resolveRef } from "@/lib/refs";

export interface DocView {
  id: string; title: string; issuer: string; date: string; vendors: string[]; nature: string; natureLabel: string;
  description: string; note?: string; format: string; pageCount: number; locatorType: string; themes: string[];
}

interface Hit { chunkId: string; docId: string; docTitle: string; page: number; label: string; snippet: string }

const THEMES: Record<string, string> = {
  "marketing-automation": "Marketing automation", cdp: "CDP", integrations: "Intégrations", architecture: "Architecture", segmentation: "Segmentation",
  consentements: "Consentements", migration: "Mise en œuvre", support: "Support", couts: "Coûts", contrat: "Contrat", securite: "Sécurité & RGPD",
  collecte: "Collecte", reporting: "Reporting", ia: "IA",
};

function highlight(text: string, q: string) {
  const terms = q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/).filter((t) => t.length > 2);
  if (!terms.length) return text;
  const plain = text.toLowerCase().split("").map((c) => c.normalize("NFD").replace(/[\u0300-\u036f]/g, "")[0] ?? c).join(""); // même longueur que text
  const parts: React.ReactNode[] = [];
  let i = 0;
  while (i < text.length) {
    let next = -1, len = 0;
    for (const t of terms) { const p = plain.indexOf(t, i); if (p >= 0 && (next < 0 || p < next)) { next = p; len = t.length; } }
    if (next < 0) { parts.push(text.slice(i)); break; }
    parts.push(text.slice(i, next), <mark key={next}>{text.slice(next, next + len)}</mark>);
    i = next + len;
  }
  return parts;
}

export function LibraryClient({ docs, natures, initialQuery }: { docs: DocView[]; natures: Record<string, string>; initialQuery?: string }) {
  const [scope, setScope] = useState("all");
  const [nature, setNature] = useState("all");
  const [theme, setTheme] = useState("all");
  const [q, setQ] = useState(initialQuery ?? "");
  const [debounced, setDebounced] = useState(q);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 200);
    return () => clearTimeout(t);
  }, [q]);
  const loading = debounced !== q;
  const hits: Hit[] | null = useMemo(() => {
    if (debounced.trim().length < 2) return null;
    return search(debounced, { limit: 40, vendors: scope !== "all" ? [scope] : undefined }).map((h) => ({
      chunkId: h.chunk.id,
      docId: h.chunk.docId,
      docTitle: resolveRef({ doc: h.chunk.docId, page: h.chunk.page }).shortTitle || getDocument(h.chunk.docId)?.title || h.chunk.docId,
      page: h.chunk.page,
      label: h.chunk.label,
      snippet: snippet(h.chunk.text, debounced),
    }));
  }, [debounced, scope]);

  const filteredDocs = useMemo(
    () => docs.filter((d) => (scope === "all" || d.vendors.includes(scope)) && (nature === "all" || d.nature === nature) && (theme === "all" || d.themes.includes(theme))),
    [docs, scope, nature, theme],
  );
  const groups: [string, DocView[]][] = (["transversal", ...VENDOR_IDS] as string[])
    .map((g) => [g, filteredDocs.filter((d) => d.vendors[0] === g)] as [string, DocView[]])
    .filter(([, l]) => l.length);

  const chip = (a: boolean) => clsx("rounded-full border px-3 py-1.5 text-[12.5px] transition", a ? "border-ink bg-ink text-white" : "border-paper-line bg-white text-ink-soft hover:border-ink-faint");

  return (
    <div>
      <div className="no-print mb-6 space-y-4 rounded-xl2 border border-paper-line bg-white p-5 shadow-card">
        <div className="flex items-center gap-2 rounded-xl border border-paper-line bg-paper px-3 focus-within:border-ink-faint focus-within:bg-white">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-mute" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <label htmlFor="lib-q" className="sr-only">Rechercher dans les documents</label>
          <input id="lib-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher dans le contenu : réversibilité, SFTP, palier, hypercare…" className="w-full bg-transparent py-2.5 text-[14.5px] outline-none" />
          {loading && <span className="text-[12px] text-ink-mute">…</span>}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[12px] font-semibold uppercase tracking-wide text-ink-mute">Proposition</span>
          <button className={chip(scope === "all")} onClick={() => setScope("all")}>Toutes</button>
          {VENDOR_IDS.map((v) => <button key={v} className={clsx(chip(scope === v), "inline-flex items-center gap-1.5")} onClick={() => setScope(v)}><VendorDot id={v as VendorId} size={7} />{VENDOR_META[v].short}</button>)}
          <button className={chip(scope === "transversal")} onClick={() => setScope("transversal")}>Transversal</button>
        </div>
        {!hits && (
          <>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[12px] font-semibold uppercase tracking-wide text-ink-mute">Nature</span>
              <button className={chip(nature === "all")} onClick={() => setNature("all")}>Toutes</button>
              {Object.entries(natures).map(([k, l]) => <button key={k} className={chip(nature === k)} onClick={() => setNature(k)}>{l}</button>)}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[12px] font-semibold uppercase tracking-wide text-ink-mute">Thème</span>
              <button className={chip(theme === "all")} onClick={() => setTheme("all")}>Tous</button>
              {Object.entries(THEMES).map(([k, l]) => <button key={k} className={chip(theme === k)} onClick={() => setTheme(k)}>{l}</button>)}
            </div>
          </>
        )}
      </div>

      {hits ? (
        <div>
          <p className="mb-3 text-[13px] text-ink-mute">{hits.length} passage{hits.length > 1 ? "s" : ""} correspondant{hits.length > 1 ? "s" : ""}</p>
          <div className="space-y-2.5">
            {hits.map((h) => (
              <Link key={h.chunkId} href={`/bibliotheque/document?id=${encodeURIComponent(h.docId)}&page=${h.page}&q=${encodeURIComponent(q)}#p${h.page}`} className="block rounded-xl border border-paper-line bg-white p-4 shadow-card transition hover:shadow-lift">
                <div className="text-[13px] font-medium text-ink">{h.docTitle} <span className="font-normal text-ink-mute">· {h.label}</span></div>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{highlight(h.snippet, debounced)}</p>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(([g, list]) => (
            <section key={g}>
              <h2 className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-ink">
                {g !== "transversal" && <VendorDot id={g as VendorId} />}
                {g === "transversal" ? "Documents Caritas et transversaux" : VENDOR_META[g as VendorId].name}
                <span className="font-normal text-ink-mute">({list.length})</span>
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {list.map((d) => (
                  <Link key={d.id} href={`/bibliotheque/document?id=${encodeURIComponent(d.id)}`} className="group rounded-xl2 border border-paper-line bg-white p-5 shadow-card transition hover:shadow-lift">
                    <div className="flex flex-wrap items-center gap-2 text-[11.5px] font-medium uppercase tracking-wide text-ink-mute">
                      <span>{d.natureLabel}</span><span>·</span><span>{d.format.toUpperCase()}</span><span>·</span><span>{d.pageCount} {d.locatorType}{d.pageCount > 1 ? "s" : ""}</span><span>·</span><span>{d.date}</span>
                    </div>
                    <h3 className="mt-1.5 text-[15px] font-semibold leading-snug text-ink group-hover:text-caritas-red">{d.title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{d.description}</p>
                    {d.note && <p className="mt-2 rounded-md bg-caritas-beige/40 px-2.5 py-1.5 text-[12px] text-ink-soft">{d.note}</p>}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
