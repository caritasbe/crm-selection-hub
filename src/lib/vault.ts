"use client";
/**
 * Ouverture du coffre dans le navigateur. Le mot de passe ne quitte jamais la page :
 * la clé est dérivée localement, puis les fichiers chiffrés sont téléchargés et déchiffrés en mémoire.
 */
import { decrypt, deriveKey, exportKey, fromB64, gunzip, importKey, type VaultMeta } from "./crypto";
import { hydrate, KNOWLEDGE, type VaultPayload } from "@/data/store";
import { getDocument, MIME, originalFileName } from "./knowledge";

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const STORE_KEY = "crmhub.k";

let _key: CryptoKey | null = null;
let _meta: VaultMeta | null = null;

async function getMeta(): Promise<VaultMeta> {
  if (!_meta) {
    const r = await fetch(`${BASE_PATH}/vault/meta.json`, { cache: "no-store" });
    if (!r.ok) throw new Error("Coffre introuvable sur le site.");
    _meta = (await r.json()) as VaultMeta;
  }
  return _meta;
}

async function fetchBytes(file: string): Promise<Uint8Array> {
  const r = await fetch(`${BASE_PATH}/vault/${file}`);
  if (!r.ok) throw new Error("Fichier du coffre introuvable.");
  return new Uint8Array(await r.arrayBuffer());
}

async function openCore(key: CryptoKey, meta: VaultMeta): Promise<VaultPayload> {
  const plain = await decrypt(key, await fetchBytes(meta.core));
  return JSON.parse(new TextDecoder().decode(await gunzip(plain))) as VaultPayload;
}

function storages(): Storage[] {
  const out: Storage[] = [];
  try { out.push(window.sessionStorage); } catch {}
  try { out.push(window.localStorage); } catch {}
  return out;
}

export class WrongPasswordError extends Error {}

/** Déverrouille avec le mot de passe. remember : conserver l'accès sur cet appareil. */
export async function unlockWithPassword(password: string, remember: boolean): Promise<void> {
  const meta = await getMeta();
  const key = await deriveKey(password, fromB64(meta.salt), meta.iterations);
  let payload: VaultPayload;
  try {
    payload = await openCore(key, meta);
  } catch {
    throw new WrongPasswordError("Mot de passe incorrect.");
  }
  hydrate(payload);
  _key = key;
  const exported = await exportKey(key);
  const [session, local] = storages();
  try { session?.setItem(STORE_KEY, exported); } catch {}
  try { if (remember) local?.setItem(STORE_KEY, exported); else local?.removeItem(STORE_KEY); } catch {}
}

/** Reprend une session déjà ouverte (onglet rechargé, ou appareil mémorisé). */
export async function unlockFromStorage(): Promise<boolean> {
  let stored: string | null = null;
  for (const s of storages()) {
    try { stored = s.getItem(STORE_KEY); } catch {}
    if (stored) break;
  }
  if (!stored) return false;
  try {
    const key = await importKey(stored);
    hydrate(await openCore(key, await getMeta()));
    _key = key;
    return true;
  } catch {
    lock();
    return false;
  }
}

export function lock(): void {
  _key = null;
  for (const s of storages()) { try { s.removeItem(STORE_KEY); } catch {} }
}

/** Déchiffre l'original d'un document et renvoie une URL locale (blob:) utilisable dans un onglet. */
export async function openOriginal(docId: string): Promise<{ url: string; filename: string }> {
  if (!_key) throw new Error("Coffre verrouillé.");
  const doc = getDocument(docId);
  const file = originalFileName(docId);
  if (!doc || !file) throw new Error("Original indisponible.");
  const bytes = await decrypt(_key, await fetchBytes(`files/${file}`));
  const blob = new Blob([bytes as BlobPart], { type: MIME[doc.format] });
  return { url: URL.createObjectURL(blob), filename: doc.file.split("/").pop() || `${doc.id}.${doc.format}` };
}

const _pdfCache = new Map<string, Promise<Uint8Array>>();
const _thumbCache = new Map<string, Promise<string | null>>();

/** PDF d'affichage d'un document (original PDF ou conversion), déchiffré en mémoire. */
export function loadViewPdf(docId: string): Promise<Uint8Array> {
  if (!_pdfCache.has(docId)) {
    const p = (async () => {
      if (!_key) throw new Error("Coffre verrouillé.");
      const file = KNOWLEDGE.views?.[docId]?.pdf;
      if (!file) throw new Error("Original indisponible.");
      return decrypt(_key, await fetchBytes(`files/${file}`));
    })();
    p.catch(() => _pdfCache.delete(docId));
    _pdfCache.set(docId, p);
  }
  // PDF.js transfère le tampon au worker : on lui donne une copie
  return _pdfCache.get(docId)!.then((b) => b.slice());
}

export function hasViewPdf(docId: string): boolean {
  return !!KNOWLEDGE.views?.[docId]?.pdf;
}

/** Vignette de la première page (URL locale), ou null si indisponible. */
export function thumbUrl(docId: string): Promise<string | null> {
  if (!_thumbCache.has(docId)) {
    _thumbCache.set(
      docId,
      (async () => {
        const file = KNOWLEDGE.views?.[docId]?.thumb;
        if (!_key || !file) return null;
        try {
          const bytes = await decrypt(_key, await fetchBytes(`files/${file}`));
          return URL.createObjectURL(new Blob([bytes as BlobPart], { type: "image/jpeg" }));
        } catch {
          return null;
        }
      })(),
    );
  }
  return _thumbCache.get(docId)!;
}
