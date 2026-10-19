import type { FinanceScenario } from "@/data/types";

/** Calcul transparent, identique à la formule du dossier d'évaluation (bloc 3). */
export function scenarioTotals(s: FinanceScenario, monthsPerYear?: number) {
  const recurring = s.recurringUnit
    ? s.recurringUnit.monthly * (monthsPerYear ?? s.recurringUnit.defaultMonthsPerYear)
    : s.recurringFixed ?? 0;
  const y1 = s.licence + s.setup; // année 1 : licence + mise en œuvre (récurrent inclus dans la mise en œuvre)
  const y2 = s.licence + recurring;
  const y3 = s.licence + recurring;
  return { recurring, y1, y2, y3, total: y1 + y2 + y3, licence3: s.licence * 3 };
}

export const eur = (n: number, digits = 0) =>
  new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n);
