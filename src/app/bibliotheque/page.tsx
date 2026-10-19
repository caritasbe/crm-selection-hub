"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTitle } from "@/lib/use-title";
import { PageHeader } from "@/components/ui";
import { LibraryClient, type DocView } from "@/components/LibraryClient";
import { getDocuments, NATURE_LABELS } from "@/lib/knowledge";

export default function BibliothequePage() {
  return (
    <Suspense>
      <Bibliotheque />
    </Suspense>
  );
}

function Bibliotheque() {
  useTitle("Bibliothèque");
  const params = useSearchParams();
  const docs: DocView[] = getDocuments().map((d) => ({
    id: d.id, title: d.title, issuer: d.issuer, date: d.date, vendors: d.vendors, nature: d.nature, natureLabel: NATURE_LABELS[d.nature],
    description: d.description, note: d.note, format: d.format, pageCount: d.pageCount, locatorType: d.locatorType, themes: d.themes,
  }));
  return (
    <div>
      <PageHeader
        eyebrow="Bibliothèque documentaire"
        title={`${docs.length} documents de référence`}
        intro="Recherchez dans le contenu de tous les documents, filtrez par proposition, par nature ou par thème, et ouvrez les originaux. La recherche s\'exécute dans votre navigateur."
      />
      <LibraryClient docs={docs} natures={NATURE_LABELS} initialQuery={params.get("q") ?? undefined} />
    </div>
  );
}
