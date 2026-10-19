/**
 * Accès à la base documentaire déchiffrée (en mémoire, dans le navigateur).
 */
import { KNOWLEDGE } from "@/data/store";
import type { Chunk, DocMeta, PageText } from "./knowledge-types";

export type { Chunk, DocMeta, PageText } from "./knowledge-types";

export function getDocuments(): DocMeta[] {
  return KNOWLEDGE.documents;
}

export function getDocument(id: string): DocMeta | undefined {
  return KNOWLEDGE.documents.find((d) => d.id === id);
}

export function getChunks(): Chunk[] {
  return KNOWLEDGE.chunks;
}

export function getPages(docId: string): PageText[] {
  return KNOWLEDGE.pages[docId] ?? [];
}

/** Nom du fichier chiffré de l'original, s'il est disponible. */
export function originalFileName(docId: string): string | undefined {
  return KNOWLEDGE.files[docId];
}

/** Libellé lisible d'une référence (ex. « p. 4 », « Diapositive 3 »). */
export function locatorLabel(docId: string, page: number): string {
  const d = getDocument(docId);
  if (!d) return `${docId} · ${page}`;
  const p = d.pages.find((x) => x.page === page);
  return p ? p.label : `${d.locatorType} ${page}`;
}

export const NATURE_LABELS: Record<DocMeta["nature"], string> = {
  reference: "Référentiel Caritas",
  offre: "Offre / proposition",
  contrat: "Document contractuel",
  presentation: "Présentation fournisseur",
  interne: "Document interne de travail",
  tiers: "Retour d'expérience tiers",
};

export const MIME: Record<DocMeta["format"], string> = {
  pdf: "application/pdf",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};
