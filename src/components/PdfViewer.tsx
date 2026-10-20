"use client";

import { useEffect, useRef, useState } from "react";
import { loadViewPdf } from "@/lib/vault";
import { BASE_PATH } from "@/lib/vault";
import { tr } from "@/lib/i18n";

/* Types minimaux de PDF.js utilisés ici */
interface PdfPage {
  getViewport(o: { scale: number }): { width: number; height: number };
  render(o: { canvasContext: CanvasRenderingContext2D; viewport: unknown }): { promise: Promise<void>; cancel(): void };
  cleanup(): void;
}
interface PdfDoc {
  numPages: number;
  getPage(n: number): Promise<PdfPage>;
  destroy(): Promise<void>;
}

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;
function pdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist/legacy/build/pdf.mjs").then((m) => {
      const lib = m as unknown as typeof import("pdfjs-dist");
      lib.GlobalWorkerOptions.workerSrc = `${BASE_PATH}/pdf.worker.min.mjs`;
      return lib;
    });
  }
  return pdfjsPromise;
}

/**
 * Visionneuse PDF intégrée (PDF.js) : les pages sont dessinées dans la page, à la demande,
 * à partir du PDF déchiffré en mémoire. Fonctionne de la même façon sur tous les navigateurs.
 */
export function PdfViewer({ docId, page, onPageChange }: { docId: string; page?: number | null; onPageChange?: (n: number) => void }) {
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [ratio, setRatio] = useState(1.414);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(1);
  const [zoom, setZoom] = useState(1);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    let loaded: PdfDoc | null = null;
    setDoc(null);
    setError(null);
    (async () => {
      try {
        const [lib, data] = await Promise.all([pdfjs(), loadViewPdf(docId)]);
        const d = (await lib.getDocument({ data, isEvalSupported: false }).promise) as unknown as PdfDoc;
        loaded = d;
        const p1 = await d.getPage(1);
        const vp = p1.getViewport({ scale: 1 });
        if (!alive) return;
        setRatio(vp.height / vp.width);
        setDoc(d);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Erreur");
      }
    })();
    return () => {
      alive = false;
      loaded?.destroy();
    };
  }, [docId]);

  // Aller à la page demandée
  useEffect(() => {
    if (!doc || !page) return;
    const el = scroller.current?.querySelector<HTMLElement>(`[data-page="${page}"]`);
    if (el && scroller.current) scroller.current.scrollTop = el.offsetTop - 12;
  }, [doc, page]);

  // Page courante (indicateur)
  useEffect(() => {
    const root = scroller.current;
    if (!doc || !root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis) {
          const n = Number((vis.target as HTMLElement).dataset.page);
          setCurrent(n);
          onPageChange?.(n);
        }
      },
      { root, threshold: [0.3, 0.6] },
    );
    root.querySelectorAll("[data-page]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [doc, onPageChange]);

  if (error) {
    return <p className="rounded-xl border border-dashed border-paper-line p-6 text-[13.5px] text-ink-mute">{tr("Affichage indisponible pour ce document.")} ({tr(error)})</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl2 border border-paper-line bg-[#E9E4E1] shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-paper-line bg-white/90 px-3 py-2 text-[12.5px] text-ink-soft">
        <span className="tnum">{doc ? tr("Page {n} / {t}", { n: current, t: doc.numPages }) : tr("Chargement du document…")}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(1)))} className="h-7 w-7 rounded-md border border-paper-line bg-white text-[15px] leading-none hover:border-ink-faint" aria-label={tr("Réduire")}>−</button>
          <span className="w-12 text-center tnum">{Math.round(zoom * 100)} %</span>
          <button onClick={() => setZoom((z) => Math.min(2.4, +(z + 0.2).toFixed(1)))} className="h-7 w-7 rounded-md border border-paper-line bg-white text-[15px] leading-none hover:border-ink-faint" aria-label={tr("Agrandir")}>+</button>
        </div>
      </div>
      <div ref={scroller} className="relative h-[78vh] overflow-auto px-3 py-3 scrollbar-thin sm:px-6">
        {!doc ? (
          <div className="mx-auto mt-4 aspect-[1/1.414] w-full max-w-[860px] animate-pulse rounded bg-white/70" />
        ) : (
          <div className="mx-auto space-y-3" style={{ width: `${Math.min(100 * zoom, 240)}%`, maxWidth: 860 * zoom }}>
            {Array.from({ length: doc.numPages }, (_, i) => (
              <PageCanvas key={`${docId}-${i + 1}`} doc={doc} n={i + 1} ratio={ratio} root={scroller} zoom={zoom} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PageCanvas({ doc, n, ratio, root, zoom }: { doc: PdfDoc; n: number; ratio: number; root: React.RefObject<HTMLDivElement>; zoom: number }) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const [pageRatio, setPageRatio] = useState(ratio);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { root: root.current, rootMargin: "800px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [root]);

  useEffect(() => {
    if (!visible || !box.current || !canvas.current) return;
    let task: { cancel(): void } | null = null;
    let cancelled = false;
    (async () => {
      const page = await doc.getPage(n);
      if (cancelled || !box.current || !canvas.current) return;
      const base = page.getViewport({ scale: 1 });
      setPageRatio(base.height / base.width);
      const width = box.current.clientWidth;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const vp = page.getViewport({ scale: (width / base.width) * dpr });
      const c = canvas.current;
      c.width = Math.floor(vp.width);
      c.height = Math.floor(vp.height);
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const r = page.render({ canvasContext: ctx, viewport: vp });
      task = r;
      await r.promise.catch(() => {});
      page.cleanup();
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [visible, doc, n, zoom]);

  return (
    <div ref={box} data-page={n} className="relative w-full overflow-hidden rounded-sm bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]" style={{ aspectRatio: `1 / ${pageRatio}` }}>
      <canvas ref={canvas} className="block h-full w-full" />
      <span className="absolute bottom-1.5 right-2 rounded bg-black/40 px-1.5 text-[10.5px] text-white tnum">{n}</span>
    </div>
  );
}
