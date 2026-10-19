"use client";

import { useTitle } from "@/lib/use-title";
import { tr } from "@/lib/i18n";
import { Card, PageHeader, SectionTitle, SourceChips } from "@/components/ui";
import { FinanceClient, type ScenarioView } from "@/components/FinanceClient";
import { SCENARIOS, COMPARABILITY, FINANCE_METHOD, FINANCE_UI, OTHER_AMOUNTS } from "@/data/finance";
import { resolveRefs, resolveRef } from "@/lib/refs";

export default function FinancesPage() {
  useTitle("Analyse financière");
  const scenarios: ScenarioView[] = SCENARIOS.map((s) => ({
    ...s,
    refs: resolveRefs(s.sources),
    notIncludedView: s.notIncluded.map((n) => ({ text: n.text, refs: resolveRefs(n.sources) })),
  }));
  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow={tr("Analyse financière")}
        title={tr("Les offres, poste par poste")}
        intro={tr("Montants HTVA tels que documentés, ou TVAC d'un clic. Le calcul sur trois ans reprend la formule du dossier d'évaluation, visible ci-dessous ; les curseurs permettent de tester les hypothèses. Les périmètres couverts par chaque offre diffèrent : lisez les totaux avec les exclusions et les avertissements de comparabilité.")}
      />

      <Card className="p-5">
        <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-mute">{tr("Formule utilisée")}</div>
        <p className="mt-1 font-mono text-[13.5px] text-ink">{FINANCE_METHOD.formula}</p>
        <p className="mt-2 text-[13px] text-ink-soft">{FINANCE_METHOD.recurringNote}</p>
        <SourceChips className="mt-3" refs={[...resolveRefs(FINANCE_METHOD.sources), resolveRef(FINANCE_METHOD.vatSource)]} />
      </Card>

      <FinanceClient scenarios={scenarios} vatRate={FINANCE_METHOD.vatRate} recurringLabel={FINANCE_UI.recurringLabel} recurringHint={FINANCE_UI.recurringHint} />

      <section>
        <SectionTitle>{tr("Pourquoi les totaux ne sont pas directement comparables")}</SectionTitle>
        <div className="grid gap-3 md:grid-cols-2">
          {COMPARABILITY.map((c) => (
            <Card key={c.title} className="p-5">
              <h3 className="text-[14px] font-semibold text-ink">{c.title}</h3>
              <p className="mt-1 text-[13.5px] leading-relaxed text-ink-soft">{c.text}</p>
              <SourceChips className="mt-2" refs={resolveRefs(c.sources)} />
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle hint={tr("Documentés, mais non intégrés au calcul du dossier d'évaluation")}>{tr("Autres montants figurant dans les documents")}</SectionTitle>
        <Card className="divide-y divide-paper-line">
          {OTHER_AMOUNTS.map((o) => (
            <div key={o.label} className="grid gap-2 p-4 md:grid-cols-[minmax(0,1.3fr)_auto_minmax(0,1fr)] md:items-center md:gap-6">
              <div className="text-[13.5px] text-ink-soft">{o.label}</div>
              <div className="text-[14px] font-medium text-ink tnum">{o.value}</div>
              <SourceChips refs={resolveRefs(o.sources)} />
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}
