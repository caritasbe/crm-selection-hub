import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Shell } from "@/components/Shell";
import { VaultGate } from "@/components/VaultGate";
import { CommandPalette } from "@/components/CommandPalette";
import { Tour } from "@/components/Tour";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: { default: "CARITAS · CRM Selection Hub", template: "%s · CRM Selection Hub" },
  description: "Espace de consultation du comité de sélection CRM.",
  robots: { index: false, follow: false },
  icons: { icon: `${base}/icon.svg` },
};

export const viewport: Viewport = { themeColor: "#FBF8F6", width: "device-width", initialScale: 1 };

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join("; ");

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta httpEquiv="Content-Security-Policy" content={CSP} />
        <meta name="referrer" content="no-referrer" />
      </head>
      <body>
        <VaultGate>
          <Shell>{children}</Shell>
          <CommandPalette />
          <Tour />
        </VaultGate>
      </body>
    </html>
  );
}
