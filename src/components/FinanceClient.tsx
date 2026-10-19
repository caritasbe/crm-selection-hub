"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import type { FinanceScenario } from "@/data/types";
import type { ResolvedRef } from "@/lib/refs";
import { scenarioTotals, eur, num } from "@/lib/finance-calc";
import { useT } from "@/lib/i18n";
import { SourceChips, VendorDot, Card, SectionTitle } from "./ui";

export type ScenarioView = FinanceScenario & { refs: ResolvedRef[]; notIncludedView: { text: string; refs: ResolvedRef[] }[] };

// Rampe séquentielle d'une seule teinte (composition d'un même total) : licence, mise en œuvre, récurrent.
const PART = [
  { key: "licence3", label: "Licences (3 ans)", color: "#7A2E12" },
  { key: "setup", label: "Mise en œuvre (one-shot)", color: "#E0622A" },
  { key: "recurring2", label: "Accompagnement récurrent (années 2 et 3)", color: "#F2BC9E" },
] as const;

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="inline-flex rounded-xl bg-paper-deep p-1" role="group" aria-label={label}>
      {options.map(([v, l]) => (
        <button key={v} onClick={() => onChange(v)} aria-pressed={value === v} className={clsx("rounded-lg px-3 py-1.5 text-[13px] transition", value === v ? "bg-white font-medium text-ink shadow-card" : "text-ink-soft hover:text-ink")}>
          {l}
        </button>
      ))}
    </div>
  );
}

export function FinanceClient({ scenarios, vatRate, recurringLabel, recurringHint }: { scenarios: ScenarioView[]; vatRate: number; recurringLabel: string; recurringHint: string }) {
  const t = useT();
  const [months, setMonths] = useState(4);
  const [vat, setVat] = useState<"htva" | "tvac">("htva");
  const [hidden, setHidden] = useState<string[]>([]);
  const [view, setView] = useState<"chart" | "table">("chart");
  const [hover, setHover] = useState<string | null>(null);
  const ranged = scenarios.filter((s) => s.setupRange);
  const [days, setDays] = useState<Record<string, number>>(() => Object.fromEntries(ranged.map((s) => [s.id, s.setupRange!.low.days])));
  const k = vat === "tvac" ? 1 + vatRate : 1;

  const rows = useMemo(
    () =>
      scenarios.map((s) => {
        const tt = scenarioTotals(s, months, days[s.id]);
        return { s, t: tt, parts: { licence3: tt.licence3 * k, setup: tt.setup * k, recurring2: tt.recurring * 2 * k }, total: tt.total * k };
      }),
    [scenarios, months, days, k],
  );
  const visible = rows.filter((r) => !hidden.includes(r.s.id));
  const max = Math.max(...visible.map((r) => r.total), 1);
  const fmt = (n: number) => eur(n);
  const atExcel = (s: FinanceScenario) => months === 4 && (!s.setupRange || days[s.id] === s.setupRange.low.days);

  return (
    <section>
      <SectionTitle hint={vat === "tvac" ? t("Montants TVAC (TVA 21 %)") : t("Montants HTVA")}>{t("Coût consolidé outil + mise en œuvre sur 3 ans")}</SectionTitle>

      <div className="no-print mb-4 space-y-5 rounded-xl2 border border-paper-line bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <div data-tour="fin-vat"><Segmented label={t("TVA")} value={vat} onChange={setVat} options={[["htva", t("HTVA")], ["tvac", t("TVAC")]]} /></div>
          <Segmented label={t("Affichage")} value={view} onChange={setView} options={[["chart", t("Graphique")], ["table", t("Tableau détaillé")]]} />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div data-tour="fin-recurring" className="rounded-xl bg-paper/70 p-4">
            <label htmlFor="months" className="flex flex-wrap items-baseline justify-between gap-2 text-[13px] font-medium text-ink">
              <span>{recurringLabel}</span>
              <span className="tnum text-[15px] font-semibold">{t("{n} mois / an", { n: months })}</span>
            </label>
            <input id="months" type="range" min={0} max={12} value={months} onChange={(e) => setMonths(Number(e.target.value))} className="mt-3 w-full accent-[#E20817]" />
            <div className="mt-1 flex justify-between text-[11.5px] text-ink-mute tnum"><span>0</span><button onClick={() => setMonths(4)} className={clsx("underline-offset-2", months === 4 ? "font-semibold text-ink" : "underline")}>{t("4 (dossier d'évaluation)")}</button><span>12</span></div>
            <p className="mt-2 text-[12px] leading-snug text-ink-mute">{recurringHint}</p>
          </div>

          {ranged.map((s) => {
            const r = s.setupRange!;
            const d = days[s.id];
            const setup = scenarioTotals(s, months, d).setup;
            return (
              <div key={s.id} data-tour="fin-range" className="rounded-xl bg-paper/70 p-4">
                <label htmlFor={`range-${s.id}`} className="flex flex-wrap items-baseline justify-between gap-2 text-[13px] font-medium text-ink">
                  <span className="inline-flex items-center gap-1.5"><VendorDot id={s.vendor} size={8} />{t("Mise en œuvre {partner} (Phase 1)", { partner: s.partner })}</span>
                  <span className="tnum text-[15px] font-semibold">{t("{d} jours", { d: num(d) })} · {eur(setup * k)}</span>
                </label>
                <input
                  id={`range-${s.id}`}
                  type="range"
                  min={r.low.days}
                  max={r.high.days}
                  step={0.1}
                  value={d}
                  onChange={(e) => setDays((x) => ({ ...x, [s.id]: Number(e.target.value) }))}
                  className="mt-3 w-full accent-[#E20817]"
                />
                <div className="mt-1 flex justify-between gap-2 text-[11.5px] text-ink-mute tnum">
                  <button onClick={() => setDays((x) => ({ ...x, [s.id]: r.low.days }))} className={clsx("text-left", d === r.low.days ? "font-semibold text-ink" : "underline underline-offset-2")}>
                    {r.low.label} · {t("{d} j", { d: num(r.low.days) })}
                  </button>
                  <button onClick={() => setDays((x) => ({ ...x, [s.id]: r.high.days }))} className={clsx("text-right", d === r.high.days ? "font-semibold text-ink" : "underline underline-offset-2")}>
                    {r.high.label} · {t("{d} j", { d: num(r.high.days) })}
                  </button>
                </div>
                <p className="mt-2 text-[12px] leading-snug text-ink-mute">{r.note}</p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-paper-line pt-4">
          <span className="mr-1 text-[12px] font-semibold uppercase tracking-wide text-ink-mute">{t("Scénarios")}</span>
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
              <span key={p.key} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} />{t(p.label)}</span>
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
                  </span>
                  <span className="text-[14px] font-semibold text-ink tnum transition-all">{fmt(r.total)}</span>
                </div>
                <div className="flex h-5 gap-[2px]" role="img" aria-label={`${r.s.label} : ${fmt(r.total)}`}>
                  {PART.map((p, i) => {
                    const v = r.parts[p.key];
                    if (v <= 0) return null;
                    return <div key={p.key} style={{ width: `${(v / max) * 100}%`, background: p.color, borderRadius: i === 0 ? "4px 0 0 4px" : undefined }} className="h-full transition-[width] duration-300 first:rounded-l last:rounded-r" />;
                  })}
                </div>
                {hover === r.s.id && (
                  <div className="absolute right-0 top-full z-10 mt-2 w-72 rounded-lg border border-paper-line bg-white p-3 text-[12.5px] shadow-lift">
                    <div className="font-semibold text-ink">{r.s.label}</div>
                    <dl className="mt-2 space-y-1 tnum">
                      <div className="flex justify-between"><dt className="text-ink-mute">{t("Licence / an")}</dt><dd>{eur(r.s.licence * k, 2)}</dd></div>
                      <div className="flex justify-between"><dt className="text-ink-mute">{t("Mise en œuvre")}</dt><dd>{eur(r.t.setup * k, 2)}</dd></div>
                      <div className="flex justify-between"><dt className="text-ink-mute">{t("Récurrent / an")}</dt><dd>{fmt(r.t.recurring * k)}</dd></div>
                      <div className="flex justify-between border-t border-paper-line pt-1 font-semibold"><dt>{t("Total 3 ans")}</dt><dd>{fmt(r.total)}</dd></div>
                    </dl>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="mt-5 text-[12px] text-ink-mute">{t("Ordre fixe du dossier d'évaluation (pas de tri par montant). Survolez une barre pour le détail.")}</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[860px] text-[13px] tnum">
            <thead className="bg-paper-warm/60 text-left">
              <tr>
                {["Scénario", "Licence / an", "Mise en œuvre", "Récurrent / an", "Année 1", "Année 2", "Année 3", "Total 3 ans", "Dossier d'évaluation"].map((h) => (
                  <th key={h} className="p-3 font-semibold text-ink">{t(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {visible.map((r) => (
                <tr key={r.s.id}>
                  <td className="p-3"><span className="inline-flex items-center gap-2 font-medium"><VendorDot id={r.s.vendor} />{r.s.label}</span><div className="text-[11.5px] text-ink-mute">{r.s.partner}</div></td>
                  <td className="p-3">{eur(r.s.licence * k, 2)}</td>
                  <td className="p-3">{eur(r.t.setup * k, 2)}</td>
                  <td className="p-3">{fmt(r.t.recurring * k)}</td>
                  <td className="p-3">{fmt(r.t.y1 * k)}</td>
                  <td className="p-3">{fmt(r.t.y2 * k)}</td>
                  <td className="p-3">{fmt(r.t.y3 * k)}</td>
                  <td className="p-3 font-semibold">{fmt(r.total)}</td>
                  <td className="p-3 text-ink-mute">{r.s.excelTotal && atExcel(r.s) && vat === "htva" ? eur(r.s.excelTotal) : "·"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-paper-line p-3 text-[12px] text-ink-mute">
            {t("Année 1 = licence + mise en œuvre (récurrent inclus dans la mise en œuvre) ; années 2 et 3 = licence + récurrent. La dernière colonne reprend le total du dossier d'évaluation lorsque les réglages correspondent à ses hypothèses (HTVA, 4 mois de récurrent, scénario bas) ; de légers écarts d'arrondi sont possibles.")}
          </p>
        </Card>
      )}

      <div className="mt-8">
        <SectionTitle>{t("Ce que chaque total n'inclut pas")}</SectionTitle>
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
              <div className="mt-4 border-t border-paper-line pt-3 text-[11.5px] font-medium uppercase tracking-wide text-ink-mute">{t("Sources des montants")}</div>
              <SourceChips className="mt-1.5" refs={s.refs} />
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
