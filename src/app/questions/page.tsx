"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTitle } from "@/lib/use-title";
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
        eyebrow="Questions ouvertes"
        title="Ce qui reste à clarifier"
        intro={
          <>
            Points issus de la documentation, classés en trois types : ceux <strong>soulevés dans les documents</strong> eux-mêmes (dossier d&apos;évaluation, cahier des charges,
            offres, échanges consignés), les <strong>points de vigilance</strong> identifiés par l&apos;analyse documentaire, et les <strong>contradictions</strong> entre documents.
            Chaque point renvoie à ses sources. Le nombre de points par proposition dépend surtout du volume de documentation reçue (par exemple, des conditions
            contractuelles complètes pour une offre et aucune pour une autre) : il ne mesure pas la qualité d&apos;une offre.
          </>
        }
      />
      <QuestionsClient items={items} themes={THEME_LABELS} initialScope={params.get("scope") ?? undefined} initialQuery={params.get("q") ?? undefined} />
    </div>
  );
}
