"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { useVault } from "./VaultGate";
import { openPalette } from "./CommandPalette";
import { startTour } from "./Tour";
import { LangSwitch, useLang } from "@/lib/i18n";

const NAV = [
  { href: "/", label: "Accueil", icon: "M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" },
  { href: "/explorer", label: "Explorer", icon: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4" },
  { href: "/propositions", match: "/propositions", label: "Propositions", icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" },
  { href: "/comparateur", label: "Comparateur", icon: "M6 4v16M18 4v16M3 8h6M15 14h6M3 16h6M15 6h6" },
  { href: "/finances", label: "Finances", icon: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
  { href: "/questions", label: "Questions ouvertes", icon: "M12 17h.01M9.1 9a3 3 0 1 1 4.2 2.7c-.8.4-1.3 1.1-1.3 2V14M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" },
  { href: "/bibliotheque", label: "Bibliothèque", icon: "M4 4h5v16H4zM9 4h5v16H9zM15 5l4-1 2 15-4 1z" },
  { href: "/methode", label: "Méthode & critères", icon: "M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9" },
];

function Icon({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { lock } = useVault();
  const { lang, t } = useLang();
  const [open, setOpen] = useState(false);
  const [embedded, setEmbedded] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    try { setEmbedded(window.self !== window.top); } catch { setEmbedded(true); }
  }, []);

  const isActive = (n: (typeof NAV)[number]) => {
    const m = n.match ?? n.href;
    const p = pathname.replace(/\/$/, "") || "/";
    return m === "/" ? p === "/" : p.startsWith(m);
  };

  const nav = (
    <nav aria-label={t("Navigation principale")} className="flex flex-col gap-0.5">
      {NAV.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          data-tour={n.href.replace(/^\//, "") || "accueil"}
          aria-current={isActive(n) ? "page" : undefined}
          className={clsx(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] transition",
            isActive(n) ? "bg-white font-medium text-ink shadow-card ring-1 ring-paper-line" : "text-ink-soft hover:bg-white/60 hover:text-ink",
          )}
        >
          <span className={isActive(n) ? "text-caritas-red" : "text-ink-mute"}><Icon d={n.icon} /></span>
          {t(n.label)}
        </Link>
      ))}
    </nav>
  );

  const brand = (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-caritas-red text-[15px] font-bold text-white">C</span>
      <span className="leading-tight">
        <span className="block text-[13px] font-bold tracking-[0.12em] text-ink">CARITAS</span>
        <span className="block text-[11px] font-medium tracking-[0.08em] text-ink-mute">CRM SELECTION HUB</span>
      </span>
    </Link>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[256px_1fr] lg:bg-[linear-gradient(to_right,rgba(245,238,234,0.6)_255px,#E9E1DC_255px,#E9E1DC_256px,transparent_256px)]">
      <aside className="no-print sticky top-0 hidden h-screen flex-col px-4 py-5 lg:flex">
        {brand}
        <button data-tour="palette" onClick={openPalette} className="mt-6 flex items-center gap-2 rounded-lg border border-paper-line bg-white/80 px-3 py-2 text-left text-[13px] text-ink-mute transition hover:border-ink-faint hover:text-ink">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <span className="flex-1">{t("Aller à…")}</span>
          <kbd className="rounded border border-paper-line px-1 text-[10.5px]">Ctrl K</kbd>
        </button>
        <div className="mt-4 flex-1">{nav}</div>
        <div className="mt-3 flex items-center gap-2">
        <button data-tour="tutoriel" onClick={startTour} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-paper-line bg-white/80 px-3 py-2 text-[12.5px] font-medium text-ink-soft transition hover:border-ink-faint hover:text-ink">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" /></svg>
          {t("Tutoriel")}
        </button>
        <LangSwitch />
        </div>
        <button onClick={lock} className="mt-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-medium text-ink-mute transition hover:bg-white/70 hover:text-ink">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></svg>
          {t("Verrouiller")}
        </button>
      </aside>

      <div className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-paper-line bg-paper/95 px-4 py-3 backdrop-blur lg:hidden">
        {brand}
        <div className="flex items-center gap-2">
        <LangSwitch />
        <button data-tour="palette" onClick={openPalette} aria-label={t("Rechercher")} className="rounded-lg border border-paper-line bg-white p-2 text-ink-soft">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        </button>
        <button onClick={() => setOpen((v) => !v)} className="rounded-lg border border-paper-line bg-white px-3 py-1.5 text-[13px] font-medium" aria-expanded={open}>
          {open ? t("Fermer") : t("Menu")}
        </button>
        </div>
      </div>
      {open && (
        <div className="no-print border-b border-paper-line bg-paper-warm px-4 py-3 lg:hidden">
          {nav}
          <button onClick={() => { setOpen(false); startTour(); }} className="mt-2 w-full rounded-lg px-3 py-2 text-left text-[13px] text-ink-soft hover:bg-white/60">{t("Tutoriel")}</button>
          <button onClick={lock} className="w-full rounded-lg px-3 py-2 text-left text-[13px] text-ink-mute hover:bg-white/60">{t("Verrouiller")}</button>
        </div>
      )}

      <main className="min-w-0">
        {embedded && (
          <div className="no-print flex items-center justify-between gap-3 border-b border-paper-line bg-caritas-beige/50 px-4 py-1.5 text-[12px] text-ink-soft sm:px-8">
            <span>{t("Affichage intégré à SharePoint")}</span>
            <a href={typeof window !== "undefined" ? window.location.href : "#"} target="_blank" rel="noopener" className="font-medium text-ink underline underline-offset-2">{t("Ouvrir en plein écran")}</a>
          </div>
        )}
        <div key={lang} className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-8 sm:py-10">{children}</div>
      </main>
    </div>
  );
}
