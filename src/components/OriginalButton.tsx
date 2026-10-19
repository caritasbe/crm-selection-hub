"use client";

import { useState } from "react";
import clsx from "clsx";
import { openOriginal } from "@/lib/vault";
import { getDocument } from "@/lib/knowledge";

/** Déchiffre l'original dans le navigateur, puis l'ouvre (PDF) ou le télécharge (Office). */
export function OriginalButton({ docId, page, variant = "primary", children }: { docId: string; page?: number | null; variant?: "primary" | "link"; children?: React.ReactNode }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const doc = getDocument(docId);
  if (!doc) return null;
  const isPdf = doc.format === "pdf";

  async function go() {
    setErr(null);
    setBusy(true);
    // La fenêtre est ouverte tout de suite (sinon le navigateur bloque la fenêtre surgissante)
    const win = isPdf ? window.open("", "_blank") : null;
    if (win) win.document.write('<p style="font:14px system-ui;color:#7A706C;padding:24px">Ouverture du document…</p>');
    try {
      const { url, filename } = await openOriginal(docId);
      if (isPdf && win) {
        win.location.href = page ? `${url}#page=${page}` : url;
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 5 * 60_000);
    } catch (e) {
      win?.close();
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const label = children ?? (isPdf ? `Ouvrir l'original${page ? ` à la page ${page}` : ""}` : `Télécharger l'original (${doc.format.toUpperCase()})`);
  return (
    <span className="inline-flex flex-col">
      <button
        onClick={go}
        disabled={busy}
        className={clsx(
          variant === "primary"
            ? "inline-flex items-center gap-2 rounded-xl bg-caritas-red px-4 py-2 text-[13.5px] font-medium text-white transition hover:bg-[#c90714] disabled:opacity-60"
            : "normal-case tracking-normal text-ink-soft underline underline-offset-2 hover:text-ink disabled:opacity-60",
        )}
      >
        {busy && variant === "primary" && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
        {busy && variant === "link" ? "ouverture…" : label}
      </button>
      {err && <span className="mt-1 text-[12px] text-caritas-red">{err}</span>}
    </span>
  );
}
