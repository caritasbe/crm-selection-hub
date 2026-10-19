/**
 * Scelle le coffre : chiffre les données confidentielles de private/ vers public/vault/.
 *
 *   VAULT_PASSWORD='…' npm run seal
 *
 * - Le mot de passe n'est jamais écrit sur disque ni dans le dépôt.
 * - Si un coffre existe déjà, le mot de passe est vérifié contre lui et le sel est conservé
 *   (les membres déjà connectés n'ont pas à ressaisir le mot de passe). VAULT_NEW_PASSWORD=1 pour en changer.
 * - Les originaux inchangés gardent leur fichier chiffré : le dépôt ne grossit pas à chaque mise à jour.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { deriveKey, encrypt, decrypt, gzip, toB64, fromB64, KDF_ITERATIONS, type VaultMeta } from "../src/lib/crypto";
import type { VaultPayload } from "../src/data/store";
import { loadPrivate, PRIV, ROOT } from "./payload";

const OUT = path.join(ROOT, "public", "vault");
const FILES = path.join(OUT, "files");

async function main() {
  const password = process.env.VAULT_PASSWORD;
  if (!password || password.length < 12) throw new Error("VAULT_PASSWORD manquant (12 caractères minimum).");

  // Sel : conservé si le coffre existe et que le mot de passe correspond
  let salt = crypto.randomBytes(16) as Uint8Array;
  const metaPath = path.join(OUT, "meta.json");
  if (fs.existsSync(metaPath) && !process.env.VAULT_NEW_PASSWORD) {
    const old = JSON.parse(fs.readFileSync(metaPath, "utf-8")) as VaultMeta;
    const oldKey = await deriveKey(password, fromB64(old.salt), old.iterations);
    try {
      await decrypt(oldKey, new Uint8Array(fs.readFileSync(path.join(OUT, old.core))));
    } catch {
      throw new Error("Le mot de passe ne correspond pas au coffre existant. Pour changer de mot de passe : VAULT_NEW_PASSWORD=1.");
    }
    salt = fromB64(old.salt);
  }
  const key = await deriveKey(password, salt);

  const { data, knowledge } = await loadPrivate();
  const { documents, chunks, pages } = knowledge;

  // Originaux : un fichier chiffré par document, nom dérivé (sel + contenu), réutilisé s'il existe
  fs.mkdirSync(FILES, { recursive: true });
  const files: Record<string, string> = {};
  let reused = 0;
  for (const d of documents) {
    const src = path.join(PRIV, "documents", d.file);
    if (!fs.existsSync(src)) { console.warn(`  original absent : ${d.file}`); continue; }
    const bytes = fs.readFileSync(src);
    const name = crypto.createHash("sha256").update(salt).update(d.id).update(bytes).digest("hex").slice(0, 32) + ".bin";
    const dest = path.join(FILES, name);
    if (fs.existsSync(dest)) reused++;
    else fs.writeFileSync(dest, await encrypt(key, new Uint8Array(bytes)));
    files[d.id] = name;
  }
  const keep = new Set(Object.values(files));
  for (const f of fs.readdirSync(FILES)) if (!keep.has(f)) fs.rmSync(path.join(FILES, f));

  const enPath = path.join(PRIV, "i18n", "en.json");
  const en: Record<string, string> = fs.existsSync(enPath) ? JSON.parse(fs.readFileSync(enPath, "utf-8")) : {};
  if (!Object.keys(en).length) console.warn("  aucune traduction anglaise (private/i18n/en.json) : la version EN affichera le français.");
  const payload: VaultPayload = { version: 1, sealedAt: new Date().toISOString(), data, knowledge: { documents, chunks, pages, files }, i18n: { en } };

  // Archive des sources éditables, pour pouvoir tout restaurer depuis le dépôt (npm run unseal)
  const tgz = execFileSync("tar", ["-czf", "-", "-C", PRIV, "data", "manifest.json", ...["tests", "i18n"].filter((d) => fs.existsSync(path.join(PRIV, d)))]);

  for (const f of fs.readdirSync(OUT)) if (f.endsWith(".bin")) fs.rmSync(path.join(OUT, f));
  const rnd = () => crypto.randomBytes(12).toString("hex") + ".bin";
  const meta: VaultMeta = { v: 1, kdf: "PBKDF2-SHA256", iterations: KDF_ITERATIONS, salt: toB64(salt), core: rnd(), source: rnd() };
  fs.writeFileSync(path.join(OUT, meta.core), await encrypt(key, await gzip(new TextEncoder().encode(JSON.stringify(payload)))));
  fs.writeFileSync(path.join(OUT, meta.source), await encrypt(key, new Uint8Array(tgz)));
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n");

  const size = (p: string) => (fs.statSync(p).size / 1024 / 1024).toFixed(2) + " Mo";
  console.log(`Coffre scellé : ${documents.length} documents, ${chunks.length} passages, ${Object.keys(files).length} originaux (${reused} inchangés).`);
  console.log(`  données ${size(path.join(OUT, meta.core))} · sources ${size(path.join(OUT, meta.source))}`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
