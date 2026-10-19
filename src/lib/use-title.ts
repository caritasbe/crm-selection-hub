"use client";
import { useEffect } from "react";
import { tr } from "./i18n";

/** Titre de l'onglet (texte français, traduit selon la langue active). */
export function useTitle(title: string | undefined, translateIt = true) {
  useEffect(() => {
    if (title) document.title = `${translateIt ? tr(title) : title} · CRM Selection Hub`;
  }, [title, translateIt]);
}
