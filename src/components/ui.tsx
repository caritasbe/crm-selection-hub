import Link from "next/link";
import clsx from "clsx";
import type { ReactNode } from "react";
import type { CellStatus, VendorId } from "@/data/types";
import { VENDOR_META } from "@/data/vendor-meta";
import type { ResolvedRef } from "@/lib/refs";

export function Card({ children, className, as: As = "div" }: { children: ReactNode; className?: string; as?: "div" | "section" | "article" }) {
  return <As className={clsx("rounded-xl2 border border-paper-line bg-paper-card shadow-card", className)}>{children}</As>;
}

export function PageHeader({ eyebrow, title, intro, children }: { eyebrow?: string; title: string; intro?: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-8">
      {eyebrow && <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-caritas-red">{eyebrow}</p>}
      <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-tight text-ink sm:text-[34px]">{title}</h1>
      {intro && <div className="mt-3 max-w-3xl text-[15px] leading-relaxed text-ink-soft">{intro}</div>}
      {children}
    </header>
  );
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="text-[17px] font-semibold tracking-tight text-ink">{children}</h2>
      {hint && <div className="text-[13px] text-ink-mute">{hint}</div>}
    </div>
  );
}

export function VendorDot({ id, size = 10 }: { id: VendorId; size?: number }) {
  return <span aria-hidden className="inline-block shrink-0 rounded-full" style={{ width: size, height: size, background: VENDOR_META[id].color }} />;
}

export function VendorLabel({ id, sub = true, className }: { id: VendorId; sub?: boolean; className?: string }) {
  const m = VENDOR_META[id];
  return (
    <span className={clsx("inline-flex items-center gap-2", className)}>
      <VendorDot id={id} />
      <span className="font-medium text-ink">{m.name}</span>
      {sub && <span className="text-ink-mute">· {m.sub}</span>}
    </span>
  );
}

/** Statut documentaire : forme + libellé (jamais la couleur seule, jamais de code rouge/vert). */
export const STATUS_LABEL: Record<CellStatus, string> = {
  prevu: "Prévu dans l'offre",
  partiel: "Partiel ou sous conditions",
  exclu: "Exclu de l'offre",
  "non-precise": "Non précisé",
};

export function StatusMark({ status, withLabel = true }: { status: CellStatus; withLabel?: boolean }) {
  const shape =
    status === "prevu" ? (
      <span className="h-2.5 w-2.5 rounded-full bg-ink" />
    ) : status === "partiel" ? (
      <span className="h-2.5 w-2.5 rounded-full border-[1.5px] border-ink" style={{ background: "linear-gradient(90deg,#1A1615 50%,transparent 50%)" }} />
    ) : status === "exclu" ? (
      <span className="h-2.5 w-2.5 rounded-full border-[1.5px] border-ink" />
    ) : (
      <span className="h-2.5 w-2.5 rounded-full border-[1.5px] border-dashed border-ink-faint" />
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-soft" title={STATUS_LABEL[status]}>
      <span className="inline-flex">{shape}</span>
      {withLabel && STATUS_LABEL[status]}
    </span>
  );
}

export function FactValue({ value }: { value: "Oui" | "Partiel" | "Non" }) {
  const status: CellStatus = value === "Oui" ? "prevu" : value === "Partiel" ? "partiel" : "exclu";
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink">
      <StatusMark status={status} withLabel={false} />
      {value}
    </span>
  );
}

export function sourceHref(r: { docId: string; page: number }) {
  return `/bibliotheque/document?id=${encodeURIComponent(r.docId)}&page=${r.page}#p${r.page}`;
}

export function SourceChips({ refs, max = 6, className }: { refs: ResolvedRef[]; max?: number; className?: string }) {
  const uniq = refs.filter((r, i) => refs.findIndex((x) => x.docId === r.docId && x.page === r.page) === i);
  const shown = uniq.slice(0, max);
  return (
    <div className={clsx("flex flex-wrap gap-1.5", className)}>
      {shown.map((r) => (
        <Link
          key={`${r.docId}-${r.page}`}
          href={sourceHref(r)}
          title={`${r.docTitle} · ${r.label}${r.note ? ` (${r.note})` : ""}`}
          className="group inline-flex max-w-full items-center gap-1 rounded-md border border-paper-line bg-paper px-1.5 py-0.5 text-[11.5px] text-ink-soft transition hover:border-ink-faint hover:bg-white hover:text-ink"
        >
          <svg width="10" height="10" viewBox="0 0 16 16" aria-hidden className="shrink-0 opacity-60"><path fill="currentColor" d="M4 1h6l4 4v10H4zM10 1v4h4" opacity=".9"/></svg>
          <span className="max-w-[13rem] shrink-0 truncate">{r.shortTitle}</span>
          <span className="min-w-0 truncate text-ink-mute">· {r.label}</span>
        </Link>
      ))}
      {uniq.length > max && <span className="px-1 text-[11.5px] text-ink-mute">+{uniq.length - max}</span>}
    </div>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "warm" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11.5px] font-medium",
        tone === "neutral" && "bg-paper-deep text-ink-soft",
        tone === "accent" && "bg-caritas-red/10 text-caritas-red",
        tone === "warm" && "bg-caritas-beige text-ink",
      )}
    >
      {children}
    </span>
  );
}
