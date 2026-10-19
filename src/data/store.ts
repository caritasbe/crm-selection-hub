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

export type Lang = "fr" | "en";

export interface VaultPayload {
  version: 1;
  sealedAt: string;
  data: StructuredData;
  knowledge: KnowledgeData;
  /** Traductions des contenus (français → anglais), chiffrées avec le reste */
  i18n?: { en: Record<string, string> };
}

/** Clés dont la valeur est un identifiant, jamais un texte à traduire. */
const NO_TRANSLATE = new Set(["id", "doc", "vendor", "scope", "theme", "type", "status", "group", "color", "variantOf", "file", "format", "nature", "vendors", "themes", "docId", "short"]);
/** Blocs jamais traduits : identifiants, configuration de recherche, données non affichées. */
const SKIP_BLOCKS = new Set(["documents", "VENDOR_ORDER", "LEXICON", "VENDOR_TERMS", "TECH_CHECKS", "OFFER_DEADLINES"]);

/** Valeur d'identifiant : texte ou liste de textes (et non une liste d'objets à traduire). */
const isIdentifierValue = (x: unknown) => typeof x === "string" || (Array.isArray(x) && x.every((y) => typeof y === "string")) || (!!x && typeof x === "object" && !Array.isArray(x) && Object.values(x as object).every((y) => typeof y !== "object" || Array.isArray(y)));

function translateDeep<T>(v: T, dict: Record<string, string>, key = ""): T {
  if (typeof v === "string") return (NO_TRANSLATE.has(key) ? v : dict[v] ?? v) as T;
  if (Array.isArray(v)) return v.map((x) => translateDeep(x, dict, key)) as T;
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      // Les clés d'objets indexés par proposition (cells, values, w) ne sont pas traduites ; les valeurs le sont
      out[k] = SKIP_BLOCKS.has(k) || (NO_TRANSLATE.has(k) && isIdentifierValue(x)) ? x : translateDeep(x, dict, NO_TRANSLATE.has(k) ? "" : k);
    }
    return out as T;
  }
  return v;
}

const LOCATOR_EN: Record<string, string> = { page: "page", diapositive: "slide", onglet: "tab", section: "section" };

/** Libellés de page : « p. 4 », « Diapositive 3 », « onglet « X » », « § 2.1 Titre » */
function pageLabelEn(label: string, dict: Record<string, string>): string {
  return dict[label] ?? label.replace(/^Diapositive /, "Slide ").replace(/^onglet /, "tab ").replace(/^Section /, "Section ");
}

function translateKnowledge(k: KnowledgeData, dict: Record<string, string>): KnowledgeData {
  const documents = k.documents.map((d) => ({
    ...d,
    title: dict[d.title] ?? d.title,
    short: d.short ? dict[d.short] ?? d.short : d.short,
    description: dict[d.description] ?? d.description,
    note: d.note ? dict[d.note] ?? d.note : d.note,
    date: dict[d.date] ?? d.date,
    locatorType: LOCATOR_EN[d.locatorType] ?? d.locatorType,
    pages: d.pages.map((p) => ({ ...p, label: pageLabelEn(p.label, dict) })),
  }));
  const pages: KnowledgeData["pages"] = {};
  for (const [id, list] of Object.entries(k.pages)) pages[id] = list.map((p) => ({ ...p, label: pageLabelEn(p.label, dict) }));
  const chunks = k.chunks.map((c) => ({ ...c, label: pageLabelEn(c.label, dict) }));
  return { ...k, documents, pages, chunks };
}

let RAW: VaultPayload | null = null;
export let CURRENT_LANG: Lang = "fr";

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

export function hydrate(raw: VaultPayload, lang: Lang = CURRENT_LANG): void {
  RAW = raw;
  CURRENT_LANG = lang;
  const dict = lang === "en" ? raw.i18n?.en ?? {} : null;
  const p: VaultPayload = dict ? { ...raw, data: translateDeep(raw.data, dict), knowledge: translateKnowledge(raw.knowledge, dict) } : raw;
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

/** Change la langue des contenus déjà déchiffrés. */
export function setDataLang(lang: Lang): void {
  if (RAW) hydrate(RAW, lang);
  else CURRENT_LANG = lang;
}
