"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Visite guidée : lancée automatiquement à la première ouverture, relançable à tout moment
 * (bouton « Tutoriel » du menu, ou startTour()).
 */

const DONE_KEY = "crmhub.tour.v1";
export const startTour = () => window.dispatchEvent(new Event("crmhub:tour"));

interface Step {
  target?: string; // valeur de data-tour à mettre en évidence (menu latéral)
  title: string;
  text: string;
  bullets?: string[];
}

const STEPS: Step[] = [
  {
    title: "Bienvenue dans le CRM Selection Hub",
    text: "Toutes les offres reçues et les documents du projet, réunis en un seul endroit. Cette visite présente chaque rubrique en un peu moins de deux minutes.",
    bullets: ["L'outil restitue le contenu des documents, sans recommander de solution.", "Chaque information renvoie à sa source : document et page."],
  },
  {
    target: "explorer",
    title: "Explorer : chercher un sujet dans tout le dossier",
    text: "Tapez un mot ou un sujet (API, réversibilité, formation, hébergement…). Les passages correspondants de chaque proposition s'affichent côte à côte.",
    bullets: ["Lire un passage en entier, ou l'ouvrir à la bonne page du document.", "Masquer une proposition, ou voir tous les passages par pertinence.", "Liens directs vers le comparateur et les questions ouvertes liées."],
  },
  {
    target: "propositions",
    title: "Propositions : une fiche par offre",
    text: "Chaque proposition est décrite avec la même structure, dans l'ordre du dossier d'évaluation.",
    bullets: ["Composants, périmètre, intégrations, finances, mise en œuvre, contrat.", "Limites documentées et questions ouvertes.", "Onglets en haut de page pour passer d'une offre à l'autre."],
  },
  {
    target: "comparateur",
    title: "Comparateur : les offres dimension par dimension",
    text: "La vue d'ensemble montre, pour chaque dimension, ce que la documentation établit. Ce n'est pas une note.",
    bullets: ["Survolez une case pour lire le résumé, cliquez pour la justification et les sources.", "Choisissez les propositions et les dimensions à afficher."],
  },
  {
    target: "finances",
    title: "Finances : le coût sur trois ans, poste par poste",
    text: "Le calcul reprend la formule du dossier d'évaluation, affichée en haut de page.",
    bullets: ["HTVA ou TVAC, scénarios à afficher ou masquer, graphique ou tableau.", "Hypothèse d'accompagnement récurrent ajustable.", "Exclusions et avertissements de comparabilité à lire avec les totaux."],
  },
  {
    target: "questions",
    title: "Questions ouvertes : ce qui reste à clarifier",
    text: "Les points soulevés dans les documents, les points de vigilance et les contradictions entre documents, chacun avec ses sources.",
    bullets: ["Filtres par proposition, par thème et par type.", "Recherche dans les intitulés et les descriptions."],
  },
  {
    target: "bibliotheque",
    title: "Bibliothèque : tous les documents",
    text: "Recherche dans le contenu de tous les documents, filtres par proposition, nature et thème.",
    bullets: ["Lecture page par page, avec les termes recherchés surlignés.", "Ouverture de l'original (PDF à la bonne page, fichiers Office en téléchargement)."],
  },
  {
    target: "methode",
    title: "Méthode & critères",
    text: "Les étapes, les critères et leurs repères, les pondérations et la gouvernance, tels que définis dans le dossier d'évaluation.",
  },
  {
    target: "palette",
    title: "Aller n'importe où, en un raccourci",
    text: "Ctrl + K (ou la touche /) ouvre une recherche rapide : une proposition, une dimension, une question ou un document.",
    bullets: ["Les petites étiquettes grises présentes partout sont les sources : un clic ouvre le document à la bonne page."],
  },
  {
    target: "tutoriel",
    title: "Revoir cette visite",
    text: "Le bouton « Tutoriel » relance cette présentation à tout moment. Bonne exploration.",
  },
];

function visibleTarget(name?: string): DOMRect | null {
  if (!name) return null;
  for (const el of Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`))) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return r;
  }
  return null;
}

export function Tour() {
  const [step, setStep] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const router = useRouter();

  useEffect(() => {
    const open = () => setStep(0);
    window.addEventListener("crmhub:tour", open);
    let seen = false;
    try { seen = !!localStorage.getItem(DONE_KEY); } catch {}
    const t = !seen ? setTimeout(open, 500) : undefined;
    return () => { window.removeEventListener("crmhub:tour", open); if (t) clearTimeout(t); };
  }, []);

  const close = useCallback((goExplore = false) => {
    try { localStorage.setItem(DONE_KEY, "1"); } catch {}
    setStep(null);
    if (goExplore) router.push("/explorer");
  }, [router]);

  const s = step === null ? null : STEPS[step];

  useLayoutEffect(() => {
    if (!s) return;
    const update = () => setRect(visibleTarget(s.target));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [s]);

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
  const pad = 6;

  // Position de la bulle : à droite de l'élément mis en évidence (menu latéral), sinon centrée
  const card: React.CSSProperties = rect
    ? { position: "fixed", left: rect.right + 18, top: Math.max(16, Math.min(rect.top - 24, window.innerHeight - 380)), width: 380 }
    : {};

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal aria-labelledby="tour-title">
      {rect ? (
        <div
          className="pointer-events-none fixed rounded-xl ring-2 ring-caritas-red transition-all duration-300"
          style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, boxShadow: "0 0 0 9999px rgba(26,22,21,0.45)" }}
        />
      ) : (
        <div className="fixed inset-0 bg-ink/45" />
      )}
      <div className={rect ? "" : "fixed inset-0 grid place-items-center px-4"} onClick={(e) => e.target === e.currentTarget && close()}>
        <div key={step} style={card} className="animate-rise w-full max-w-[440px] rounded-2xl border border-paper-line bg-white p-6 shadow-lift">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-caritas-red">Tutoriel · {step + 1} / {STEPS.length}</span>
            <button onClick={() => close()} className="rounded-md px-2 py-1 text-[12.5px] text-ink-mute hover:bg-paper-warm hover:text-ink">Passer</button>
          </div>
          <h2 id="tour-title" className="mt-2 text-[18px] font-semibold leading-snug tracking-tight text-ink">{s.title}</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{s.text}</p>
          {s.bullets && (
            <ul className="mt-3 space-y-1.5">
              {s.bullets.map((b) => (
                <li key={b} className="flex gap-2 text-[13px] leading-snug text-ink-soft"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-caritas-orange" />{b}</li>
              ))}
            </ul>
          )}
          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="flex gap-1" aria-hidden>
              {STEPS.map((_, i) => (
                <button key={i} tabIndex={-1} onClick={() => setStep(i)} className={`h-1.5 rounded-full transition-all ${i === step ? "w-5 bg-caritas-red" : "w-1.5 bg-paper-deep hover:bg-ink-faint"}`} />
              ))}
            </div>
            <div className="flex gap-2">
              {step > 0 && (
                <button onClick={() => setStep(step - 1)} className="rounded-xl border border-paper-line px-3.5 py-2 text-[13.5px] font-medium text-ink-soft hover:border-ink-faint hover:text-ink">Précédent</button>
              )}
              {last ? (
                <button onClick={() => close(true)} className="rounded-xl bg-caritas-red px-4 py-2 text-[13.5px] font-medium text-white hover:bg-[#c90714]">Commencer par Explorer</button>
              ) : (
                <button autoFocus onClick={() => setStep(step + 1)} className="rounded-xl bg-caritas-red px-4 py-2 text-[13.5px] font-medium text-white hover:bg-[#c90714]">{step === 0 ? "Commencer" : "Suivant"}</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
