"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { DIMENSIONS, QUESTIONS, VENDOR_ORDER, VENDOR_META } from "@/data/store";
import { getDocuments } from "@/lib/knowledge";
import type { VendorId } from "@/data/types";
import { VendorDot } from "./ui";
import { useLang } from "@/lib/i18n";

interface Item { group: string; label: string; hint?: string; href: string; vendor?: VendorId; key: string }

export const openPalette = () => window.dispatchEvent(new Event("crmhub:palette"));

const PAGES: [string, string][] = [
  ["/", "Accueil"], ["/explorer", "Explorer le dossier"], ["/comparateur", "Comparateur"], ["/finances", "Analyse financière"],
  ["/questions", "Questions ouvertes"], ["/bibliotheque", "Bibliothèque"], ["/methode", "Méthode & critères"],
];

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const router = useRouter();
  const { lang, t } = useLang();
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
      else if (e.key === "/" && !open && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) { e.preventDefault(); setOpen(true); }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("crmhub:palette", onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("crmhub:palette", onOpen); };
  }, [open]);

  useEffect(() => { if (open) { setQ(""); setSel(0); setTimeout(() => input.current?.focus(), 10); } }, [open]);

  const all: Item[] = useMemo(() => [
    ...PAGES.map(([href, label]) => ({ group: "Pages", label: t(label), href, key: `p${href}` })),
    ...VENDOR_ORDER.map((v) => ({ group: "Propositions", label: VENDOR_META[v].name, hint: VENDOR_META[v].sub, href: `/propositions?id=${v}`, vendor: v, key: `v${v}` })),
    ...DIMENSIONS.map((d) => ({ group: "Comparateur", label: d.label, hint: d.question, href: `/comparateur?d=${d.id}`, key: `d${d.id}` })),
    ...QUESTIONS.map((x) => ({ group: "Questions ouvertes", label: x.title, href: `/questions?q=${encodeURIComponent(x.title)}`, vendor: x.scope.find((s) => s !== "transversal") as VendorId | undefined, key: `q${x.id}` })),
    ...getDocuments().map((d) => ({ group: "Documents", label: d.short ?? d.title, hint: d.title, href: `/bibliotheque/document?id=${encodeURIComponent(d.id)}`, key: `f${d.id}` })),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [lang]);

  const results = useMemo(() => {
    const terms = norm(q).split(/\s+/).filter(Boolean);
    const matched = terms.length
      ? all.filter((i) => { const h = norm(`${i.label} ${i.hint ?? ""} ${t(i.group)}`); return terms.every((t) => h.includes(t) || (t.length >= 5 && h.includes(t.slice(0, t.length - 2)))); })
      : all.filter((i) => i.group === "Pages" || i.group === "Propositions");
    const capped: Item[] = [];
    const per: Record<string, number> = {};
    for (const i of matched) { per[i.group] = (per[i.group] ?? 0) + 1; if (per[i.group] <= 6) capped.push(i); }
    if (q.trim().length >= 2) capped.push({ group: "Recherche plein texte", label: t("Chercher « {q} » dans tous les documents", { q: q.trim() }), href: `/explorer?q=${encodeURIComponent(q.trim())}`, key: "search" });
    return capped;
  }, [q, all, t]);

  useEffect(() => { setSel(0); }, [q]);
  useEffect(() => { list.current?.querySelector(`[data-i="${sel}"]`)?.scrollIntoView({ block: "nearest" }); }, [sel]);

  if (!open) return null;
  const go = (i: Item | undefined) => { if (!i) return; setOpen(false); router.push(i.href); };

  let lastGroup = "";
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 px-4 pt-[12vh] backdrop-blur-[2px]" onMouseDown={() => setOpen(false)}>
      <div role="dialog" aria-modal aria-label={t("Aller à…")} className="animate-rise w-full max-w-[620px] overflow-hidden rounded-2xl border border-paper-line bg-white shadow-lift" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-paper-line px-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-ink-mute" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, results.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
              else if (e.key === "Enter") { e.preventDefault(); go(results[sel]); }
              else if (e.key === "Escape") setOpen(false);
            }}
            placeholder={t("Aller à une proposition, une dimension, une question, un document…")}
            className="min-w-0 flex-1 bg-transparent py-4 text-[15px] outline-none placeholder:text-ink-faint"
            aria-label={t("Rechercher")}
          />
          <kbd className="hidden rounded border border-paper-line px-1.5 py-0.5 text-[11px] text-ink-mute sm:block">{t("Échap")}</kbd>
        </div>
        <ul ref={list} className="max-h-[55vh] overflow-y-auto p-2 scrollbar-thin" role="listbox">
          {results.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-ink-mute">{t("Aucun résultat")}</li>}
          {results.map((i, n) => {
            const head = i.group !== lastGroup;
            lastGroup = i.group;
            return (
              <li key={i.key}>
                {head && <div className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-ink-mute">{t(i.group)}</div>}
                <button
                  data-i={n}
                  role="option"
                  aria-selected={n === sel}
                  onMouseMove={() => setSel(n)}
                  onClick={() => go(i)}
                  className={clsx("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left", n === sel ? "bg-paper-warm" : "")}
                >
                  {i.vendor ? <VendorDot id={i.vendor} size={8} /> : <span className="h-2 w-2 shrink-0 rounded-full bg-paper-deep" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] text-ink">{i.label}</span>
                    {i.hint && <span className="block truncate text-[12px] text-ink-mute">{i.hint}</span>}
                  </span>
                  {n === sel && <span className="text-[11px] text-ink-mute">{t("Entrée")}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
