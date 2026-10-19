/**
 * Restaure les données en clair dans private/ à partir du coffre du dépôt.
 *
 *   VAULT_PASSWORD='…' npm run unseal
 *
 * Utile pour modifier les fiches (private/data/*.ts) ou ajouter un document sur un autre poste.
 * private/ est exclu de Git.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { deriveKey, decrypt, gunzip, fromB64, type VaultMeta } from "../src/lib/crypto";
import type { VaultPayload } from "../src/data/store";

const ROOT = path.resolve(__dirname, "..");
const PRIV = path.join(ROOT, "private");
const OUT = path.join(ROOT, "public", "vault");

async function main() {
  const password = process.env.VAULT_PASSWORD;
  if (!password) throw new Error("VAULT_PASSWORD manquant.");
  const meta = JSON.parse(fs.readFileSync(path.join(OUT, "meta.json"), "utf-8")) as VaultMeta;
  const key = await deriveKey(password, fromB64(meta.salt), meta.iterations);
  const open = async (f: string) => {
    try { return await decrypt(key, new Uint8Array(fs.readFileSync(path.join(OUT, f)))); }
    catch { throw new Error("Mot de passe incorrect."); }
  };

  fs.mkdirSync(PRIV, { recursive: true });
  execFileSync("tar", ["-xzf", "-", "-C", PRIV], { input: Buffer.from(await open(meta.source)) });

  const payload = JSON.parse(new TextDecoder().decode(await gunzip(await open(meta.core)))) as VaultPayload;
  const K = path.join(PRIV, "knowledge");
  fs.mkdirSync(path.join(K, "pages"), { recursive: true });
  fs.writeFileSync(path.join(K, "documents.json"), JSON.stringify(payload.knowledge.documents, null, 1));
  fs.writeFileSync(path.join(K, "chunks.json"), JSON.stringify(payload.knowledge.chunks));
  for (const [id, pages] of Object.entries(payload.knowledge.pages)) fs.writeFileSync(path.join(K, "pages", `${id}.json`), JSON.stringify(pages, null, 1));

  for (const d of payload.knowledge.documents) {
    const f = payload.knowledge.files[d.id];
    if (!f) continue;
    const dest = path.join(PRIV, "documents", d.file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, await open(path.join("files", f)));
  }
  console.log(`Restauré dans private/ : sources, ${payload.knowledge.documents.length} documents, base de recherche.`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
