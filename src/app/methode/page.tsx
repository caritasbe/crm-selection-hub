"use client";

import { useTitle } from "@/lib/use-title";
import { Card, PageHeader, SectionTitle, SourceChips } from "@/components/ui";
import { STEPS, FAMILIES, SCALE, NOT_SCORED, GOVERNANCE, EVALUATORS, WEIGHTS_NOTE } from "@/data/evaluation";
import { resolveRefs } from "@/lib/refs";
import type { FamilyId } from "@/data/store";

export default function MethodePage() {
  useTitle("Méthode & critères");
  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Méthode & critères"
        title="Comment le comité évalue"
        intro="Reprise fidèle du dossier d'évaluation V3, qui reste la référence. Cet outil n'attribue, ne calcule et n'affiche aucune note."
      />

      <section>
        <SectionTitle>Trois étapes</SectionTitle>
        <div className="grid gap-3 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Card key={s.title} className="p-5">
              <div className="text-[12px] font-semibold text-caritas-red">Étape {i + 1}</div>
              <h3 className="mt-1 text-[15px] font-semibold text-ink">{s.title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">{s.text}</p>
            </Card>
          ))}
        </div>
        <SourceChips className="mt-3" refs={resolveRefs([{ doc: "eval", page: 1 }])} />
      </section>

      <section>
        <SectionTitle hint="Repères de notation de 1 à 5, NSP possible">Les 12 critères et leurs repères</SectionTitle>
        <div className="space-y-4">
          {FAMILIES.map((f) => (
            <Card key={f.id} className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-paper-line bg-paper-warm/50 px-5 py-3">
                <h3 className="text-[15px] font-semibold text-ink">{f.id}. {f.label}</h3>
                <span className="text-[14px] font-semibold tnum">{Math.round(f.weight * 100)} %</span>
              </div>
              <div className="divide-y divide-paper-line">
                {f.criteria.map((c) => (
                  <div key={c.id} className="grid gap-2 p-5 md:grid-cols-[1fr_1.3fr] md:gap-6">
                    <div className="text-[14px] font-medium text-ink">{c.id}. {c.q}</div>
                    <ul className="space-y-1 text-[13px] text-ink-soft">{c.scale.map((s) => <li key={s}>{s}</li>)}</ul>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
        <Card className="mt-4 p-5">
          <div className="text-[13px] font-semibold text-ink">Échelle</div>
          <p className="mt-1 text-[13px] text-ink-soft">{SCALE.join(" · ")}</p>
          <div className="mt-4 text-[13px] font-semibold text-ink">Ce qui n&apos;est pas noté</div>
          <p className="mt-1 text-[13px] text-ink-soft">{NOT_SCORED}</p>
          <SourceChips className="mt-3" refs={resolveRefs([{ doc: "eval", page: 2 }, { doc: "eval", page: 8 }])} />
        </Card>
      </section>

      <section>
        <SectionTitle hint={WEIGHTS_NOTE}>Pondérations par évaluateur</SectionTitle>
        <Card className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[620px] text-[13.5px]">
            <thead className="bg-paper-warm/60 text-left">
              <tr>
                <th className="p-3 font-semibold">Évaluateur</th>
                <th className="p-3 font-semibold">Fonction</th>
                {FAMILIES.map((f) => <th key={f.id} className="p-3 text-center font-semibold" title={f.label}>{f.id}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {EVALUATORS.map((e) => (
                <tr key={e.name}>
                  <td className="p-3 font-medium text-ink">{e.name}</td>
                  <td className="p-3 text-ink-soft">{e.fn}</td>
                  {FAMILIES.map((f) => (
                    <td key={f.id} className="p-3 text-center tnum">
                      <span className="inline-flex items-center gap-1">
                        {[1, 2, 3].map((n) => <span key={n} className={`h-1.5 w-3 rounded-full ${n <= e.w[f.id as FamilyId] ? "bg-ink" : "bg-paper-deep"}`} />)}
                      </span>
                      <span className="sr-only">{e.w[f.id as FamilyId]}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-paper-line p-3 text-[12.5px] text-ink-mute">3 = expertise de référence · 2 = expertise pertinente · 1 = voix standard. Une abstention (NSP) est exclue du calcul, elle ne vaut pas zéro.</p>
        </Card>
        <SourceChips className="mt-3" refs={resolveRefs([{ doc: "eval", page: 5 }])} />
      </section>

      <section>
        <SectionTitle>Gouvernance de la décision</SectionTitle>
        <Card className="p-5">
          <p className="text-[14px] leading-relaxed text-ink">{GOVERNANCE}</p>
          <SourceChips className="mt-3" refs={resolveRefs([{ doc: "eval", page: 1 }, { doc: "eval", page: 7 }])} />
        </Card>
      </section>

      <section>
        <SectionTitle>Principes de cet outil</SectionTitle>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            ["Neutralité", "Aucune recommandation, aucun classement, aucune note. Les propositions apparaissent toujours dans l'ordre du dossier d'évaluation, avec la même structure."],
            ["Traçabilité", "Chaque information renvoie au document et à la page, la diapositive, l'onglet ou la section d'origine."],
            ["Fiabilité", "Aucune donnée n'est inventée. « Non précisé » signale une absence d'information, pas une absence de fonctionnalité."],
            ["Transparence", "Contradictions entre documents, hypothèses et informations non confirmées sont signalées dans la section Questions ouvertes."],
            ["Documents historiques", "Les documents internes antérieurs aux offres de septembre-octobre 2026 contiennent des recommandations et des chiffres depuis actualisés ; ils sont signalés comme tels."],
            ["Données exclues", "L'onglet « Archive V1 » du dossier d'évaluation (notes individuelles d'une grille abandonnée) n'est ni indexé ni affiché."],
          ].map(([t, d]) => (
            <Card key={t} className="p-5">
              <h3 className="text-[14px] font-semibold text-ink">{t}</h3>
              <p className="mt-1 text-[13.5px] leading-relaxed text-ink-soft">{d}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
