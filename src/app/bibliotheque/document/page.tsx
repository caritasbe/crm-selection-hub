"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import clsx from "clsx";
import { useSearchParams } from "next/navigation";
import { Card, VendorDot } from "@/components/ui";
import { getDocument, getPages, NATURE_LABELS } from "@/lib/knowledge";
import { SCOPE_LABEL } from "@/data/vendor-meta";
import type { VendorId } from "@/data/types";
import { HighlightText } from "@/components/HighlightText";
import { OriginalButton } from "@/components/OriginalButton";
import { useTitle } from "@/lib/use-title";
import { tr } from "@/lib/i18n";
import { PdfViewer } from "@/components/PdfViewer";
import { hasViewPdf } from "@/lib/vault";

export default function DocPage() {
  return (
    <Suspense>
      <Doc />
    </Suspense>
  );
}

function Doc() {
  const params = useSearchParams();
  const doc = getDocument(params.get("id") ?? "");
  useTitle(doc?.title ?? "Document", false);
  const target = Number(params.get("page")) || null;
  const query = params.get("q") ?? undefined;
  // Les numéros de page correspondent à ceux du PDF pour les PDF et les présentations ;
  // pour les classeurs (onglets) et les documents Word (sections), on ouvre le texte à la bonne section.
  const pagesMatchPdf = doc?.format === "pdf" || doc?.format === "pptx";
  const canView = !!doc && hasViewPdf(doc.id);
  const [mode, setMode] = useState<"doc" | "text">(() => (canView && !query && (!target || pagesMatchPdf) ? "doc" : "text"));

  // Défilement vers la page citée une fois le texte affiché
  useEffect(() => {
    if (!target || mode !== "text") return;
    const el = document.getElementById(`p${target}`);
    if (el) requestAnimationFrame(() => el.scrollIntoView({ block: "start" }));
  }, [target, doc?.id, mode]);

  if (!doc) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-[22px] font-semibold">{tr("Document introuvable")}</h1>
        <Link href="/bibliotheque" className="mt-4 inline-block text-[14px] underline">{tr("Retour à la bibliothèque")}</Link>
      </div>
    );
  }
  const pages = getPages(doc.id);

  return (
    <div>
      <Link href={query ? `/bibliotheque?q=${encodeURIComponent(query)}` : "/bibliotheque"} className="text-[13px] text-ink-mute hover:text-ink">← {tr("Bibliothèque")}</Link>
      <header className="mt-4 mb-8">
        <div className="flex flex-wrap items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-mute">
          {tr(NATURE_LABELS[doc.nature])} · {doc.format.toUpperCase()} · {doc.date}
        </div>
        <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight text-ink sm:text-[30px]">{doc.title}</h1>
        <p className="mt-2 text-[14px] text-ink-soft">{doc.issuer}</p>
        <div className="mt-2 flex flex-wrap gap-3 text-[12.5px] text-ink-mute">
          {doc.vendors.map((v) => (
            <span key={v} className="inline-flex items-center gap-1.5">{v !== "transversal" && <VendorDot id={v as VendorId} size={8} />}{v === "transversal" ? tr("Transversal") : SCOPE_LABEL[v]}</span>
          ))}
        </div>
        <p className="mt-4 max-w-3xl text-[14px] leading-relaxed text-ink-soft">{doc.description}</p>
        {doc.note && <p className="mt-3 max-w-3xl rounded-lg border border-caritas-orange/30 bg-caritas-beige/40 px-3.5 py-2.5 text-[13px] text-ink">{doc.note}</p>}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {canView && (
            <div className="inline-flex rounded-xl bg-paper-deep p-1" role="tablist">
              {([["doc", tr("Document")], ["text", tr("Texte extrait")]] as const).map(([m, l]) => (
                <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={clsx("rounded-lg px-3.5 py-1.5 text-[13px] transition", mode === m ? "bg-white font-medium text-ink shadow-card" : "text-ink-soft hover:text-ink")}>
                  {l}
                </button>
              ))}
            </div>
          )}
          <OriginalButton docId={doc.id} page={doc.format === "pdf" ? target : null} variant="secondary" />
        </div>
        {query && canView && mode === "doc" && (
          <p className="mt-3 text-[12.5px] text-ink-mute">{tr("Les termes recherchés sont surlignés dans l'onglet « Texte extrait ».")}</p>
        )}
      </header>

      {mode === "doc" ? (
        <PdfViewer docId={doc.id} page={pagesMatchPdf ? target : null} />
      ) : (
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Pages" className="no-print hidden lg:block">
          <div className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto pr-2 scrollbar-thin">
            <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-mute">{doc.locatorType}s</div>
            <ul className="space-y-0.5 text-[12.5px]">
              {pages.map((p) => (
                <li key={p.page}>
                  <a href={`#p${p.page}`} className={`block truncate rounded px-2 py-1 ${p.page === target ? "bg-caritas-beige font-medium text-ink" : "text-ink-soft hover:bg-white"}`}>{p.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
        <div className="min-w-0 space-y-4">
          <p className="text-[12.5px] text-ink-mute">{tr("Texte extrait automatiquement pour la recherche et la lecture rapide. La mise en page et les visuels de l'original peuvent différer : en cas de doute, l'original fait foi.")}</p>
          {pages.map((p) => (
            <Card key={p.page} className={`scroll-mt-6 p-5 ${p.page === target ? "ring-2 ring-caritas-orange/50" : ""}`}>
              <div id={`p${p.page}`} className="scroll-mt-6 mb-3 flex items-center justify-between text-[12px] font-semibold uppercase tracking-wide text-ink-mute">
                <span>{p.label}</span>
                {doc.format === "pdf" && <OriginalButton docId={doc.id} page={p.page} variant="link">{tr("voir dans l'original")}</OriginalButton>}
              </div>
              {p.text ? (
                <div className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-ink"><HighlightText text={p.text} query={query} /></div>
              ) : (
                <p className="text-[13px] italic text-ink-mute">{tr("Aucun texte extractible (page visuelle) : consultez l'original.")}</p>
              )}
            </Card>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}
