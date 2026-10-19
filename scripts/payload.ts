/**
 * Assemble les données en clair de private/ (sources TypeScript + base documentaire de npm run ingest).
 * Utilisé par le scellement et par les tests privés. Ne contient aucune donnée.
 */
import fs from "node:fs";
import path from "node:path";
import type { StructuredData, KnowledgeData } from "../src/data/store";

export const ROOT = path.resolve(__dirname, "..");
export const PRIV = path.join(ROOT, "private");

export async function loadPrivate(): Promise<{ data: StructuredData; knowledge: Omit<KnowledgeData, "files"> }> {
  // Données structurées (sources TypeScript de private/data)
  const mod = async (n: string) => import(path.join(PRIV, "data", `${n}.ts`));
  const [vendors, comparison, evaluation, finance, questions, ui, searchCfg] = await Promise.all(
    ["vendors", "comparison", "evaluation", "finance", "questions", "ui", "search-config"].map(mod),
  );
  const data: StructuredData = {
    VENDOR_ORDER: vendors.VENDOR_ORDER, VENDORS: vendors.VENDORS, VENDOR_META: ui.VENDOR_META,
    DIMENSIONS: comparison.DIMENSIONS,
    STEPS: evaluation.STEPS, FAMILIES: evaluation.FAMILIES, SCALE: evaluation.SCALE, NOT_SCORED: evaluation.NOT_SCORED,
    GOVERNANCE: evaluation.GOVERNANCE, EVALUATORS: evaluation.EVALUATORS, WEIGHTS_NOTE: evaluation.WEIGHTS_NOTE,
    TECH_CHECKS: evaluation.TECH_CHECKS, TIMELINE: evaluation.TIMELINE, OFFER_DEADLINES: evaluation.OFFER_DEADLINES,
    PROJECT_CONTEXT: evaluation.PROJECT_CONTEXT,
    FINANCE_METHOD: finance.FINANCE_METHOD, FINANCE_UI: ui.FINANCE_UI, SCENARIOS: finance.SCENARIOS,
    COMPARABILITY: finance.COMPARABILITY, OTHER_AMOUNTS: finance.OTHER_AMOUNTS,
    QUESTIONS: questions.QUESTIONS, THEME_LABELS: questions.THEME_LABELS,
    SUGGESTIONS: ui.SUGGESTIONS, LEXICON: searchCfg.LEXICON, VENDOR_TERMS: searchCfg.VENDOR_TERMS,
  };

  // Base documentaire (produite par npm run ingest)
  const K = path.join(PRIV, "knowledge");
  const documents = JSON.parse(fs.readFileSync(path.join(K, "documents.json"), "utf-8"));
  const chunks = JSON.parse(fs.readFileSync(path.join(K, "chunks.json"), "utf-8"));
  const pages: KnowledgeData["pages"] = {};
  for (const d of documents) pages[d.id] = JSON.parse(fs.readFileSync(path.join(K, "pages", `${d.id}.json`), "utf-8"));

  return { data, knowledge: { documents, chunks, pages } };
}
