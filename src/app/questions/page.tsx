"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTitle } from "@/lib/use-title";
import { tr } from "@/lib/i18n";
import { PageHeader } from "@/components/ui";
import { QuestionsClient } from "@/components/QuestionsClient";
import { QUESTIONS, THEME_LABELS } from "@/data/questions";
import { resolveRefs } from "@/lib/refs";

export default function QuestionsPage() {
  return (
    <Suspense>
      <Questions />
    </Suspense>
  );
}

function Questions() {
  useTitle("Questions ouvertes");
  const params = useSearchParams();
  const items = QUESTIONS.map((q) => ({ ...q, refs: resolveRefs(q.sources) }));
  return (
    <div>
      <PageHeader
        eyebrow={tr("Questions ouvertes")}
        title={tr("Ce qui reste à clarifier")}
        intro={tr("Points issus de la documentation, classés en trois types : ceux soulevés dans les documents eux-mêmes (cahier des charges, offres, échanges consignés), les points de vigilance identifiés par l'analyse documentaire, et les contradictions entre documents. Chaque point renvoie à ses sources. Le nombre de points par proposition dépend surtout du volume de documentation reçue : il ne mesure pas la qualité d'une offre.")}
      />
      <QuestionsClient items={items} themes={THEME_LABELS} initialScope={params.get("scope") ?? undefined} initialQuery={params.get("q") ?? undefined} />
    </div>
  );
}
