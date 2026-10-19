"use client";

import Link from "next/link";
import { Card, SectionTitle, SourceChips, VendorDot, Pill } from "@/components/ui";
import { VENDORS, VENDOR_ORDER } from "@/data/vendors";
import { FAMILIES, PROJECT_CONTEXT, TIMELINE } from "@/data/evaluation";
import { QUESTIONS } from "@/data/questions";
import { resolveRef, resolveRefs } from "@/lib/refs";
import { getDocuments } from "@/lib/knowledge";
import { AskBox } from "@/components/AskBox";
import { SUGGESTIONS } from "@/data/store";
import { useTitle } from "@/lib/use-title";
import { tr } from "@/lib/i18n";
import { startTour } from "@/components/Tour";

export default function Home() {
  useTitle("Accueil");
  const docs = getDocuments();
  const transversal = QUESTIONS.filter((q) => q.scope.includes("transversal"));

  return (
    <div className="space-y-12">
      {/* En-tête */}
      <section className="animate-rise relative overflow-hidden rounded-[22px] border border-paper-line bg-white px-6 py-10 shadow-card sm:px-10 sm:py-12">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-caritas-beige/70 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 right-40 h-56 w-56 rounded-full bg-caritas-orange/10 blur-2xl" />
        <div className="relative max-w-3xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-caritas-red">{tr("Comité de sélection CRM & Marketing Automation")}</p>
          <h1 className="mt-3 text-[32px] font-semibold leading-[1.1] tracking-tight text-ink sm:text-[44px]">CRM Selection Hub</h1>
          <p className="mt-4 text-[16px] leading-relaxed text-ink-soft">
            {tr("L'espace de travail du comité : toutes les offres reçues et les documents du projet, réunis et consultables au même endroit. Recherchez un sujet, comparez les propositions et ouvrez chaque source. L'outil présente les informations, il ne recommande aucune solution.")}
          </p>
          <button onClick={startTour} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-paper-line bg-white px-3.5 py-2 text-[13.5px] font-medium text-ink shadow-card transition hover:border-ink-faint">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-caritas-red" aria-hidden><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4z" fill="currentColor" stroke="none" /></svg>
            {tr("Découvrir l'outil en 2 minutes")}
          </button>
          <div className="mt-7"><AskBox suggestions={SUGGESTIONS} /></div>
          <div className="mt-5 flex flex-wrap gap-2 text-[13px]">
            {[
              ["/comparateur", "Comparer les offres"],
              ["/finances", "Analyse financière"],
              ["/questions", "Questions ouvertes"],
              ["/bibliotheque", "Bibliothèque"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="rounded-full border border-paper-line bg-paper px-3.5 py-1.5 font-medium text-ink-soft transition hover:border-ink-faint hover:text-ink">
                {tr(label)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Contexte */}
      <section>
        <SectionTitle hint={<SourceChips refs={[resolveRef(PROJECT_CONTEXT.objectiveSource)]} />}>{tr("Le projet en bref")}</SectionTitle>
        <div className="grid gap-4">
          <Card className="p-6">
            <p className="text-[15px] leading-relaxed text-ink">{PROJECT_CONTEXT.objective}</p>
            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
              {PROJECT_CONTEXT.figures.map((f) => (
                <div key={f.label}>
                  <div className="text-[22px] font-semibold tracking-tight text-ink tnum">{f.value}</div>
                  <div className="mt-1 text-[12.5px] leading-snug text-ink-mute">{f.label}</div>
                </div>
              ))}
            </div>
            <SourceChips className="mt-5" refs={resolveRefs(PROJECT_CONTEXT.figures.map((f) => f.source))} max={4} />
          </Card>
          <Card className="p-6">
            <h3 className="text-[14px] font-semibold text-ink">{tr("Comment la donnée doit circuler")}</h3>
            <p className="mt-1 text-[13px] leading-snug text-ink-mute">{tr("Schéma cible du cahier des charges. Les propositions portent sur l'étape 3, connectée à la base mère (étape 2).")}</p>
            <DataFlow layers={PROJECT_CONTEXT.architecture} />
            <SourceChips className="mt-4" refs={[resolveRef(PROJECT_CONTEXT.architectureSource)]} />
          </Card>
        </div>
      </section>

      {/* Candidats */}
      <section>
        <SectionTitle hint={tr("Ordre de présentation du dossier d'évaluation")}>{tr("Les quatre propositions évaluées")}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {VENDOR_ORDER.map((id) => {
            const v = VENDORS[id];
            return (
              <Link key={id} href={`/propositions?id=${id}`} className="group">
                <Card className="flex h-full flex-col p-5 transition group-hover:shadow-lift">
                  <div className="flex items-center gap-2"><VendorDot id={id} size={12} /><span className="text-[12px] font-medium text-ink-mute">{v.partner === v.name ? tr("Éditeur et intégrateur") : tr("Partenaire : {p}", { p: v.partner })}</span></div>
                  <h3 className="mt-3 text-[18px] font-semibold leading-snug tracking-tight text-ink">{v.name}</h3>
                  <p className="mt-2 text-[13px] leading-snug text-ink-soft">{v.tagline}</p>
                  <ul className="mt-4 space-y-1.5 text-[12.5px] text-ink-mute">
                    {v.components.slice(0, 4).map((c) => (
                      <li key={c.name} className="flex gap-2"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-faint" />{c.name}</li>
                    ))}
                  </ul>
                  <div className="mt-auto flex items-center justify-between pt-5 text-[12.5px]">
                    <span className="text-ink-mute">{tr(v.documents.length > 1 ? "{n} documents dans le dossier" : "{n} document dans le dossier", { n: v.documents.length })}</span>
                    <span className="shrink-0 font-medium text-ink group-hover:text-caritas-red">{tr("Voir")}&nbsp;→</span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Dimensions d'évaluation */}
      <section>
        <SectionTitle hint={<Link className="font-medium text-ink underline underline-offset-2" href="/methode">{tr("Méthode complète")}</Link>}>
          {tr("Les grandes dimensions de l'évaluation")}
        </SectionTitle>
        <Card className="p-6">
          <div className="flex h-3 overflow-hidden rounded-full">
            {FAMILIES.map((f, i) => (
              <div key={f.id} style={{ width: `${f.weight * 100}%`, background: ["#1A1615", "#E20817", "#FF5823", "#F7DAD0"][i] }} />
            ))}
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FAMILIES.map((f, i) => (
              <div key={f.id}>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: ["#1A1615", "#E20817", "#FF5823", "#F7DAD0"][i], outline: i === 3 ? "1px solid #E9E1DC" : undefined }} />
                  <span className="text-[13px] font-semibold text-ink">{f.id}. {f.label}</span>
                </div>
                <div className="mt-1 text-[24px] font-semibold tracking-tight tnum">{Math.round(f.weight * 100)} %</div>
                <ul className="mt-2 space-y-1 text-[12.5px] leading-snug text-ink-mute">
                  {f.criteria.map((c) => <li key={c.id}>{c.id} · {c.q}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-5 border-t border-paper-line pt-4 text-[12.5px] text-ink-mute">
            {tr("Le score et le coût sont deux lectures distinctes.")}
          </p>
          <SourceChips className="mt-3" refs={resolveRefs([{ doc: "eval", page: 1 }, { doc: "eval", page: 2 }])} />
        </Card>
      </section>

      {/* Sujets en discussion + calendrier */}
      <section className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <SectionTitle hint={<Link className="font-medium text-ink underline underline-offset-2" href="/questions">{tr("Toutes les questions ({n})", { n: QUESTIONS.length })}</Link>}>
            {tr("Sujets encore en discussion")}
          </SectionTitle>
          <Card className="divide-y divide-paper-line">
            {transversal.slice(0, 5).map((q) => (
              <div key={q.id} className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={q.type === "contradiction" ? "accent" : q.type === "vigilance" ? "warm" : "neutral"}>
                    {tr(q.type === "soulevee" ? "Soulevé dans la documentation" : q.type === "vigilance" ? "Point de vigilance" : "Contradiction")}
                  </Pill>
                </div>
                <h3 className="mt-2 text-[14.5px] font-semibold text-ink">{q.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{q.detail}</p>
                <SourceChips className="mt-3" refs={resolveRefs(q.sources)} max={3} />
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-paper/60 px-5 py-3.5 text-[12.5px]">
              <span className="text-ink-mute">{tr("Par proposition :")}</span>
              {VENDOR_ORDER.map((id) => (
                <Link key={id} href={`/questions?scope=${id}`} className="inline-flex items-center gap-1.5 font-medium text-ink-soft hover:text-ink">
                  <VendorDot id={id} size={8} />{VENDORS[id].short}
                </Link>
              ))}
            </div>
          </Card>
        </div>
        <div>
          <SectionTitle>{tr("Calendrier")}</SectionTitle>
          <Card className="p-6">
            <ol className="relative space-y-4 border-l border-paper-line pl-5">
              {TIMELINE.map((t) => (
                <li key={t.label} className="relative">
                  <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-ink-faint ring-1 ring-paper-line" />
                  {t.date && <div className="text-[12px] font-semibold text-ink-mute tnum">{t.date}</div>}
                  <div className="text-[13.5px] text-ink">{t.label}</div>
                </li>
              ))}
            </ol>
            <SourceChips className="mt-4" refs={resolveRefs(TIMELINE.flatMap((t) => (t.source ? [t.source] : [])))} max={3} />
          </Card>
        </div>
      </section>

      <p className="text-center text-[12.5px] text-ink-mute">
        {tr("Cet outil restitue le contenu des documents sans recommander de solution.")}
      </p>
    </div>
  );
}

const FLOW_COLORS = ["#FF5823", "#E20817", "#B8237E", "#1A1615"];

function DataFlow({ layers }: { layers: { layer: string; text: string }[] }) {
  return (
    <ol className="mt-5 grid gap-2 sm:grid-cols-4 sm:gap-0">
      {layers.map((l, i) => {
        const [main, ...rest] = l.text.replace(/\.$/, "").split(/ ?: /);
        const items = (rest.length ? rest.join(" : ") : main).split(/, |\. /).map((x) => x.trim()).filter(Boolean);
        const hub = i === 1;
        return (
          <li key={l.layer} className="relative flex flex-col">
            <div className={`flex-1 rounded-xl border p-3 sm:mr-4 ${hub ? "border-caritas-red/40 bg-caritas-red/[0.04]" : "border-paper-line bg-paper/60"}`}>
              <div className="flex items-center gap-2">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-[11px] font-semibold text-white" style={{ background: FLOW_COLORS[i] }}>{i + 1}</span>
                <span className="text-[12.5px] font-semibold leading-tight text-ink">{l.layer.replace(/^\d\.\s*/, "")}</span>
              </div>
              {rest.length > 0 && <div className="mt-2 text-[12.5px] font-medium leading-snug text-ink">{main}</div>}
              <ul className="mt-2 flex flex-wrap gap-1">
                {items.map((x) => (
                  <li key={x} className="rounded-md bg-white px-1.5 py-0.5 text-[11.5px] leading-snug text-ink-soft ring-1 ring-paper-line">{x}</li>
                ))}
              </ul>
            </div>
            {i < layers.length - 1 && (
              <span aria-hidden className="pointer-events-none absolute z-10 hidden text-ink-faint sm:right-[-2px] sm:top-1/2 sm:block sm:-translate-y-1/2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
              </span>
            )}
            {i < layers.length - 1 && (
              <span aria-hidden className="mx-auto py-0.5 text-ink-faint sm:hidden">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v13M6 13l6 6 6-6" /></svg>
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
