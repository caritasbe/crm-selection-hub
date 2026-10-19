"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { PageHeader, SourceChips, VendorDot, Pill, StatusMark } from "@/components/ui";
import { HighlightText } from "@/components/HighlightText";
import { VENDOR_ORDER, VENDOR_META, SUGGESTIONS, DIMENSIONS, QUESTIONS } from "@/data/store";
import type { VendorId } from "@/data/types";
import { search, snippet, tokenize, type SearchHit } from "@/lib/search";
import { getDocument } from "@/lib/knowledge";
import { resolveRef, resolveRefs } from "@/lib/refs";
import { useTitle } from "@/lib/use-title";

type View = "columns" | "list";

export default function ExplorerPage() {
  return (
    <Suspense>
      <Explorer />
    </Suspense>
  );
}

function Explorer() {
  useTitle("Explorer");
  const params = useSearchParams();
  const router = useRouter();
  const [input, setInput] = useState(params.get("q") ?? "");
  const [q, setQ] = useState(params.get("q") ?? "");
  const [view, setView] = useState<View>("columns");
  const [active, setActive] = useState<VendorId[]>(VENDOR_ORDER);

  // Recherche au fil de la frappe (légère temporisation), URL partageable
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(input.trim());
      const url = input.trim() ? `/explorer?q=${encodeURIComponent(input.trim())}` : "/explorer";
      router.replace(url, { scroll: false });
    }, 280);
    return () => clearTimeout(t);
  }, [input, router]);

  const ready = q.length >= 2 && tokenize(q).length > 0;

  const perVendor = useMemo(() => {
    if (!ready) return null;
    return Object.fromEntries(VENDOR_ORDER.map((v) => [v, search(q, { vendors: [v], limit: 4 })])) as Record<VendorId, SearchHit[]>;
  }, [q, ready]);
  const transversal = useMemo(() => (ready ? search(q, { vendors: ["transversal"], limit: 4 }) : []), [q, ready]);
  const all = useMemo(() => (ready ? search(q, { limit: 30 }) : []), [q, ready]);

  const related = useMemo(() => {
    if (!ready) return { dims: [], questions: [] };
    const qt = new Set(tokenize(q));
    const score = (text: string) => tokenize(text).filter((t) => qt.has(t)).length;
    const dims = DIMENSIONS.map((d) => ({ d, s: score(`${d.label} ${d.question} ${d.requirement.text}`) * 2 + score(Object.values(d.cells).map((c) => c.summary).join(" ")) }))
      .filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 4).map((x) => x.d);
    const questions = QUESTIONS.map((x) => ({ x, s: score(`${x.title} ${x.title} ${x.detail}`) }))
      .filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 5).map((x) => x.x);
    return { dims, questions };
  }, [q, ready]);

  const toggle = (v: VendorId) =>
    setActive((cur) => (cur.includes(v) ? (cur.length > 1 ? cur.filter((x) => x !== v) : cur) : VENDOR_ORDER.filter((x) => cur.includes(x) || x === v)));

  const seg = (on: boolean) => clsx("rounded-lg px-3 py-1.5 text-[13px] transition", on ? "bg-white font-medium text-ink shadow-card" : "text-ink-soft hover:text-ink");

  return (
    <div>
      <PageHeader
        eyebrow="Explorer le dossier"
        title="Que disent les documents sur…"
        intro="Tapez un sujet : les passages les plus pertinents de chaque proposition s'affichent côte à côte, tels qu'ils figurent dans les documents, sans reformulation. Cliquez sur un passage pour le lire en entier ou l'ouvrir à la bonne page."
      />

      <div className="sticky top-[57px] z-20 -mx-4 mb-6 bg-paper/90 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:top-0">
        <div className="flex items-center gap-2 rounded-2xl border border-paper-line bg-white p-1.5 pl-4 shadow-card focus-within:border-ink-faint">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-ink-mute" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <label htmlFor="explore" className="sr-only">Sujet à explorer</label>
          <input
            id="explore"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="réversibilité, SFTP, paliers de contacts, formation, hébergement…"
            className="min-w-0 flex-1 bg-transparent py-2 text-[15.5px] outline-none placeholder:text-ink-faint"
          />
          {input && (
            <button onClick={() => setInput("")} className="rounded-lg px-2.5 py-1.5 text-[12.5px] text-ink-mute hover:bg-paper-warm hover:text-ink" aria-label="Effacer">Effacer</button>
          )}
        </div>
        {ready && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {VENDOR_ORDER.map((v) => (
                <button
                  key={v}
                  onClick={() => toggle(v)}
                  aria-pressed={active.includes(v)}
                  className={clsx("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] transition", active.includes(v) ? "border-ink-faint bg-white text-ink" : "border-paper-line bg-transparent text-ink-faint line-through")}
                >
                  <VendorDot id={v} size={7} />{VENDOR_META[v].short}
                </button>
              ))}
            </div>
            <div className="flex rounded-xl bg-paper-deep p-1" role="tablist">
              <button role="tab" aria-selected={view === "columns"} className={seg(view === "columns")} onClick={() => setView("columns")}>Par proposition</button>
              <button role="tab" aria-selected={view === "list"} className={seg(view === "list")} onClick={() => setView("list")}>Tous les passages</button>
            </div>
          </div>
        )}
      </div>

      {!ready ? (
        <Empty onPick={setInput} />
      ) : (
        <div className="space-y-10">
          {(related.dims.length > 0 || related.questions.length > 0) && (
            <section className="animate-rise grid gap-3 lg:grid-cols-2">
              {related.dims.length > 0 && (
                <div className="rounded-xl2 border border-paper-line bg-white p-4 shadow-card">
                  <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-mute">Dans le comparateur</div>
                  <ul className="space-y-2">
                    {related.dims.map((d) => (
                      <li key={d.id}>
                        <Link href={`/comparateur?d=${d.id}`} className="group block rounded-lg p-2 -m-2 hover:bg-paper">
                          <div className="text-[13.5px] font-medium text-ink group-hover:text-caritas-red">{d.label}</div>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                            {active.map((v) => (
                              <span key={v} className="inline-flex items-center gap-1.5 text-[12px] text-ink-mute"><VendorDot id={v} size={7} /><StatusMark status={d.cells[v].status} /></span>
                            ))}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {related.questions.length > 0 && (
                <div className="rounded-xl2 border border-paper-line bg-white p-4 shadow-card">
                  <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-mute">Questions ouvertes liées</div>
                  <ul className="space-y-2.5">
                    {related.questions.map((x) => (
                      <li key={x.id} className="text-[13px]">
                        <Link href={`/questions?q=${encodeURIComponent(x.title)}`} className="font-medium text-ink hover:text-caritas-red">{x.title}</Link>
                        <div className="mt-0.5 flex flex-wrap gap-1.5">
                          {x.scope.map((s) => s === "transversal" ? <Pill key={s}>Transversal</Pill> : <span key={s} className="inline-flex items-center gap-1 text-[11.5px] text-ink-mute"><VendorDot id={s} size={6} />{VENDOR_META[s].short}</span>)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {view === "columns" && perVendor ? (
            <>
              <section className={clsx("grid gap-4", active.length >= 4 ? "md:grid-cols-2 2xl:grid-cols-4" : active.length === 3 ? "md:grid-cols-3" : active.length === 2 ? "md:grid-cols-2" : "")}>
                {active.map((v) => (
                  <div key={v} className="min-w-0">
                    <div className="mb-3 flex items-center gap-2 border-b-2 pb-2" style={{ borderColor: VENDOR_META[v].color }}>
                      <VendorDot id={v} size={10} />
                      <Link href={`/propositions?id=${v}`} className="truncate text-[14px] font-semibold text-ink hover:text-caritas-red">{VENDOR_META[v].name}</Link>
                    </div>
                    {perVendor[v].length ? (
                      <div className="space-y-2.5">{perVendor[v].map((h) => <Passage key={h.chunk.id} hit={h} q={q} />)}</div>
                    ) : (
                      <p className="rounded-xl border border-dashed border-paper-line p-4 text-[13px] text-ink-mute">Aucun passage de cette proposition ne mentionne ce sujet. Cela ne signifie pas que le sujet n&apos;est pas couvert : essayez un autre terme.</p>
                    )}
                  </div>
                ))}
              </section>
              {transversal.length > 0 && (
                <section>
                  <h2 className="mb-3 text-[14px] font-semibold text-ink">Documents Caritas et transversaux</h2>
                  <div className="grid gap-2.5 md:grid-cols-2">{transversal.map((h) => <Passage key={h.chunk.id} hit={h} q={q} />)}</div>
                </section>
              )}
            </>
          ) : (
            <section>
              <p className="mb-3 text-[13px] text-ink-mute">{all.filter((h) => h.chunk.vendors.some((v) => v === "transversal" || active.includes(v as VendorId))).length} passages, du plus au moins pertinent</p>
              <div className="space-y-2.5">
                {all.filter((h) => h.chunk.vendors.some((v) => v === "transversal" || active.includes(v as VendorId))).map((h) => <Passage key={h.chunk.id} hit={h} q={q} showVendor />)}
              </div>
            </section>
          )}

          <p className="border-t border-paper-line pt-4 text-[12.5px] text-ink-mute">
            Recherche par mots-clés dans le texte de tous les documents, avec synonymes métier (FR, EN, NL). Les passages sont cités tels quels : aucune IA ne résume ni n&apos;interprète.
            Le classement reflète la correspondance avec les termes recherchés, pas une appréciation des offres.
          </p>
        </div>
      )}
    </div>
  );
}

function Passage({ hit, q, showVendor }: { hit: SearchHit; q: string; showVendor?: boolean }) {
  const [open, setOpen] = useState(false);
  const c = hit.chunk;
  const doc = getDocument(c.docId);
  const ref = resolveRef({ doc: c.docId, page: c.page });
  return (
    <article className="animate-rise rounded-xl border border-paper-line bg-white p-4 shadow-card transition hover:shadow-lift">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink">
            {showVendor && c.vendors[0] !== "transversal" && <VendorDot id={c.vendors[0] as VendorId} size={7} />}
            <span className="truncate">{ref.shortTitle}</span>
          </div>
          <div className="text-[11.5px] text-ink-mute">{c.label}{doc?.nature === "interne" ? " · document interne" : ""}</div>
        </div>
      </div>
      <p className="mt-2 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-ink-soft">
        <HighlightText text={open ? c.text : snippet(c.text, q, 300)} query={q} />
      </p>
      <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[12.5px]">
        <button onClick={() => setOpen((v) => !v)} className="font-medium text-ink-soft hover:text-ink">{open ? "Réduire" : "Lire le passage complet"}</button>
        <Link href={`/bibliotheque/document?id=${encodeURIComponent(c.docId)}&page=${c.page}&q=${encodeURIComponent(q)}#p${c.page}`} className="font-medium text-ink underline underline-offset-2 hover:text-caritas-red">
          Voir dans le document
        </Link>
      </div>
    </article>
  );
}

function Empty({ onPick }: { onPick: (s: string) => void }) {
  return (
    <div className="animate-rise grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="rounded-xl2 border border-paper-line bg-white p-6 shadow-card">
        <h2 className="text-[15px] font-semibold text-ink">Quelques sujets pour commencer</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => onPick(s)} className="rounded-lg bg-paper-warm px-3 py-2 text-left text-[13px] text-ink-soft transition hover:bg-paper-deep hover:text-ink">{s}</button>
          ))}
        </div>
        <h2 className="mt-7 text-[15px] font-semibold text-ink">Ou par dimension du comparateur</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {DIMENSIONS.map((d) => (
            <button key={d.id} onClick={() => onPick(d.label)} className="rounded-full border border-paper-line px-3 py-1.5 text-[12.5px] text-ink-soft transition hover:border-ink-faint hover:text-ink">{d.label}</button>
          ))}
        </div>
      </div>
      <div className="rounded-xl2 border border-paper-line bg-paper-warm/60 p-6 text-[13.5px] leading-relaxed text-ink-soft">
        <h2 className="text-[15px] font-semibold text-ink">Comment ça marche</h2>
        <ul className="mt-3 space-y-2.5">
          <li><strong className="font-medium text-ink">Côte à côte.</strong> Les meilleurs passages de chaque proposition, pour comparer ce que chacune documente sur le même sujet.</li>
          <li><strong className="font-medium text-ink">Sans interprétation.</strong> Le texte est celui des documents ; un clic vous amène à la page d&apos;origine.</li>
          <li><strong className="font-medium text-ink">Synonymes inclus.</strong> « coûts » trouve aussi licence, tarif, pricing ; « RGPD » trouve DPA, hébergement, sous-traitants.</li>
          <li><strong className="font-medium text-ink">Absence ≠ manque.</strong> Si une colonne est vide, la documentation n&apos;en parle pas avec ces mots : essayez un synonyme.</li>
        </ul>
      </div>
    </div>
  );
}
