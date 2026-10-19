import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { deriveKey, encrypt, decrypt, gzip, gunzip, exportKey, importKey } from "../src/lib/crypto";

test("chiffrement : aller-retour, mauvais mot de passe refusé, altération détectée", async () => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey("correct-horse-battery", salt, 1000);
  const plain = new TextEncoder().encode(JSON.stringify({ hello: "monde", n: 42 }));
  const sealed = await encrypt(key, await gzip(plain));
  assert.deepEqual(await gunzip(await decrypt(key, sealed)), plain);

  const reimported = await importKey(await exportKey(key));
  assert.deepEqual(await gunzip(await decrypt(reimported, sealed)), plain);

  const wrong = await deriveKey("mauvais-mot-de-passe", salt, 1000);
  await assert.rejects(decrypt(wrong, sealed));

  const tampered = sealed.slice();
  tampered[tampered.length - 1] ^= 1;
  await assert.rejects(decrypt(key, tampered));
});

test("le coffre publié ne contient aucun texte en clair", () => {
  const dir = path.join(__dirname, "..", "public", "vault");
  if (!fs.existsSync(path.join(dir, "meta.json"))) return; // coffre pas encore scellé
  const meta = JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf-8"));
  assert.deepEqual(Object.keys(meta).sort(), ["core", "iterations", "kdf", "salt", "source", "v"]);
  assert.ok(meta.iterations >= 600_000);
  const files = [meta.core, meta.source, ...fs.readdirSync(path.join(dir, "files")).map((f) => `files/${f}`)];
  for (const f of files) {
    const head = fs.readFileSync(path.join(dir, f)).subarray(0, 4096).toString("latin1");
    assert.ok(!/%PDF|PK\x03\x04|\{"|\x1f\x8b/.test(head.slice(12, 40)), `${f} ressemble à un fichier en clair`);
  }
});
