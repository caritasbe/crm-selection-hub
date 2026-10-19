/**
 * Chiffrement du coffre : PBKDF2-SHA256 (600 000 itérations) puis AES-256-GCM.
 * Code commun au navigateur et à Node (Web Crypto standard).
 * Format d'un fichier chiffré : IV (12 octets) suivi du texte chiffré et de son tag d'authentification.
 */

export const KDF_ITERATIONS = 600_000;

const subtle = () => globalThis.crypto.subtle;

export function toB64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export function fromB64(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

export async function deriveKey(password: string, salt: Uint8Array, iterations = KDF_ITERATIONS): Promise<CryptoKey> {
  const base = await subtle().importKey("raw", new TextEncoder().encode(password.normalize("NFC")), "PBKDF2", false, ["deriveKey"]);
  return subtle().deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    base,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

export async function exportKey(key: CryptoKey): Promise<string> {
  return toB64(new Uint8Array(await subtle().exportKey("raw", key)));
}

export async function importKey(b64: string): Promise<CryptoKey> {
  return subtle().importKey("raw", fromB64(b64) as BufferSource, { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);
}

export async function encrypt(key: CryptoKey, plain: Uint8Array): Promise<Uint8Array> {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await subtle().encrypt({ name: "AES-GCM", iv }, key, plain as BufferSource));
  const out = new Uint8Array(12 + ct.length);
  out.set(iv, 0);
  out.set(ct, 12);
  return out;
}

/** Lève une erreur si la clé est mauvaise ou si le fichier a été altéré (authentification GCM). */
export async function decrypt(key: CryptoKey, sealed: Uint8Array): Promise<Uint8Array> {
  const iv = sealed.subarray(0, 12);
  return new Uint8Array(await subtle().decrypt({ name: "AES-GCM", iv }, key, sealed.subarray(12) as BufferSource));
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream as unknown as ReadableWritablePair<Uint8Array, Uint8Array>);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

export const gzip = (b: Uint8Array) => pipe(b, new CompressionStream("gzip"));
export const gunzip = (b: Uint8Array) => pipe(b, new DecompressionStream("gzip"));

export interface VaultMeta {
  v: 1;
  kdf: "PBKDF2-SHA256";
  iterations: number;
  salt: string; // base64
  core: string; // fichier chiffré des données (JSON compressé)
  source: string; // archive chiffrée des sources éditables (private/data, manifest)
}
