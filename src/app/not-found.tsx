import Link from "next/link";
export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-[24px] font-semibold">Page introuvable</h1>
      <Link href="/" className="mt-4 inline-block text-[14px] underline">Retour à l&apos;accueil</Link>
    </div>
  );
}
