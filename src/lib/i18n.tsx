"use client";
/**
 * Bascule FR / EN de l'interface. Les textes de l'interface sont écrits en français dans le code
 * et traduits par le dictionnaire UI_EN ; les contenus du dossier sont traduits par le coffre (store.ts).
 */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CURRENT_LANG, setDataLang, type Lang } from "@/data/store";
import { UI_EN } from "./i18n-en";

const KEY = "crmhub.lang";

type TFn = (fr: string, vars?: Record<string, string | number>) => string;
const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: TFn }>({ lang: "fr", setLang: () => {}, t: (s) => s });

function format(s: string, vars?: Record<string, string | number>) {
  return vars ? s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : s;
}

export function translate(lang: Lang, fr: string, vars?: Record<string, string | number>) {
  return format(lang === "en" ? UI_EN[fr] ?? fr : fr, vars);
}

/** Traduction hors hook : valable dans l'arbre des pages, remonté à chaque changement de langue. */
export const tr = (fr: string, vars?: Record<string, string | number>) => translate(CURRENT_LANG, fr, vars);

function initialLang(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "en" || v === "fr") return v;
  } catch {}
  return "fr";
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");
  useEffect(() => {
    const l = initialLang();
    setDataLang(l);
    setLangState(l);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const setLang = useCallback((l: Lang) => {
    try { localStorage.setItem(KEY, l); } catch {}
    setDataLang(l);
    setLangState(l);
  }, []);
  const t = useCallback<TFn>((fr, vars) => translate(lang, fr, vars), [lang]);
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
export const useT = () => useContext(Ctx).t;

export function LangSwitch({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div data-tour="lang" className={`inline-flex rounded-lg border border-paper-line bg-white/80 p-0.5 text-[12px] font-semibold ${className}`} role="group" aria-label="Langue / Language">
      {(["fr", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-md px-2 py-1 transition ${lang === l ? "bg-ink text-white" : "text-ink-mute hover:text-ink"}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
