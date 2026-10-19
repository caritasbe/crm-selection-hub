"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { Card, SectionTitle, SourceChips, VendorDot, Pill } from "@/components/ui";
import { VENDORS, VENDOR_ORDER } from "@/data/vendors";
import { QUESTIONS, THEME_LABELS } from "@/data/questions";
import type { VendorId } from "@/data/types";
import { resolveRefs } from "@/lib/refs";
import { getDocument, NATURE_LABELS } from "@/lib/knowledge";
import { useTitle } from "@/lib/use-title";

const SECTIONS = [
  ["apercu", "Vue d'ensemble"],
  ["composants", "Composants"],
  ["perimetre", "Périmètre fonctionnel"],
  ["integrations", "Intégrations"],
  ["finances", "Modèle financier"],
  ["mise-en-oeuvre", "Mise en œuvre"],
  ["contrat", "Contrat"],
  ["limites", "Limites et dépendances"],
  ["questions", "Questions ouvertes"],
  ["documents", "Documents sources"],
] as const;

function Rows({ items }: { items: { label: string; value: string; detail?: string; sources: { doc: string; page: number }[] }[] }) {
  return (
    <Card className="divide-y divide-paper-line">
      {items.map((it) => (
        <div key={it.label} className="grid gap-2 p-4 sm:grid-cols-[220px_1fr] sm:gap-6 sm:p-5">
          <div className="text-[13px] font-medium text-ink-mute">{it.label}</div>
          <div>
            <div className="text-[14px] font-medium text-ink">{it.value}</div>
            {it.detail && <div className="mt-1 text-[13px] text-ink-soft">{it.detail}</div>}
            <SourceChips className="mt-2" refs={resolveRefs(it.sources)} />
          </div>
        </div>
      ))}
    </Card>
  );
}

export default function PropositionPage() {
  return (
    <Suspense>
      <Proposition />
    </Suspense>
  );
}

function Proposition() {
  const params = useSearchParams();
  const id = (VENDORS[params.get("id") as VendorId] ? params.get("id") : VENDOR_ORDER[0]) as VendorId;
  const v = VENDORS[id];
  useTitle(v?.name);
  const questions = QUESTIONS.filter((q) => q.scope.includes(id));

  return (
    <div key={id} className="animate-rise">
      {/* Sélecteur de proposition, ordre du dossier d'évaluation */}
      <div className="no-print mb-8 flex gap-1 overflow-x-auto rounded-xl border border-paper-line bg-paper-warm/70 p-1 scrollbar-thin">
        {VENDOR_ORDER.map((vid) => (
          <Link
            key={vid}
            href={`/propositions?id=${vid}`}
            scroll={false}
            className={clsx("flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-[13.5px] transition", vid === id ? "bg-white font-medium text-ink shadow-card" : "text-ink-soft hover:text-ink")}
          >
            <VendorDot id={vid} />
            {VENDORS[vid].name}
          </Link>
        ))}
      </div>

      <header className="mb-8">
        <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
          <VendorDot id={id} size={12} /> Proposition · partenaire {v.partner}
        </div>
        <h1 className="mt-2 text-[30px] font-semibold tracking-tight text-ink sm:text-[36px]">{v.name}</h1>
        <p className="mt-2 text-[15px] text-ink-soft">{v.tagline}</p>
        <SourceChips className="mt-3" refs={resolveRefs([{ doc: "eval", page: 1 }])} />
      </header>

      <div className="grid gap-10 lg:grid-cols-[200px_1fr]">
        <nav aria-label="Sections" className="no-print hidden lg:block">
          <ul className="sticky top-8 space-y-1 text-[13px]">
            {SECTIONS.map(([a, l]) => (
              <li key={a}><a href={`#${a}`} className="block rounded-md px-2 py-1 text-ink-soft hover:bg-white hover:text-ink">{l}</a></li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-12">
          <section id="apercu" className="scroll-mt-8">
            <SectionTitle>Vue d&apos;ensemble et architecture</SectionTitle>
            <Card className="p-6">
              <p className="text-[15px] leading-relaxed text-ink">{v.architecture.summary}</p>
              <ul className="mt-4 space-y-2">
                {v.architecture.points.map((p) => (
                  <li key={p} className="flex gap-2.5 text-[14px] text-ink-soft"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "#FF5823" }} />{p}</li>
                ))}
              </ul>
              <SourceChips className="mt-4" refs={resolveRefs(v.architecture.sources)} />
            </Card>
          </section>

          <section id="composants" className="scroll-mt-8">
            <SectionTitle>Solutions et composants proposés</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              {v.components.map((c) => (
                <Card key={c.name} className="p-5">
                  <div className="text-[14.5px] font-semibold text-ink">{c.name}</div>
                  <p className="mt-1 text-[13.5px] text-ink-soft">{c.role}</p>
                  <SourceChips className="mt-3" refs={resolveRefs(c.sources)} />
                </Card>
              ))}
            </div>
          </section>

          <section id="perimetre" className="scroll-mt-8">
            <SectionTitle>Périmètre fonctionnel</SectionTitle>
            <Rows items={v.scope.map((s) => ({ label: s.label, value: s.detail, sources: s.sources }))} />
          </section>

          <section id="integrations" className="scroll-mt-8">
            <SectionTitle>Intégrations</SectionTitle>
            <Rows items={v.integrations.map((s) => ({ label: s.target, value: s.detail, sources: s.sources }))} />
          </section>

          <section id="finances" className="scroll-mt-8">
            <SectionTitle hint={<Link href="/finances" className="font-medium text-ink underline underline-offset-2">Analyse financière comparée</Link>}>Modèle financier</SectionTitle>
            <Rows items={v.financial} />
            <p className="mt-2 text-[12.5px] text-ink-mute">Montants HTVA, tels que documentés.</p>
          </section>

          <section id="mise-en-oeuvre" className="scroll-mt-8">
            <SectionTitle>Modalités de mise en œuvre</SectionTitle>
            <Rows items={v.implementation} />
          </section>

          <section id="contrat" className="scroll-mt-8">
            <SectionTitle>Conditions contractuelles disponibles</SectionTitle>
            <Rows items={v.contract} />
          </section>

          <section id="limites" className="scroll-mt-8">
            <SectionTitle>Limites et dépendances documentées</SectionTitle>
            <Card className="divide-y divide-paper-line">
              {v.limits.map((l) => (
                <div key={l.text} className="p-5">
                  <p className="text-[14px] text-ink">{l.text}</p>
                  <SourceChips className="mt-2" refs={resolveRefs(l.sources)} />
                </div>
              ))}
            </Card>
          </section>

          <section id="questions" className="scroll-mt-8">
            <SectionTitle hint={<Link href={`/questions?scope=${id}`} className="font-medium text-ink underline underline-offset-2">Filtrer dans les questions ouvertes</Link>}>
              Questions ouvertes ({questions.length})
            </SectionTitle>
            <Card className="divide-y divide-paper-line">
              {questions.map((q) => (
                <div key={q.id} className="p-5">
                  <div className="flex flex-wrap gap-2">
                    <Pill tone={q.type === "contradiction" ? "accent" : q.type === "vigilance" ? "warm" : "neutral"}>
                      {q.type === "soulevee" ? "Soulevé dans la documentation" : q.type === "vigilance" ? "Point de vigilance" : "Contradiction"}
                    </Pill>
                    <Pill>{THEME_LABELS[q.theme] ?? q.theme}</Pill>
                  </div>
                  <h3 className="mt-2 text-[14.5px] font-semibold text-ink">{q.title}</h3>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-ink-soft">{q.detail}</p>
                  <SourceChips className="mt-2" refs={resolveRefs(q.sources)} />
                </div>
              ))}
            </Card>
          </section>

          <section id="documents" className="scroll-mt-8">
            <SectionTitle>Documents sources</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              {v.documents.map((d) => {
                const doc = getDocument(d);
                if (!doc) return null;
                return (
                  <Link key={d} href={`/bibliotheque/document?id=${encodeURIComponent(d)}`} className="group">
                    <Card className="h-full p-4 transition group-hover:shadow-lift">
                      <div className="text-[11.5px] font-medium uppercase tracking-wide text-ink-mute">{NATURE_LABELS[doc.nature]} · {doc.format.toUpperCase()} · {doc.pageCount} {doc.locatorType}{doc.pageCount > 1 ? "s" : ""}</div>
                      <div className="mt-1 text-[14px] font-medium text-ink group-hover:text-caritas-red">{doc.title}</div>
                      {doc.note && <p className="mt-1 text-[12px] text-ink-mute">{doc.note}</p>}
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
