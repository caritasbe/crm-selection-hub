"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";

/**
 * Visite guidée interactive : elle ouvre chaque rubrique et met en lumière les éléments utiles,
 * que l'on peut manipuler pendant la visite (curseurs, filtres, cases du comparateur).
 * Lancée automatiquement à la première ouverture, relançable à tout moment (bouton « Tutoriel »).
 */

const DONE_KEY = "crmhub.tour.v2";
export const startTour = () => window.dispatchEvent(new Event("crmhub:tour"));

interface Step {
  href?: string; // page à ouvrir pour cette étape
  target?: string; // valeur de data-tour de l'élément à mettre en lumière
  title: string;
  text: string;
  bullets?: string[];
}

const STEPS: Step[] = [
  {
    href: "/",
    title: "Bienvenue dans le CRM Selection Hub",
    text: "Toutes les offres reçues et les documents du projet, réunis en un seul endroit. La visite ouvre chaque rubrique et montre ce que l'on peut y faire, en un peu plus de deux minutes.",
    bullets: ["L'outil restitue le contenu des documents, sans recommander de solution.", "Chaque information renvoie à sa source : document et page.", "Pendant la visite, vous pouvez manipuler les éléments mis en lumière."],
  },
  {
    target: "explorer",
    title: "Explorer : chercher un sujet dans tout le dossier",
    text: "Première rubrique : la recherche dans les documents. Ouvrons-la.",
  },
  {
    href: "/explorer?q=API",
    target: "explorer-search",
    title: "Tapez un sujet",
    text: "Un mot suffit (API, réversibilité, formation, hébergement…). Les synonymes métier sont inclus, en français et en anglais. Ici, la recherche porte sur « API ».",
  },
  {
    target: "explorer-results",
    title: "Les passages, côte à côte",
    text: "Les passages les plus pertinents de chaque proposition s'affichent en colonnes, tels qu'ils sont écrits dans les documents.",
    bullets: ["« Lire le passage complet » déplie le texte.", "« Voir dans le document » ouvre la bonne page."],
  },
  {
    target: "explorer-filters",
    title: "Filtrer l'affichage",
    text: "Masquez une proposition d'un clic, ou passez en liste unique de tous les passages, du plus au moins pertinent.",
  },
  {
    href: "/propositions",
    target: "prop-tabs",
    title: "Propositions : une fiche par offre",
    text: "Chaque proposition est décrite avec la même structure. Ces onglets permettent de passer de l'une à l'autre.",
  },
  {
    target: "prop-sections",
    title: "Toutes les rubriques d'une offre",
    text: "Composants, périmètre, intégrations, finances, mise en œuvre, contrat, limites, questions ouvertes et documents sources. Cliquez pour y aller directement.",
  },
  {
    href: "/comparateur",
    target: "comp-matrix",
    title: "Comparateur : la vue d'ensemble",
    text: "Pour chaque dimension, ce que la documentation établit. Ce n'est pas une note.",
    bullets: ["Survolez une case pour lire le résumé.", "Cliquez pour ouvrir la justification et les sources."],
  },
  {
    target: "comp-controls",
    title: "Choisir ce que l'on compare",
    text: "Sélectionnez les propositions et les dimensions, ou passez au comparatif détaillé.",
  },
  {
    href: "/finances",
    target: "fin-vat",
    title: "Finances : HTVA ou TVAC",
    text: "Tous les montants basculent en TVA comprise d'un clic. Essayez.",
  },
  {
    target: "fin-recurring",
    title: "Tester l'hypothèse d'accompagnement",
    text: "Faites glisser le curseur : le nombre de mois d'accompagnement récurrent par an change, et les totaux se recalculent aussitôt.",
  },
  {
    target: "fin-range",
    title: "Situer une mise en œuvre chiffrée en fourchette",
    text: "Quand une offre chiffre deux scénarios, le curseur va de l'un à l'autre, en jours de prestation ; les deux bornes sont les montants documentés.",
  },
  {
    href: "/questions",
    target: "q-filters",
    title: "Questions ouvertes",
    text: "Ce qui reste à clarifier, avec ses sources. Filtrez par proposition, par type ou par thème, ou cherchez un mot-clé.",
  },
  {
    href: "/bibliotheque",
    target: "lib-search",
    title: "Bibliothèque : tous les documents",
    text: "Recherche dans le contenu de chaque document, lecture page par page, et ouverture des originaux (PDF à la bonne page, fichiers Office en téléchargement).",
  },
  {
    href: "/methode",
    target: "methode",
    title: "Méthode & critères",
    text: "Les étapes, les critères et leurs repères, les pondérations et la gouvernance, tels que définis dans le dossier d'évaluation.",
  },
  {
    target: "palette",
    title: "Aller n'importe où",
    text: "Ctrl + K (ou la touche /) ouvre une recherche rapide : une proposition, une dimension, une question ou un document.",
    bullets: ["Les petites étiquettes grises sont les sources : un clic ouvre le document à la bonne page."],
  },
  {
    target: "lang",
    title: "Français ou anglais",
    text: "Ce bouton bascule tout l'outil en anglais, et inversement.",
  },
  {
    target: "tutoriel",
    title: "Revoir cette visite",
    text: "Le bouton « Tutoriel » relance cette présentation à tout moment. Bonne exploration.",
  },
];

const PAD = 8;
const CARD_W = 380;

function findTarget(name?: string): HTMLElement | null {
  if (!name) return null;
  for (const el of Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`))) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

type Placement = { style: React.CSSProperties; sheet: boolean };

function place(r: DOMRect | null): Placement {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (!r) return { style: {}, sheet: false };
  if (vw < 640) return { style: {}, sheet: true };
  const w = Math.min(CARD_W, vw - 32);
  const clampX = (x: number) => Math.max(16, Math.min(x, vw - w - 16));
  const clampY = (y: number) => Math.max(16, Math.min(y, vh - 360));
  if (vw - r.right >= w + 40) return { style: { left: r.right + PAD + 16, top: clampY(r.top - 8), width: w }, sheet: false };
  if (vh - r.bottom >= 300) return { style: { left: clampX(r.left), top: r.bottom + PAD + 12, width: w }, sheet: false };
  if (r.top >= 300) return { style: { left: clampX(r.left), bottom: vh - r.top + PAD + 12, width: w }, sheet: false };
  if (r.left >= w + 40) return { style: { left: r.left - PAD - 16 - w, top: clampY(r.top), width: w }, sheet: false };
  return { style: {}, sheet: true };
}

export function Tour() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const [step, setStep] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [ready, setReady] = useState(false);
  const elRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const open = () => setStep(0);
    window.addEventListener("crmhub:tour", open);
    let seen = false;
    try { seen = !!localStorage.getItem(DONE_KEY); } catch {}
    const timer = !seen ? setTimeout(open, 600) : undefined;
    return () => { window.removeEventListener("crmhub:tour", open); if (timer) clearTimeout(timer); };
  }, []);

  const close = useCallback((goHome = false) => {
    try { localStorage.setItem(DONE_KEY, "1"); } catch {}
    setStep(null);
    setRect(null);
    if (goHome) router.push("/", { scroll: true });
  }, [router]);

  const s = step === null ? null : STEPS[step];

  // Navigation vers la page de l'étape, puis attente de l'élément à mettre en lumière
  useEffect(() => {
    if (!s) return;
    setReady(false);
    setRect(null);
    elRef.current = null;
    if (s.href) {
      const [path, query = ""] = s.href.split("?");
      const here = (pathname.replace(/\/$/, "") || "/") === path && (!query || window.location.search.includes(query));
      if (!here) router.push(s.href, { scroll: true });
    }
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const look = () => {
      const el = findTarget(s.target);
      if (el || !s.target || tries > 30) {
        elRef.current = el;
        if (el) el.scrollIntoView({ block: "center", behavior: "auto" });
        timer = setTimeout(() => {
          setRect(el ? el.getBoundingClientRect() : null);
          setReady(true);
        }, el ? 120 : 0);
        return;
      }
      tries++;
      timer = setTimeout(look, 100);
    };
    timer = setTimeout(look, s.href ? 250 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Suivi de l'élément (défilement, redimensionnement, contenu qui bouge)
  useLayoutEffect(() => {
    if (!ready) return;
    const update = () => elRef.current && setRect(elRef.current.getBoundingClientRect());
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const iv = setInterval(update, 400);
    return () => { window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); clearInterval(iv); };
  }, [ready]);

  useEffect(() => {
    if (step === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") setStep((n) => (n === null ? n : Math.min(n + 1, STEPS.length - 1)));
      else if (e.key === "ArrowLeft") setStep((n) => (n === null ? n : Math.max(n - 1, 0)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, close]);

  if (step === null || !s) return null;
  const last = step === STEPS.length - 1;
  const { style, sheet } = place(rect);
  const hole = rect && { left: rect.left - PAD, top: rect.top - PAD, right: rect.right + PAD, bottom: rect.bottom + PAD };

  const card = (
    <div
      key={step}
      style={sheet || !rect ? undefined : { position: "fixed", ...style }}
      className={`animate-rise pointer-events-auto rounded-2xl border border-paper-line bg-white p-5 shadow-lift sm:p-6 ${!rect ? "w-full max-w-[460px]" : sheet ? "w-full" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-caritas-red">{t("Tutoriel")} · {step + 1} / {STEPS.length}</span>
        <button onClick={() => close()} className="rounded-md px-2 py-1 text-[12.5px] text-ink-mute hover:bg-paper-warm hover:text-ink">{t("Passer")}</button>
      </div>
      <h2 id="tour-title" className="mt-2 text-[18px] font-semibold leading-snug tracking-tight text-ink">{t(s.title)}</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{t(s.text)}</p>
      {s.bullets && (
        <ul className="mt-3 space-y-1.5">
          {s.bullets.map((b) => (
            <li key={b} className="flex gap-2 text-[13px] leading-snug text-ink-soft"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-caritas-orange" />{t(b)}</li>
          ))}
        </ul>
      )}
      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-paper-deep" aria-hidden>
          <div className="h-full rounded-full bg-caritas-red transition-all duration-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
        <div className="flex shrink-0 gap-2">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="rounded-xl border border-paper-line px-3.5 py-2 text-[13.5px] font-medium text-ink-soft hover:border-ink-faint hover:text-ink">{t("Précédent")}</button>
          )}
          {last ? (
            <button onClick={() => close(true)} className="rounded-xl bg-caritas-red px-4 py-2 text-[13.5px] font-medium text-white hover:bg-[#c90714]">{t("Terminer et revenir à l'accueil")}</button>
          ) : (
            <button autoFocus onClick={() => setStep(step + 1)} className="rounded-xl bg-caritas-red px-4 py-2 text-[13.5px] font-medium text-white hover:bg-[#c90714]">{step === 0 ? t("Commencer") : t("Suivant")}</button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" role="dialog" aria-modal aria-labelledby="tour-title">
      {hole ? (
        <>
          {/* Voile autour de l'élément : l'élément lui-même reste cliquable */}
          {[
            { left: 0, top: 0, width: "100%", height: Math.max(0, hole.top) },
            { left: 0, top: hole.bottom, width: "100%", bottom: 0 },
            { left: 0, top: hole.top, width: Math.max(0, hole.left), height: hole.bottom - hole.top },
            { left: hole.right, top: hole.top, right: 0, height: hole.bottom - hole.top },
          ].map((st, i) => (
            <div key={i} className="pointer-events-auto fixed bg-ink/45 transition-all duration-200" style={st} />
          ))}
          <div className="fixed rounded-xl ring-2 ring-caritas-red ring-offset-0 transition-all duration-200" style={{ left: hole.left, top: hole.top, width: hole.right - hole.left, height: hole.bottom - hole.top }} />
        </>
      ) : (
        <div className="pointer-events-auto fixed inset-0 bg-ink/45" />
      )}
      {!ready ? null : sheet ? (
        <div className="fixed inset-x-0 bottom-0 p-3">{card}</div>
      ) : rect ? (
        card
      ) : (
        <div className="fixed inset-0 grid place-items-center px-4">{card}</div>
      )}
    </div>
  );
}
