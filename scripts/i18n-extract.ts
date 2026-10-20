/**
 * Liste les textes du dossier à traduire (données structurées et métadonnées des documents)
 * et signale ceux qui manquent dans private/i18n/en.json.
 *
 *   npm run i18n:check
 */
import fs from "node:fs";
import path from "node:path";
import { loadPrivate, PRIV } from "./payload";

const NO_TRANSLATE = new Set(["id", "doc", "vendor", "scope", "theme", "type", "status", "group", "color", "variantOf", "file", "format", "nature", "vendors", "themes", "docId", "short"]);
/** Blocs jamais traduits : identifiants, configuration de recherche, données non affichées. */
const SKIP_BLOCKS = new Set(["documents", "VENDOR_ORDER", "LEXICON", "VENDOR_TERMS", "TECH_CHECKS", "OFFER_DEADLINES"]);

const isIdentifierValue = (x: unknown) => typeof x === "string" || (Array.isArray(x) && x.every((y) => typeof y === "string")) || (!!x && typeof x === "object" && !Array.isArray(x) && Object.values(x as object).every((y) => typeof y !== "object" || Array.isArray(y)));

function collect(v: unknown, out: Set<string>, key = "") {
  if (typeof v === "string") {
    if (!NO_TRANSLATE.has(key) && /[A-Za-zÀ-ÿ]/.test(v)) out.add(v);
  } else if (Array.isArray(v)) v.forEach((x) => collect(x, out, key));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) if (!SKIP_BLOCKS.has(k) && (!NO_TRANSLATE.has(k) || !isIdentifierValue(x))) collect(x, out, NO_TRANSLATE.has(k) ? "" : k);
}

async function main() {
  const { data, knowledge } = await loadPrivate();
  const all = new Set<string>();
  collect(data, all);
  for (const d of knowledge.documents) for (const s of [d.title, d.short, d.description, d.note, d.date]) if (s && /[A-Za-zÀ-ÿ]/.test(s)) all.add(s);
  const dir = path.join(PRIV, "i18n");
  fs.mkdirSync(dir, { recursive: true });
  const enPath = path.join(dir, "en.json");
  const en: Record<string, string> = fs.existsSync(enPath) ? JSON.parse(fs.readFileSync(enPath, "utf-8")) : {};
  const missing = [...all].filter((s) => !(s in en));
  fs.writeFileSync(path.join(dir, "missing.json"), JSON.stringify(missing, null, 1));
  const unused = Object.keys(en).filter((k) => !all.has(k));
  console.log(`${all.size} textes ; ${missing.length} sans traduction (private/i18n/missing.json) ; ${unused.length} traductions inutilisées.`);
  if (process.argv.includes("--prune") && unused.length) {
    for (const k of unused) delete en[k];
    fs.writeFileSync(enPath, JSON.stringify(en, null, 1));
    console.log(`${unused.length} traductions inutilisées supprimées.`);
  }
  if (process.argv.includes("--strict") && missing.length) process.exit(1);
}
main();
