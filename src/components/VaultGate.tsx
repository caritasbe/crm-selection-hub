"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { lock as lockVault, unlockFromStorage, unlockWithPassword, WrongPasswordError } from "@/lib/vault";
import { SEALED_AT } from "@/data/store";

type Status = "boot" | "locked" | "ready";
const VaultCtx = createContext<{ lock: () => void; sealedAt: string }>({ lock: () => {}, sealedAt: "" });
export const useVault = () => useContext(VaultCtx);

export function VaultGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("boot");

  useEffect(() => {
    let alive = true;
    unlockFromStorage().then((ok) => alive && setStatus(ok ? "ready" : "locked"));
    return () => { alive = false; };
  }, []);

  const lock = useCallback(() => {
    lockVault();
    window.location.reload();
  }, []);

  if (status === "boot") return <Boot />;
  if (status === "locked") return <LockScreen onUnlocked={() => setStatus("ready")} />;
  return <VaultCtx.Provider value={{ lock, sealedAt: SEALED_AT }}>{children}</VaultCtx.Provider>;
}

function Mark({ size = 44 }: { size?: number }) {
  return (
    <span className="grid place-items-center rounded-2xl bg-caritas-red font-bold text-white shadow-lift" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      C
    </span>
  );
}

function Boot() {
  return (
    <div className="grid min-h-screen place-items-center bg-paper">
      <div className="flex flex-col items-center gap-4">
        <Mark />
        <div className="h-1 w-24 overflow-hidden rounded-full bg-paper-deep">
          <div className="h-full w-1/3 animate-[slide_1.1s_ease-in-out_infinite] rounded-full bg-caritas-red" />
        </div>
      </div>
    </div>
  );
}

function LockScreen({ onUnlocked }: { onUnlocked: () => void }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState<null | "key" | "data">(null);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { input.current?.focus(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pw.trim() || busy) return;
    setError(null);
    setBusy("key");
    const t = setTimeout(() => setBusy("data"), 900);
    try {
      await unlockWithPassword(pw.trim(), remember);
      onUnlocked();
    } catch (err) {
      setError(err instanceof WrongPasswordError ? "Mot de passe incorrect. Vérifiez les tirets et les majuscules." : "Le site n'a pas pu charger les données. Rechargez la page.");
      setShake((n) => n + 1);
      setBusy(null);
      input.current?.select();
    } finally {
      clearTimeout(t);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-paper px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-caritas-beige/80 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-24 h-[30rem] w-[30rem] rounded-full bg-caritas-orange/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute right-1/4 top-10 h-40 w-40 rounded-full bg-caritas-fuchsia/10 blur-2xl" />

      <main className="relative w-full max-w-[420px]">
        <div className="mb-8 flex items-center gap-3">
          <Mark />
          <div className="leading-tight">
            <div className="text-[14px] font-bold tracking-[0.14em] text-ink">CARITAS</div>
            <div className="text-[12px] font-medium tracking-[0.1em] text-ink-mute">CRM SELECTION HUB</div>
          </div>
        </div>

        <form
          key={shake}
          onSubmit={submit}
          className={`rounded-[22px] border border-paper-line bg-white/90 p-7 shadow-lift backdrop-blur ${shake ? "animate-[shake_0.4s_ease-in-out]" : ""}`}
        >
          <h1 className="text-[22px] font-semibold tracking-tight text-ink">Espace du comité de sélection</h1>
          <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">Saisissez le mot de passe communiqué aux membres du comité.</p>

          <label htmlFor="pw" className="mt-6 block text-[12.5px] font-medium text-ink-soft">Mot de passe</label>
          <div className={`mt-1.5 flex items-center rounded-xl border bg-paper pr-1.5 transition focus-within:bg-white ${error ? "border-caritas-red/60" : "border-paper-line focus-within:border-ink-faint"}`}>
            <input
              ref={input}
              id="pw"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              spellCheck={false}
              value={pw}
              onChange={(e) => { setPw(e.target.value); setError(null); }}
              className="min-w-0 flex-1 bg-transparent px-3.5 py-3 font-mono text-[15px] tracking-wide outline-none"
              aria-invalid={!!error}
              aria-describedby={error ? "pw-error" : undefined}
            />
            <button type="button" onClick={() => setShow((v) => !v)} className="rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-ink-mute hover:bg-paper-warm hover:text-ink">
              {show ? "Masquer" : "Afficher"}
            </button>
          </div>
          {error && <p id="pw-error" role="alert" className="mt-2 text-[13px] text-caritas-red">{error}</p>}

          <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-[13px] text-ink-soft">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#E20817]" />
            <span>Rester connecté sur cet appareil <span className="text-ink-mute">(à éviter sur un poste partagé)</span></span>
          </label>

          <button
            disabled={!pw.trim() || !!busy}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-caritas-red px-4 py-3 text-[15px] font-medium text-white transition hover:bg-[#c90714] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {busy === "key" ? "Vérification…" : busy === "data" ? "Ouverture des documents…" : "Entrer"}
          </button>
        </form>

        <p className="mt-5 flex items-start gap-2 px-1 text-[12px] leading-relaxed text-ink-mute">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0" aria-hidden><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></svg>
          Contenu chiffré (AES-256). Le mot de passe est vérifié dans votre navigateur et n&apos;est envoyé nulle part.
        </p>
      </main>
    </div>
  );
}
