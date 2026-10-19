/**
 * Garde-fou avant publication : vérifie que rien de confidentiel n'apparaît en clair
 *   - dans le site généré (out/, hors coffre chiffré) ;
 *   - dans les fichiers versionnés du dépôt (hors coffre chiffré).
 *
 * Toujours : recherche de montants en euros.
 * Si private/ est présent (poste de mise à jour) : recherche des noms de propositions, partenaires,
 * émetteurs de documents, évaluateurs et montants des scénarios.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { loadPrivate, PRIV, ROOT } from "./payload";

const AMOUNT = /\d{1,3}(?:[   .]\d{3})+(?:,\d+)? ?€/;

async function sensitiveTerms(): Promise<string[]> {
  if (!fs.existsSync(path.join(PRIV, "data"))) return [];
  const { data, knowledge } = await loadPrivate();
  const terms = new Set<string>();
  const add = (s?: string | null) => s && s.split(/ · | \+ |, /).map((x) => x.trim()).filter((x) => x.length >= 4).forEach((x) => terms.add(x));
  for (const v of Object.values(data.VENDOR_META)) [v.name, v.short, v.partner, v.sub].forEach(add);
  for (const d of knowledge.documents) add(d.issuer);
  for (const e of data.EVALUATORS) add(e.name);
  for (const s of data.SCENARIOS) {
    for (const n of [s.licence, s.setup, s.excelTotal]) {
      if (!n || n < 1000) continue;
      const int = Math.round(n);
      terms.add(String(int));
      terms.add(int.toLocaleString("fr-BE").replace(/ | /g, " "));
    }
  }
  for (const t of [...terms]) if (/caritas/i.test(t)) terms.delete(t);
  return [...terms];
}

function files(): { label: string; abs: string }[] {
  const out: { label: string; abs: string }[] = [];
  const outDir = path.join(ROOT, "out");
  const walk = (d: string) => {
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f);
      if (p === path.join(outDir, "vault")) continue;
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (/\.(html|js|txt|json|css)$/.test(p)) out.push({ label: path.relative(ROOT, p), abs: p });
    }
  };
  if (fs.existsSync(outDir)) walk(outDir);
  const tracked = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { cwd: ROOT, encoding: "utf-8" }).split("\n").filter(Boolean);
  for (const f of tracked) {
    if (f.startsWith("public/vault/") || f === "package-lock.json" || f === "scripts/check-public.ts") continue;
    const abs = path.join(ROOT, f);
    if (fs.existsSync(abs)) out.push({ label: f, abs });
  }
  return out;
}

async function main() {
  const terms = await sensitiveTerms();
  const hits: string[] = [];
  for (const f of files()) {
    const s = fs.readFileSync(f.abs, "utf-8").replace(/ | /g, " ");
    const m = s.match(AMOUNT);
    if (m) hits.push(`${f.label} : montant « ${m[0]} »`);
    const low = s.toLowerCase();
    for (const t of terms) if (low.includes(t.toLowerCase())) hits.push(`${f.label} : « ${t} »`);
  }
  if (hits.length) {
    console.error(`Contenu confidentiel détecté en clair (${hits.length}) :\n` + hits.slice(0, 60).join("\n"));
    process.exit(1);
  }
  console.log(`OK : rien de confidentiel en clair (${terms.length ? `${terms.length} termes sensibles vérifiés` : "contrôle générique, private/ absent"}).`);
}

main();
