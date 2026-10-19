"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import type { OpenQuestion, QuestionType } from "@/data/types";
import { VENDOR_IDS, VENDOR_META, SCOPE_LABEL } from "@/data/vendor-meta";
import type { ResolvedRef } from "@/lib/refs";
import { Pill, SourceChips, VendorDot } from "./ui";
import { tr } from "@/lib/i18n";

type Item = OpenQuestion & { refs: ResolvedRef[] };

const TYPE_LABEL: Record<QuestionType, string> = {
  soulevee: "Soulevé dans la documentation",
  vigilance: "Point de vigilance (analyse documentaire)",
  contradiction: "Contradiction entre documents",
};

function norm(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function QuestionsClient({ items, themes, initialScope, initialQuery }: { items: Item[]; themes: Record<string, string>; initialScope?: string; initialQuery?: string }) {
  const [scope, setScope] = useState<string>(initialScope && (VENDOR_IDS as string[]).concat("transversal").includes(initialScope) ? initialScope : "all");
  const [theme, setTheme] = useState("all");
  const [type, setType] = useState<"all" | QuestionType>("all");
  const [q, setQ] = useState(initialQuery ?? "");

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (scope === "all" || i.scope.includes(scope as never)) &&
          (theme === "all" || i.theme === theme) &&
          (type === "all" || i.type === type) &&
          (!q || norm(i.title + " " + i.detail).includes(norm(q))),
      ),
    [items, scope, theme, type, q],
  );
  const usedThemes = Object.keys(themes).filter((t) => items.some((i) => i.theme === t));
  const chip = (active: boolean) => clsx("rounded-full border px-3 py-1.5 text-[12.5px] transition", active ? "border-ink bg-ink text-white" : "border-paper-line bg-white text-ink-soft hover:border-ink-faint");

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside data-tour="q-filters" className="no-print space-y-6 lg:sticky lg:top-8 lg:self-start">
        <div>
          <label htmlFor="qs" className="text-[12px] font-semibold uppercase tracking-wide text-ink-mute">{tr("Rechercher")}</label>
          <input id="qs" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr("Mot-clé…")} className="mt-2 w-full rounded-lg border border-paper-line bg-white px-3 py-2 text-[14px] outline-none focus:border-ink-faint" />
        </div>
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-mute">{tr("Proposition")}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button className={chip(scope === "all")} onClick={() => setScope("all")}>{tr("Toutes")}</button>
            {VENDOR_IDS.map((v) => (
              <button key={v} className={clsx(chip(scope === v), "inline-flex items-center gap-1.5")} onClick={() => setScope(v)}><VendorDot id={v} size={7} />{VENDOR_META[v].short}</button>
            ))}
            <button className={chip(scope === "transversal")} onClick={() => setScope("transversal")}>{tr("Transversal")}</button>
          </div>
        </div>
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-mute">{tr("Type")}</div>
          <div className="mt-2 flex flex-col gap-1.5">
            {(["all", "soulevee", "vigilance", "contradiction"] as const).map((t) => (
              <button key={t} className={clsx(chip(type === t), "text-left")} onClick={() => setType(t)}>
                {t === "all" ? tr("Tous les types") : tr(TYPE_LABEL[t])} <span className="opacity-60">({items.filter((i) => t === "all" || i.type === t).length})</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-mute">{tr("Thème")}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button className={chip(theme === "all")} onClick={() => setTheme("all")}>{tr("Tous")}</button>
            {usedThemes.map((t) => <button key={t} className={chip(theme === t)} onClick={() => setTheme(t)}>{themes[t]}</button>)}
          </div>
        </div>
      </aside>

      <div>
        <p className="mb-3 text-[13px] text-ink-mute">{tr(filtered.length > 1 ? "{n} points" : "{n} point", { n: filtered.length })}</p>
        <div className="space-y-3">
          {filtered.map((i) => (
            <article key={i.id} className="rounded-xl2 border border-paper-line bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={i.type === "contradiction" ? "accent" : i.type === "vigilance" ? "warm" : "neutral"}>{tr(TYPE_LABEL[i.type])}</Pill>
                <Pill>{themes[i.theme] ?? i.theme}</Pill>
                {i.scope.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1.5 text-[12px] text-ink-mute">
                    {s !== "transversal" && <VendorDot id={s} size={7} />}
                    {s === "transversal" ? tr("Transversal") : SCOPE_LABEL[s]}
                  </span>
                ))}
              </div>
              <h2 className="mt-2.5 text-[15px] font-semibold text-ink">{i.title}</h2>
              <p className="mt-1 text-[13.5px] leading-relaxed text-ink-soft">{i.detail}</p>
              <SourceChips className="mt-3" refs={i.refs} max={6} />
            </article>
          ))}
          {filtered.length === 0 && <p className="text-[14px] text-ink-mute">{tr("Aucun point pour ces filtres.")}</p>}
        </div>
      </div>
    </div>
  );
}
