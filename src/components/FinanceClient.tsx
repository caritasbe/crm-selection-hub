"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import type { FinanceScenario } from "@/data/types";
import type { ResolvedRef } from "@/lib/refs";
import { scenarioTotals, eur } from "@/lib/finance-calc";
import { SourceChips, VendorDot, Card, SectionTitle } from "./ui";

export type ScenarioView = FinanceScenario & { refs: ResolvedRef[]; notIncludedView: { text: string; refs: ResolvedRef[] }[] };

// Rampe séquentielle d'une seule teinte (composition d'un même total) : licence, mise en œuvre, récurrent.
const PART = [
  { key: "licence3", label: "Licences (3 ans)", color: "#7A2E12" },
  { key: "setup", label: "Mise en œuvre (one-shot)", color: "#E0622A" },
  { key: "recurring2", label: "Accompagnement récurrent (années 2 et 3)", color: "#F2BC9E" },
] as const;

export function FinanceClient({ scenarios, vatRate, recurringLabel, recurringHint }: { scenarios: ScenarioView[]; vatRate: number; recurringLabel: string; recurringHint: string }) {
  const [months, setMonths] = useState(4);
  const [vat, setVat] = useState(false);
  const [hidden, setHidden] = useState<string[]>([]);
  const [view, setView] = useState<"chart" | "table">("chart");
  const [hover, setHover] = useState<string | null>(null);
  const k = vat ? 1 + vatRate : 1;

  const rows = useMemo(
    () =>
      scenarios.map((s) => {
        const t = scenarioTotals(s, months);
        return { s, t, parts: { licence3: t.licence3 * k, setup: s.setup * k, recurring2: t.recurring * 2 * k }, total: t.total * k };
      }),
    [scenarios, months, k],
  );
  const visible = rows.filter((r) => !hidden.includes(r.s.id));
  const max = Math.max(...visible.map((r) => r.total), 1);
  const fmt = (n: number) => eur(n);

  return (
    <section>
      <SectionTitle hint={vat ? "Montants TVAC (TVA 21 %)" : "Montants HTVA"}>Coût consolidé outil + mise en œuvre sur 3 ans</SectionTitle>

      <div className="no-print mb-4 grid gap-4 rounded-xl2 border border-paper-line bg-white p-5 shadow-card lg:grid-cols-[1fr_auto]">
        <div>
          <label htmlFor="months" className="text-[13px] font-medium text-ink">
            {recurringLabel} : <span className="tnum">{months}</span> mois par an
            {months === 4 && <span className="ml-2 text-[12px] font-normal text-ink-mute">(hypothèse du dossier d&apos;évaluation)</span>}
          </label>
          <input id="months" type="range" min={0} max={12} value={months} onChange={(e) => setMonths(Number(e.target.value))} className="mt-2 w-full max-w-md accent-[#E20817]" />
          <p className="text-[12px] text-ink-mute">{recurringHint}</p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <button onClick={() => setVat((v) => !v)} aria-pressed={vat} className={clsx("rounded-full px-3 py-1.5 text-[13px]", vat ? "bg-ink text-white" : "bg-paper-warm text-ink-soft")}>
            {vat ? "TVAC" : "HTVA"}
          </button>
          {(["chart", "table"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={clsx("rounded-full px-3 py-1.5 text-[13px]", view === v ? "bg-caritas-red text-white" : "bg-paper-warm text-ink-soft")}>
              {v === "chart" ? "Graphique" : "Tableau détaillé"}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 lg:col-span-2">
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => setHidden((h) => (h.includes(s.id) ? h.filter((x) => x !== s.id) : [...h, s.id]))}
              aria-pressed={!hidden.includes(s.id)}
              className={clsx("inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12.5px]", hidden.includes(s.id) ? "border-paper-line text-ink-faint line-through" : "border-ink-faint text-ink")}
            >
              <VendorDot id={s.vendor} size={8} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {view === "chart" ? (
        <Card className="p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap gap-4 text-[12.5px] text-ink-soft">
            {PART.map((p) => (
              <span key={p.key} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} />{p.label}</span>
            ))}
          </div>
          <div className="space-y-4">
            {visible.map((r) => (
              <div key={r.s.id} onMouseEnter={() => setHover(r.s.id)} onMouseLeave={() => setHover(null)} className="relative">
                <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-[13.5px] font-medium text-ink">
                    <VendorDot id={r.s.vendor} />
                    {r.s.label}
                    <span className="font-normal text-ink-mute">· {r.s.partner}</span>
                    {!r.s.isDefault && <span className="rounded bg-paper-deep px-1.5 text-[11px] text-ink-soft">hors tableau du dossier</span>}
                  </span>
                  <span className="text-[14px] font-semibold text-ink tnum">{fmt(r.total)}</span>
                </div>
                <div className="flex h-5 gap-[2px]" role="img" aria-label={`${r.s.label} : ${fmt(r.total)}`}>
                  {PART.map((p, i) => {
                    const v = r.parts[p.key];
                    if (v <= 0) return null;
                    return <div key={p.key} style={{ width: `${(v / max) * 100}%`, background: p.color, borderRadius: i === 0 ? "4px 0 0 4px" : undefined }} className="h-full first:rounded-l last:rounded-r" />;
                  })}
                </div>
                {hover === r.s.id && (
                  <div className="absolute right-0 top-full z-10 mt-2 w-72 rounded-lg border border-paper-line bg-white p-3 text-[12.5px] shadow-lift">
                    <div className="font-semibold text-ink">{r.s.label}</div>
                    <dl className="mt-2 space-y-1 tnum">
                      <div className="flex justify-between"><dt className="text-ink-mute">Licence / an</dt><dd>{eur(r.s.licence * k, 2)}</dd></div>
                      <div className="flex justify-between"><dt className="text-ink-mute">Mise en œuvre</dt><dd>{eur(r.s.setup * k, 2)}</dd></div>
                      <div className="flex justify-between"><dt className="text-ink-mute">Récurrent / an</dt><dd>{fmt(r.t.recurring * k)}</dd></div>
                      <div className="flex justify-between border-t border-paper-line pt-1 font-semibold"><dt>Total 3 ans</dt><dd>{fmt(r.total)}</dd></div>
                    </dl>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="mt-5 text-[12px] text-ink-mute">Ordre fixe du dossier d&apos;évaluation (pas de tri par montant). Survolez une barre pour le détail.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[860px] text-[13px] tnum">
            <thead className="bg-paper-warm/60 text-left">
              <tr>
                {["Scénario", "Licence / an", "Mise en œuvre", "Récurrent / an", "Année 1", "Année 2", "Année 3", "Total 3 ans", "Dossier V3"].map((h) => (
                  <th key={h} className="p-3 font-semibold text-ink">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {visible.map((r) => (
                <tr key={r.s.id}>
                  <td className="p-3"><span className="inline-flex items-center gap-2 font-medium"><VendorDot id={r.s.vendor} />{r.s.label}</span><div className="text-[11.5px] text-ink-mute">{r.s.partner}</div></td>
                  <td className="p-3">{eur(r.s.licence * k, 2)}</td>
                  <td className="p-3">{eur(r.s.setup * k, 2)}</td>
                  <td className="p-3">{fmt(r.t.recurring * k)}</td>
                  <td className="p-3">{fmt(r.t.y1 * k)}</td>
                  <td className="p-3">{fmt(r.t.y2 * k)}</td>
                  <td className="p-3">{fmt(r.t.y3 * k)}</td>
                  <td className="p-3 font-semibold">{fmt(r.total)}</td>
                  <td className="p-3 text-ink-mute">{r.s.excelTotal ? eur(r.s.excelTotal) : "hors tableau"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-paper-line p-3 text-[12px] text-ink-mute">
            Année 1 = licence + mise en œuvre (récurrent inclus dans la mise en œuvre) ; années 2 et 3 = licence + récurrent. La colonne « Dossier V3 » reprend le
            total du dossier d&apos;évaluation (montants arrondis à l&apos;euro, hypothèse de 4 mois de récurrent, HTVA) : de légers écarts d&apos;arrondi sont possibles.
          </p>
        </Card>
      )}

      <div className="mt-8">
        <SectionTitle>Ce que chaque total n&apos;inclut pas</SectionTitle>
        <div className="grid gap-3 md:grid-cols-2">
          {scenarios.filter((s) => !hidden.includes(s.id)).map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex items-center gap-2 text-[13.5px] font-semibold text-ink"><VendorDot id={s.vendor} />{s.label}</div>
              <ul className="mt-3 space-y-2.5">
                {s.notIncludedView.map((n) => (
                  <li key={n.text} className="text-[13px] leading-relaxed text-ink-soft">
                    {n.text}
                    <SourceChips className="mt-1" refs={n.refs} max={3} />
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-paper-line pt-3 text-[11.5px] font-medium uppercase tracking-wide text-ink-mute">Sources des montants</div>
              <SourceChips className="mt-1.5" refs={s.refs} />
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
