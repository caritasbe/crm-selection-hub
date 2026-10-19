"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import type { CellStatus, TechCheck, VendorId } from "@/data/types";
import { VENDOR_IDS, VENDOR_META } from "@/data/vendor-meta";
import type { ResolvedRef } from "@/lib/refs";
import { SourceChips, StatusMark, VendorDot, FactValue, STATUS_LABEL } from "./ui";

export interface DimensionView {
  id: string;
  label: string;
  question: string;
  requirement: { text: string; refs: ResolvedRef[] };
  cells: Record<VendorId, { status: CellStatus; summary: string; details: string[]; refs: ResolvedRef[] }>;
}

const PREF_KEY = "crmhub.comparator.v1";

export function ComparatorClient({ dimensions, techChecks, techRef, focus }: { dimensions: DimensionView[]; techChecks: TechCheck[]; techRef: ResolvedRef; focus?: string }) {
  const [vendors, setVendors] = useState<VendorId[]>(VENDOR_IDS);
  const [dims, setDims] = useState<string[]>(dimensions.map((d) => d.id));
  const [mode, setMode] = useState<"matrice" | "detail" | "fiche">(focus ? "detail" : "matrice");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [flash, setFlash] = useState<string | null>(null);
  const pendingScroll = useRef<string | null>(null);

  /** Va à une dimension : vue détaillée, justification dépliée, défilement et surbrillance. */
  const goTo = (id: string) => {
    setMode("detail");
    setDims((cur) => (cur.includes(id) ? cur : [...cur, id]));
    setOpen((o) => ({ ...o, [id]: true }));
    pendingScroll.current = id;
    setFlash(id);
    setTimeout(() => setFlash((f) => (f === id ? null : f)), 2200);
  };
  useEffect(() => {
    if (focus && dimensions.some((d) => d.id === focus)) goTo(focus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);
  useEffect(() => {
    const id = pendingScroll.current;
    if (!id) return;
    pendingScroll.current = null;
    requestAnimationFrame(() => document.getElementById(`dim-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  });

  // Préférences d'affichage mémorisées localement (confort, facultatif)
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem(PREF_KEY) || "null");
      if (p?.vendors?.length >= 2) setVendors(VENDOR_IDS.filter((v) => p.vendors.includes(v)));
      if (p?.dims?.length) setDims(p.dims);
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(PREF_KEY, JSON.stringify({ vendors, dims })); } catch {}
  }, [vendors, dims]);

  const toggleVendor = (v: VendorId) =>
    setVendors((cur) => (cur.includes(v) ? (cur.length > 2 ? cur.filter((x) => x !== v) : cur) : VENDOR_IDS.filter((x) => cur.includes(x) || x === v)));
  const toggleDim = (id: string) => setDims((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const shown = useMemo(() => dimensions.filter((d) => dims.includes(d.id)), [dimensions, dims]);
  const allOpen = shown.every((d) => open[d.id]);

  return (
    <div>
      {/* Contrôles */}
      <div className="no-print mb-6 space-y-4 rounded-xl2 border border-paper-line bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[12px] font-semibold uppercase tracking-wide text-ink-mute">Propositions</span>
          {VENDOR_IDS.map((v) => (
            <button
              key={v}
              onClick={() => toggleVendor(v)}
              aria-pressed={vendors.includes(v)}
              className={clsx("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] transition", vendors.includes(v) ? "border-ink bg-ink text-white" : "border-paper-line bg-paper text-ink-soft hover:border-ink-faint")}
            >
              <VendorDot id={v} size={8} />
              {VENDOR_META[v].name}
            </button>
          ))}
          <span className="text-[12px] text-ink-mute">(2 minimum)</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[12px] font-semibold uppercase tracking-wide text-ink-mute">Vue</span>
          {([["matrice", "Vue d'ensemble"], ["detail", "Comparatif détaillé"], ["fiche", "Fiche technique du comité"]] as const).map(([m, l]) => (
            <button key={m} onClick={() => setMode(m)} className={clsx("rounded-full px-3 py-1.5 text-[13px] transition", mode === m ? "bg-caritas-red text-white" : "bg-paper-warm text-ink-soft hover:text-ink")}>
              {l}
            </button>
          ))}
        </div>
        {mode === "detail" && (
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-mute">Dimensions</span>
              <button onClick={() => setDims(dimensions.map((d) => d.id))} className="text-[12px] text-ink-soft underline">toutes</button>
              <button onClick={() => setDims([])} className="text-[12px] text-ink-soft underline">aucune</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {dimensions.map((d) => (
                <button key={d.id} onClick={() => toggleDim(d.id)} aria-pressed={dims.includes(d.id)} className={clsx("rounded-lg border px-2.5 py-1 text-[12.5px] transition", dims.includes(d.id) ? "border-ink-faint bg-paper-deep text-ink" : "border-paper-line bg-white text-ink-mute hover:text-ink")}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-4 border-t border-paper-line pt-3">
          {(Object.keys(STATUS_LABEL) as CellStatus[]).map((s) => <StatusMark key={s} status={s} />)}
        </div>
      </div>

      {mode === "matrice" ? (
        <Matrix dimensions={dimensions} vendors={vendors} onPick={goTo} />
      ) : mode === "detail" ? (
        <>
          <div className="mb-3 flex justify-end">
            <button onClick={() => setOpen(Object.fromEntries(shown.map((d) => [d.id, !allOpen])))} className="text-[12.5px] font-medium text-ink-soft underline underline-offset-2">
              {allOpen ? "Replier les justifications" : "Déplier toutes les justifications"}
            </button>
          </div>
          <div className="space-y-4">
            {shown.length === 0 && <p className="text-[14px] text-ink-mute">Sélectionnez au moins une dimension.</p>}
            {shown.map((d) => (
              <section key={d.id} id={`dim-${d.id}`} className={clsx("scroll-mt-24 overflow-hidden rounded-xl2 border bg-white shadow-card transition-shadow duration-700", flash === d.id ? "border-caritas-orange ring-4 ring-caritas-orange/20" : "border-paper-line")}>
                <div className="border-b border-paper-line bg-paper-warm/50 px-5 py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-[16px] font-semibold text-ink">{d.label}</h2>
                    <button onClick={() => setOpen((o) => ({ ...o, [d.id]: !o[d.id] }))} className="text-[12.5px] font-medium text-ink-soft underline underline-offset-2" aria-expanded={!!open[d.id]}>
                      {open[d.id] ? "Masquer la justification" : "Voir la justification et les sources"}
                    </button>
                  </div>
                  <p className="mt-1 text-[13px] text-ink-soft">{d.question}</p>
                  <p className="mt-2 text-[12.5px] text-ink-mute">
                    <span className="font-medium text-ink-soft">Exigence du cahier des charges : </span>
                    {d.requirement.text}
                  </p>
                  {open[d.id] && <SourceChips className="mt-2" refs={d.requirement.refs} />}
                </div>
                <div className={clsx("grid divide-y divide-paper-line md:divide-x md:divide-y-0", vendors.length === 2 ? "md:grid-cols-2" : vendors.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-4")}>
                  {vendors.map((v) => {
                    const c = d.cells[v];
                    return (
                      <div key={v} className="p-5">
                        <div className="flex items-center gap-2 text-[12.5px] font-semibold text-ink"><VendorDot id={v} />{VENDOR_META[v].name}</div>
                        <div className="mt-2"><StatusMark status={c.status} /></div>
                        <p className="mt-2 text-[13.5px] leading-relaxed text-ink">{c.summary}</p>
                        {open[d.id] && (
                          <div className="mt-3 border-t border-dashed border-paper-line pt-3">
                            {c.details.length > 0 && (
                              <ul className="mb-3 space-y-1.5">
                                {c.details.map((x) => <li key={x} className="flex gap-2 text-[12.5px] leading-relaxed text-ink-soft"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-faint" />{x}</li>)}
                              </ul>
                            )}
                            <SourceChips refs={c.refs} max={8} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </>
      ) : (
        <div className="overflow-x-auto rounded-xl2 border border-paper-line bg-white shadow-card scrollbar-thin">
          <table className="w-full min-w-[760px] text-[13.5px]">
            <thead>
              <tr className="border-b border-paper-line bg-paper-warm/60 text-left">
                <th className="p-4 font-semibold text-ink">Point vérifié</th>
                {vendors.map((v) => <th key={v} className="p-4 font-semibold text-ink"><span className="inline-flex items-center gap-2"><VendorDot id={v} />{VENDOR_META[v].short}</span></th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {(["prerequis", "constat"] as const).map((g) => (
                <FicheGroup key={g} group={g} checks={techChecks.filter((t) => t.group === g)} vendors={vendors} />
              ))}
            </tbody>
          </table>
          <div className="border-t border-paper-line p-4"><SourceChips refs={[techRef]} /></div>
        </div>
      )}
    </div>
  );
}

function Matrix({ dimensions, vendors, onPick }: { dimensions: DimensionView[]; vendors: VendorId[]; onPick: (id: string) => void }) {
  const [hover, setHover] = useState<{ d: string; v: VendorId } | null>(null);
  const hd = hover && dimensions.find((d) => d.id === hover.d);
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="overflow-x-auto rounded-xl2 border border-paper-line bg-white shadow-card scrollbar-thin">
        <table className="w-full min-w-[560px] text-[13.5px]">
          <thead>
            <tr className="border-b border-paper-line bg-paper-warm/60 text-left">
              <th className="p-3.5 font-semibold text-ink">Dimension</th>
              {vendors.map((v) => (
                <th key={v} className="p-3.5 text-center font-semibold text-ink">
                  <span className="inline-flex items-center gap-1.5"><VendorDot id={v} />{VENDOR_META[v].short}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-line">
            {dimensions.map((d) => (
              <tr key={d.id} className={clsx("transition", hover?.d === d.id && "bg-paper/70")}>
                <td className="p-0">
                  <button onClick={() => onPick(d.id)} className="block w-full px-3.5 py-3 text-left font-medium text-ink hover:text-caritas-red">{d.label}</button>
                </td>
                {vendors.map((v) => (
                  <td key={v} className="p-0 text-center">
                    <button
                      onClick={() => onPick(d.id)}
                      onMouseEnter={() => setHover({ d: d.id, v })}
                      onFocus={() => setHover({ d: d.id, v })}
                      onMouseLeave={() => setHover(null)}
                      className={clsx("grid w-full place-items-center px-3 py-3 transition hover:bg-caritas-beige/40", hover?.d === d.id && hover.v === v && "bg-caritas-beige/50")}
                      aria-label={`${d.label} · ${VENDOR_META[v].name} : ${STATUS_LABEL[d.cells[v].status]}`}
                    >
                      <StatusMark status={d.cells[v].status} withLabel={false} />
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-paper-line px-3.5 py-2.5 text-[12px] text-ink-mute">Survolez une case pour lire le résumé, cliquez pour ouvrir la justification et les sources.</p>
      </div>
      <aside className="xl:sticky xl:top-6 xl:self-start">
        <div className="rounded-xl2 border border-paper-line bg-white p-5 shadow-card">
          {hd && hover ? (
            <div key={`${hover.d}-${hover.v}`} className="animate-rise">
              <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-mute">{hd.label}</div>
              <div className="mt-2 flex items-center gap-2 text-[13.5px] font-semibold text-ink"><VendorDot id={hover.v} />{VENDOR_META[hover.v].name}</div>
              <div className="mt-2"><StatusMark status={hd.cells[hover.v].status} /></div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink">{hd.cells[hover.v].summary}</p>
            </div>
          ) : (
            <div className="text-[13px] leading-relaxed text-ink-mute">
              <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide">Lecture</div>
              Chaque case indique ce que la documentation reçue établit pour la dimension. Ce n&apos;est pas une note : « Non précisé » signifie que les documents ne permettent pas de conclure.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function FicheGroup({ group, checks, vendors }: { group: "prerequis" | "constat"; checks: TechCheck[]; vendors: VendorId[] }) {
  return (
    <>
      <tr className="bg-paper">
        <td colSpan={vendors.length + 1} className="px-4 py-2 text-[11.5px] font-semibold uppercase tracking-wide text-ink-mute">
          {group === "prerequis" ? "Prérequis éliminatoires · un « Non » écarte le candidat" : "Constats techniques · informatifs, non éliminatoires"}
        </td>
      </tr>
      {checks.map((t) => (
        <tr key={t.label} className="align-top">
          <td className="p-4">
            <div className="font-medium text-ink">{t.label}</div>
            <div className="mt-1 text-[12px] leading-relaxed text-ink-mute">{t.note}</div>
          </td>
          {vendors.map((v) => <td key={v} className="p-4"><FactValue value={t.values[v]} /></td>)}
        </tr>
      ))}
    </>
  );
}
