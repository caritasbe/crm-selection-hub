/**
 * Données de l'application, vides au chargement.
 * Elles sont remplies par hydrate() une fois le coffre déchiffré dans le navigateur
 * (voir src/lib/vault.ts). Aucune donnée confidentielle ne figure dans le code publié.
 */
import type { Dimension, FinanceScenario, OpenQuestion, SourceRef, TechCheck, Vendor, VendorId } from "./types";
import type { Chunk, DocMeta, PageText } from "@/lib/knowledge-types";

type Ref = SourceRef;
export type FamilyId = "A" | "B" | "C" | "D";
export interface VendorMeta { name: string; partner: string; short: string; color: string; sub: string }

export interface StructuredData {
  VENDOR_ORDER: VendorId[];
  VENDORS: Record<VendorId, Vendor>;
  VENDOR_META: Record<VendorId, VendorMeta>;
  DIMENSIONS: Dimension[];
  STEPS: { title: string; text: string; page: number }[];
  FAMILIES: { id: string; label: string; weight: number; criteria: { id: string; q: string; scale: string[] }[] }[];
  SCALE: string[];
  NOT_SCORED: string;
  GOVERNANCE: string;
  EVALUATORS: { name: string; fn: string; w: Record<FamilyId, number> }[];
  WEIGHTS_NOTE: string;
  TECH_CHECKS: TechCheck[];
  TIMELINE: { date: string | null; label: string; source?: Ref }[];
  OFFER_DEADLINES: { vendor: VendorId; label: string; date: string | null; source: Ref }[];
  PROJECT_CONTEXT: {
    objective: string;
    objectiveSource: Ref;
    figures: { value: string; label: string; source: Ref }[];
    architecture: { layer: string; text: string }[];
    architectureSource: Ref;
  };
  FINANCE_METHOD: { formula: string; recurringNote: string; sources: Ref[]; vatRate: number; vatSource: Ref };
  FINANCE_UI: { recurringLabel: string; recurringHint: string };
  SCENARIOS: FinanceScenario[];
  COMPARABILITY: { title: string; text: string; sources: Ref[] }[];
  OTHER_AMOUNTS: { label: string; value: string; sources: Ref[] }[];
  QUESTIONS: OpenQuestion[];
  THEME_LABELS: Record<string, string>;
  SUGGESTIONS: string[];
  LEXICON: string[][];
  VENDOR_TERMS: Record<string, string[]>;
}

export interface KnowledgeData {
  documents: DocMeta[];
  chunks: Chunk[];
  pages: Record<string, PageText[]>;
  /** docId -> nom du fichier chiffré de l'original */
  files: Record<string, string>;
}

export interface VaultPayload {
  version: 1;
  sealedAt: string;
  data: StructuredData;
  knowledge: KnowledgeData;
}

/* Liaisons « vivantes » : les modules importateurs voient les valeurs après hydrate(). */
export let VENDOR_ORDER: StructuredData["VENDOR_ORDER"] = [];
export let VENDOR_IDS: StructuredData["VENDOR_ORDER"] = [];
export let VENDORS = {} as StructuredData["VENDORS"];
export let VENDOR_META = {} as StructuredData["VENDOR_META"];
export let SCOPE_LABEL: Record<string, string> = {};
export let DIMENSIONS: StructuredData["DIMENSIONS"] = [];
export let STEPS: StructuredData["STEPS"] = [];
export let FAMILIES: StructuredData["FAMILIES"] = [];
export let SCALE: StructuredData["SCALE"] = [];
export let NOT_SCORED = "";
export let GOVERNANCE = "";
export let EVALUATORS: StructuredData["EVALUATORS"] = [];
export let WEIGHTS_NOTE = "";
export let TECH_CHECKS: StructuredData["TECH_CHECKS"] = [];
export let TIMELINE: StructuredData["TIMELINE"] = [];
export let OFFER_DEADLINES: StructuredData["OFFER_DEADLINES"] = [];
export let PROJECT_CONTEXT = {} as StructuredData["PROJECT_CONTEXT"];
export let FINANCE_METHOD = {} as StructuredData["FINANCE_METHOD"];
export let FINANCE_UI = {} as StructuredData["FINANCE_UI"];
export let SCENARIOS: StructuredData["SCENARIOS"] = [];
export let COMPARABILITY: StructuredData["COMPARABILITY"] = [];
export let OTHER_AMOUNTS: StructuredData["OTHER_AMOUNTS"] = [];
export let QUESTIONS: StructuredData["QUESTIONS"] = [];
export let THEME_LABELS: StructuredData["THEME_LABELS"] = {};
export let SUGGESTIONS: StructuredData["SUGGESTIONS"] = [];
export let LEXICON: StructuredData["LEXICON"] = [];
export let VENDOR_TERMS: StructuredData["VENDOR_TERMS"] = {};
export let KNOWLEDGE: KnowledgeData = { documents: [], chunks: [], pages: {}, files: {} };
export let SEALED_AT = "";

export function hydrate(p: VaultPayload): void {
  const d = p.data;
  VENDOR_ORDER = d.VENDOR_ORDER;
  VENDOR_IDS = d.VENDOR_ORDER;
  VENDORS = d.VENDORS;
  VENDOR_META = d.VENDOR_META;
  SCOPE_LABEL = { ...Object.fromEntries(d.VENDOR_ORDER.map((v) => [v, d.VENDOR_META[v].name])), transversal: "Transversal" };
  DIMENSIONS = d.DIMENSIONS;
  STEPS = d.STEPS;
  FAMILIES = d.FAMILIES;
  SCALE = d.SCALE;
  NOT_SCORED = d.NOT_SCORED;
  GOVERNANCE = d.GOVERNANCE;
  EVALUATORS = d.EVALUATORS;
  WEIGHTS_NOTE = d.WEIGHTS_NOTE;
  TECH_CHECKS = d.TECH_CHECKS;
  TIMELINE = d.TIMELINE;
  OFFER_DEADLINES = d.OFFER_DEADLINES;
  PROJECT_CONTEXT = d.PROJECT_CONTEXT;
  FINANCE_METHOD = d.FINANCE_METHOD;
  FINANCE_UI = d.FINANCE_UI;
  SCENARIOS = d.SCENARIOS;
  COMPARABILITY = d.COMPARABILITY;
  OTHER_AMOUNTS = d.OTHER_AMOUNTS;
  QUESTIONS = d.QUESTIONS;
  THEME_LABELS = d.THEME_LABELS;
  SUGGESTIONS = d.SUGGESTIONS;
  LEXICON = d.LEXICON;
  VENDOR_TERMS = d.VENDOR_TERMS;
  KNOWLEDGE = p.knowledge;
  SEALED_AT = p.sealedAt;
}
