import { getChunks, getDocuments, type Chunk } from "./knowledge";
import { LEXICON, VENDOR_TERMS, VENDOR_ORDER } from "@/data/store";

/**
 * Recherche documentaire : BM25 multilingue (FR / EN / NL) avec normalisation des accents,
 * racinisation légère, expansion de requête par un lexique métier et pondération par nature de document.
 * Fonctionne entièrement dans le navigateur, sur les données déchiffrées : aucune requête ne quitte la page.
 */

const STOP = new Set(
  (
    "a au aux avec ce ces cet cette dans de des du elle en et est etre eux il ils je la le les leur leurs lui ma mais me meme mes moi mon ne nos notre nous on ou par pas pour qu que qui sa se ses son sur ta te tes toi ton tu un une vos votre vous y d l n s c j m t qu est sont ont a ete " +
    "comment quel quelle quels quelles quoi entre chaque tout tous toutes plus moins tres aussi ainsi donc car si sans sous selon vers chez " +
    "difference differences matiere concernant clarifier rester restent reste elements element prevoit prevoient prevu solution solutions propose proposent existe faut peut peuvent compare comparer comparaison expliquer explique quelle quelles different differentes " +
    "the of and to in for on with by is are be as at or an it this that from which what how does do can will would should have has not their its our your " +
    "de het een en van op voor met is zijn te"
  ).split(/\s+/),
);

export function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function stem(t: string): string {
  if (t.length <= 3 || /^\d/.test(t)) return t;
  let w = t;
  if (w.endsWith("ies") && w.length > 5) w = w.slice(0, -3) + "y";
  else if (w.endsWith("aux") && w.length > 5) w = w.slice(0, -3) + "al";
  else if ((w.endsWith("s") || w.endsWith("x")) && w.length > 4 && !w.endsWith("ss")) w = w.slice(0, -1);
  for (const suf of ["ements", "ement", "ations", "ation", "ing", "ment", "ees", "ee", "es", "ed", "er"]) {
    if (w.endsWith(suf) && w.length - suf.length >= 4) {
      w = w.slice(0, -suf.length);
      break;
    }
  }
  return w;
}

export function tokenize(s: string): string[] {
  return normalize(s)
    .replace(/[’']/g, " ")
    .split(/[^a-z0-9€]+/)
    .filter((t) => t && !STOP.has(t) && (t.length > 1 || t === "€"))
    .map(stem);
}



function containsTerm(qTokens: Set<string>, term: string): boolean {
  const tt = tokenize(term);
  return tt.length > 0 && tt.every((t) => qTokens.has(t));
}

export function detectVendors(q: string): string[] {
  const qt = new Set(tokenize(q));
  return Object.entries(VENDOR_TERMS)
    .filter(([, terms]) => terms.some((t) => containsTerm(qt, t)))
    .map(([v]) => v);
}

function expandQuery(q: string): { tokens: Map<string, number> } {
  const weights = new Map<string, number>();
  const base = tokenize(q);
  for (const t of base) weights.set(t, (weights.get(t) || 0) + 1);
  const qt = new Set(base);
  for (const group of LEXICON) {
    if (group.some((term) => containsTerm(qt, term))) {
      for (const term of group) for (const t of tokenize(term)) if (!weights.has(t)) weights.set(t, 0.6);
    }
  }
  return { tokens: weights };
}

interface Index {
  df: Map<string, number>;
  tf: Map<string, number>[];
  len: number[];
  avg: number;
  chunks: Chunk[];
  natureWeight: number[];
}

let _index: Index | null = null;

function buildIndex(): Index {
  const chunks = getChunks();
  const docs = new Map(getDocuments().map((d) => [d.id, d]));
  const df = new Map<string, number>();
  const tf: Map<string, number>[] = [];
  const len: number[] = [];
  const natureWeight: number[] = [];
  for (const c of chunks) {
    const doc = docs.get(c.docId);
    // Le titre du document et le libellé de page enrichissent le passage
    const toks = tokenize(`${doc?.title ?? ""} ${c.label} ${c.text}`);
    const m = new Map<string, number>();
    for (const t of toks) m.set(t, (m.get(t) || 0) + 1);
    tf.push(m);
    len.push(toks.length);
    for (const t of m.keys()) df.set(t, (df.get(t) || 0) + 1);
    const nature = doc?.nature;
    natureWeight.push(nature === "interne" ? 0.8 : nature === "presentation" ? 0.9 : nature === "reference" ? 1.1 : 1);
  }
  const avg = len.reduce((a, b) => a + b, 0) / Math.max(1, len.length);
  return { df, tf, len, avg, chunks, natureWeight };
}

function index(): Index {
  if (!_index || _index.chunks !== getChunks()) _index = buildIndex();
  return _index;
}

export interface SearchHit {
  chunk: Chunk;
  score: number;
}

export interface SearchOptions {
  vendors?: string[]; // filtre : passages rattachés à ces périmètres
  docIds?: string[];
  limit?: number;
  excludeIds?: Set<string>;
}

export function search(query: string, opts: SearchOptions = {}): SearchHit[] {
  const idx = index();
  const { tokens } = expandQuery(query);
  if (tokens.size === 0) return [];
  const N = idx.chunks.length;
  const mentioned = detectVendors(query);
  const k1 = 1.2;
  const b = 0.75;
  const hits: SearchHit[] = [];
  for (let i = 0; i < N; i++) {
    const c = idx.chunks[i];
    if (opts.vendors && opts.vendors.length && !c.vendors.some((v) => opts.vendors!.includes(v))) continue;
    if (opts.docIds && !opts.docIds.includes(c.docId)) continue;
    if (opts.excludeIds?.has(c.id)) continue;
    const tf = idx.tf[i];
    let s = 0;
    for (const [t, w] of tokens) {
      const f = tf.get(t);
      if (!f) continue;
      const df = idx.df.get(t) || 0;
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      s += w * idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * idx.len[i]) / idx.avg)));
    }
    if (s > 0) {
      const boost = mentioned.length && c.vendors.some((v) => mentioned.includes(v)) ? 1.35 : 1;
      hits.push({ chunk: c, score: s * idx.natureWeight[i] * boost });
    }
  }
  hits.sort((a, b2) => b2.score - a.score);
  return hits.slice(0, opts.limit ?? 10);
}

/**
 * Récupération équilibrée : un quota par proposition afin qu'aucune offre
 * ne soit sur- ou sous-représentée dans le contexte, plus les passages transversaux.
 */
export function balancedRetrieve(queries: string[], vendors: string[], perVendor = 4, transversal = 4, global = 6): Chunk[] {
  const picked = new Map<string, { chunk: Chunk; score: number }>();
  const add = (hits: SearchHit[], n: number) => {
    let added = 0;
    for (const h of hits) {
      if (added >= n) break;
      const prev = picked.get(h.chunk.id);
      if (!prev) {
        picked.set(h.chunk.id, { chunk: h.chunk, score: h.score });
        added++;
      } else if (h.score > prev.score) prev.score = h.score;
    }
  };
  const merged = (opts: SearchOptions) => {
    const all = new Map<string, SearchHit>();
    for (const q of queries) {
      for (const h of search(q, { ...opts, limit: 12 })) {
        const e = all.get(h.chunk.id);
        if (!e || e.score < h.score) all.set(h.chunk.id, h);
      }
    }
    return [...all.values()].sort((a, b) => b.score - a.score);
  };
  const scopeVendors = vendors.length ? vendors : VENDOR_ORDER;
  for (const v of scopeVendors) add(merged({ vendors: [v] }), perVendor);
  add(merged({ vendors: ["transversal"] }), transversal);
  add(merged({}), global);
  return [...picked.values()].sort((a, b) => b.score - a.score).map((x) => x.chunk);
}

/** Extrait court autour des termes de la requête, pour l'affichage des résultats. */
export function snippet(text: string, query: string, size = 260): string {
  const terms = tokenize(query).filter((t) => t.length > 2);
  const n = normalize(text);
  let pos = -1;
  for (const t of terms) {
    const p = n.indexOf(t);
    if (p >= 0 && (pos < 0 || p < pos)) pos = p;
  }
  const start = Math.max(0, pos < 0 ? 0 : pos - 80);
  const out = text.slice(start, start + size).replace(/\s+/g, " ").trim();
  return (start > 0 ? "… " : "") + out + (start + size < text.length ? " …" : "");
}
