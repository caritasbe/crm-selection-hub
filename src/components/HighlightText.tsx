// Surlignage des termes recherchés.
export function HighlightText({ text, query }: { text: string; query?: string }) {
  const terms = (query || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/).filter((t) => t.length > 2).slice(0, 8);
  if (!terms.length) return <>{text}</>;
  const plain = text.toLowerCase().split("").map((c) => c.normalize("NFD").replace(/[\u0300-\u036f]/g, "")[0] ?? c).join(""); // même longueur que text
  const out: React.ReactNode[] = [];
  let i = 0;
  while (i < text.length) {
    let next = -1, len = 0;
    for (const t of terms) { const p = plain.indexOf(t, i); if (p >= 0 && (next < 0 || p < next)) { next = p; len = t.length; } }
    if (next < 0) { out.push(text.slice(i)); break; }
    out.push(text.slice(i, next), <mark key={next}>{text.slice(next, next + len)}</mark>);
    i = next + len;
  }
  return <>{out}</>;
}
