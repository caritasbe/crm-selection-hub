import type { FinanceScenario } from "@/data/types";
import { CURRENT_LANG } from "@/data/store";

/** Mise en œuvre pour un nombre de jours donné : montants documentés aux bornes, interpolation linéaire entre les deux. */
export function setupAt(s: FinanceScenario, days?: number): number {
  const r = s.setupRange;
  if (!r || days === undefined) return s.setup;
  if (days <= r.low.days) return r.low.amount;
  if (days >= r.high.days) return r.high.amount;
  return r.low.amount + ((days - r.low.days) * (r.high.amount - r.low.amount)) / (r.high.days - r.low.days);
}

/** Calcul transparent, identique à la formule du dossier d'évaluation (bloc 3). */
export function scenarioTotals(s: FinanceScenario, monthsPerYear?: number, setupDays?: number) {
  const recurring = s.recurringUnit
    ? s.recurringUnit.monthly * (monthsPerYear ?? s.recurringUnit.defaultMonthsPerYear)
    : s.recurringFixed ?? 0;
  const setup = setupAt(s, setupDays);
  const y1 = s.licence + setup; // année 1 : licence + mise en œuvre (récurrent inclus dans la mise en œuvre)
  const y2 = s.licence + recurring;
  const y3 = s.licence + recurring;
  return { recurring, setup, y1, y2, y3, total: y1 + y2 + y3, licence3: s.licence * 3 };
}

export const eur = (n: number, digits = 0) =>
  new Intl.NumberFormat(CURRENT_LANG === "en" ? "en-IE" : "fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n);

export const num = (n: number, digits = 1) =>
  new Intl.NumberFormat(CURRENT_LANG === "en" ? "en-IE" : "fr-BE", { maximumFractionDigits: digits }).format(n);
