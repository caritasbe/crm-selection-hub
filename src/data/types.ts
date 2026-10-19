// Types partagés du modèle de données (sans contenu confidentiel : importable côté client).

/** Identifiant de proposition (les valeurs proviennent du coffre chiffré). */
export type VendorId = string;
export type Scope = VendorId | "transversal";

/** Référence vérifiable vers un document de la bibliothèque. */
export interface SourceRef {
  doc: string; // identifiant du document (data/manifest.json)
  page: number; // numéro de page, diapositive, onglet ou section (selon le format)
  note?: string; // précision facultative (ex. intitulé de ligne, citation courte)
}

export interface Vendor {
  id: VendorId;
  name: string; // libellé du dossier d'évaluation
  partner: string; // partenaire de mise en œuvre
  short: string; // libellé court pour les tableaux
  tagline: string; // périmètre évalué (dossier d'évaluation, onglet Rapport)
  components: { name: string; role: string; sources: SourceRef[] }[];
  architecture: { summary: string; points: string[]; sources: SourceRef[] };
  scope: { label: string; detail: string; sources: SourceRef[] }[];
  integrations: { target: string; detail: string; sources: SourceRef[] }[];
  financial: { label: string; value: string; detail?: string; sources: SourceRef[] }[];
  implementation: { label: string; value: string; sources: SourceRef[] }[];
  contract: { label: string; value: string; sources: SourceRef[] }[];
  limits: { text: string; sources: SourceRef[] }[];
  documents: string[];
}

/** Statut documentaire d'une cellule du comparateur (jamais un jugement de valeur). */
export type CellStatus = "prevu" | "partiel" | "exclu" | "non-precise";

export interface ComparisonCell {
  status: CellStatus;
  summary: string;
  details?: string[];
  sources: SourceRef[];
}

export interface Dimension {
  id: string;
  label: string;
  question: string; // ce que la dimension permet de vérifier
  requirement: { text: string; sources: SourceRef[] }; // exigence du cahier des charges
  cells: Record<VendorId, ComparisonCell>;
}

export type QuestionType = "soulevee" | "vigilance" | "contradiction";

export interface OpenQuestion {
  id: string;
  scope: Scope[];
  theme: string;
  type: QuestionType;
  title: string;
  detail: string;
  sources: SourceRef[];
}

export interface TechCheck {
  label: string;
  group: "prerequis" | "constat";
  values: Record<VendorId, "Oui" | "Partiel" | "Non">;
  note: string;
}

export interface FinanceScenario {
  id: string;
  vendor: VendorId;
  label: string;
  partner: string;
  licence: number; // licence annuelle HTVA, montant documenté
  setup: number; // mise en œuvre one-shot HTVA
  recurringUnit?: { monthly: number; defaultMonthsPerYear: number }; // accompagnement récurrent
  recurringFixed?: number; // récurrent annuel fixe documenté (sinon 0)
  /** Mise en œuvre réglable entre deux scénarios documentés (jours × montant) */
  setupRange?: { low: { days: number; amount: number; label: string }; high: { days: number; amount: number; label: string }; note: string };
  isDefault: boolean; // scénario retenu dans le tableau 3 du dossier d'évaluation
  variantOf?: string;
  sources: SourceRef[];
  notIncluded: { text: string; sources: SourceRef[] }[];
  excelTotal?: number; // total 3 ans recalculé selon la formule du dossier d'évaluation (valeurs arrondies de l'Excel)
}
