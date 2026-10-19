/** Types de la base documentaire produite par scripts/ingest.py. */
export interface DocMeta {
  id: string;
  file: string;
  title: string;
  short?: string;
  issuer: string;
  date: string;
  vendors: string[];
  nature: "reference" | "offre" | "contrat" | "presentation" | "interne" | "tiers";
  description: string;
  note?: string;
  format: "pdf" | "pptx" | "xlsx" | "docx";
  pageCount: number;
  locatorType: string;
  pages: { page: number; label: string }[];
  sizeBytes: number;
  chunkCount: number;
  themes: string[];
}

export interface Chunk {
  id: string;
  docId: string;
  page: number;
  label: string;
  vendors: string[];
  themes: string[];
  text: string;
}

export interface PageText {
  page: number;
  label: string;
  text: string;
}
