"use client";
import Link from "next/link";
import { tr } from "@/lib/i18n";
export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-[24px] font-semibold">{tr("Page introuvable")}</h1>
      <Link href="/" className="mt-4 inline-block text-[14px] underline">{tr("Retour à l'accueil")}</Link>
    </div>
  );
}
