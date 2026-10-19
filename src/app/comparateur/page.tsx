"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTitle } from "@/lib/use-title";
import { tr } from "@/lib/i18n";
import { PageHeader } from "@/components/ui";
import { ComparatorClient, type DimensionView } from "@/components/ComparatorClient";
import { DIMENSIONS } from "@/data/comparison";
import { VENDOR_IDS } from "@/data/vendor-meta";
import { resolveRefs } from "@/lib/refs";

export default function ComparateurPage() {
  return (
    <Suspense>
      <Comparateur />
    </Suspense>
  );
}

function Comparateur() {
  useTitle("Comparateur");
  const focus = useSearchParams().get("d") ?? undefined;
  const dims: DimensionView[] = DIMENSIONS.map((d) => ({
    id: d.id,
    label: d.label,
    question: d.question,
    requirement: { text: d.requirement.text, refs: resolveRefs(d.requirement.sources) },
    cells: Object.fromEntries(
      VENDOR_IDS.map((v) => [v, { status: d.cells[v].status, summary: d.cells[v].summary, details: d.cells[v].details ?? [], refs: resolveRefs(d.cells[v].sources) }]),
    ) as DimensionView["cells"],
  }));
  return (
    <div>
      <PageHeader
        eyebrow={tr("Comparateur")}
        title={tr("Comparer les propositions")}
        intro={tr("Choisissez les propositions et les dimensions à afficher. Chaque cellule indique ce que la documentation établit, avec ses sources. Le statut décrit l'état de la documentation, pas une appréciation : « Non précisé » signifie que les documents reçus ne permettent pas de conclure, ce qui n'équivaut pas à l'absence de la fonctionnalité.")}
      />
      <ComparatorClient dimensions={dims} focus={focus} />
    </div>
  );
}
