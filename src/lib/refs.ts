import type { SourceRef } from "@/data/types";
import { getDocument, locatorLabel } from "./knowledge";

/** Référence résolue, sérialisable vers les composants clients. */
export interface ResolvedRef {
  docId: string;
  docTitle: string;
  shortTitle: string;
  page: number;
  label: string;
  note?: string;
}

export function shortTitle(title: string): string {
  return title.replace(/\s*\(.*?\)\s*$/, "").slice(0, 60);
}

export function resolveRef(r: SourceRef): ResolvedRef {
  const d = getDocument(r.doc);
  const title = d?.title ?? r.doc;
  return { docId: r.doc, docTitle: title, shortTitle: d?.short ?? shortTitle(title), page: r.page, label: locatorLabel(r.doc, r.page), note: r.note };
}

export const resolveRefs = (refs: SourceRef[]) => refs.map(resolveRef);
