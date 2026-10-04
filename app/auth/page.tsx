"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";

type Mode = "login" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "apple" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedMode = params.get("mode");
    if (requestedMode === "signup" || requestedMode === "login") setMode(requestedMode);
    if (params.get("error") === "auth_callback") setError("La connexion n’a pas pu être finalisée. Réessaie.");
  }, []);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
    setMessage("");
    router.replace(nextMode === "signup" ? "/auth?mode=signup" : "/auth");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (mode === "signup" && password !== confirmation) {
      setError("Les mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }

    const result =
      mode === "signup"
        ? await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin + "/auth/callback" },
          })
        : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      if (result.data.session) {
        router.replace("/");
        router.refresh();
        return;
      }

      setMessage("Compte créé. Vérifie ton e-mail pour confirmer ton adresse. Tu seras redirigé vers ton accueil après confirmation.");
      setLoading(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  async function handleForgotPassword() {
    setError("");
    setMessage("");

    if (!email) {
      setError("Renseigne ton adresse e-mail pour recevoir le lien de réinitialisation.");
      return;
    }

    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/auth/reset-password",
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setMessage("Un e-mail de réinitialisation vient de t’être envoyé.");
    setLoading(false);
  }

  async function handleSocial(provider: "google" | "apple") {
    setSocialLoading(provider);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + "/auth/callback?next=/",
      },
    });

    if (authError) {
      setError(authError.message);
      setSocialLoading(null);
      return;
    }

    if (data.url) window.location.assign(data.url);
  }

  return (
    <main className="min-h-[100dvh] bg-[#090B18] px-4 py-6 text-white sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-md flex-col justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white ring-4 ring-white/10 shadow-[0_0_40px_rgba(254,207,76,0.12)]">
            <Image src="/logo/biblidex-owl.png" alt="Biblidex" width={70} height={70} priority className="h-[66px] w-[66px] object-contain" />
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white">Biblidex.</h1>
          <p className="mt-1 text-xs font-bold text-white/45">Le Pokédex de tous les livres.</p>
        </div>

        <section className="mt-6 rounded-[26px] border border-white/8 bg-[#111426] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:p-5">
          <div className="grid grid-cols-2 rounded-[13px] border border-white/6 bg-[#090B18] p-1">
            <button type="button" onClick={() => switchMode("login")} className={mode === "login" ? "rounded-[10px] bg-[#FECF4C] px-3 py-2.5 text-sm font-black text-[#31095A] shadow-sm" : "rounded-[10px] px-3 py-2.5 text-sm font-bold text-white/40 transition hover:text-white/70"}>Se connecter</button>
            <button type="button" onClick={() => switchMode("signup")} className={mode === "signup" ? "rounded-[10px] bg-[#FECF4C] px-3 py-2.5 text-sm font-black text-[#31095A] shadow-sm" : "rounded-[10px] px-3 py-2.5 text-sm font-bold text-white/40 transition hover:text-white/70"}>Créer un compte</button>
          </div>

          <div className={mode === "signup" ? "mt-4 rounded-[16px] border border-[#F837E2]/15 bg-gradient-to-r from-[#F837E2]/10 to-[#FFAA5F]/10 px-4 py-3" : "mt-4 rounded-[16px] border border-white/5 bg-white/[0.025] px-4 py-3"}>
            <p className="text-base font-black text-white">{mode === "login" ? "Content de te revoir." : "Prêt à collectionner ?"}</p>
            <p className="mt-0.5 text-xs font-medium leading-5 text-white/45">
              {mode === "login" ? "Retrouve ta collection et continue là où tu t’es arrêté." : "Crée ton compte pour commencer ton Pokédex de livres."}
            </p>
          </div>

          <div className="mt-3 grid gap-2.5">
            <SocialButton label={mode === "login" ? "Continuer avec Google" : "S’inscrire avec Google"} onClick={() => handleSocial("google")} loading={socialLoading === "google"} icon={<GoogleIcon />} />
            <SocialButton label={mode === "login" ? "Continuer avec Apple" : "S’inscrire avec Apple"} onClick={() => handleSocial("apple")} loading={socialLoading === "apple"} icon={<AppleIcon />} />
          </div>

          <div className="my-4 flex items-center gap-3 text-[10px] font-bold tracking-[0.08em] text-white/25">
            <div className="h-px flex-1 bg-white/8" /><span>OU AVEC TON E-MAIL</span><div className="h-px flex-1 bg-white/8" />
          </div>

          <form onSubmit={handleSubmit} className="grid gap-3.5">
            <label className="grid gap-1.5">
              <span className="text-sm font-bold text-white/85">{mode === "login" ? "Adresse e-mail" : "Ton adresse e-mail"}</span>
              <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-11 rounded-[13px] border border-white/10 bg-[#090B18] px-4 text-base text-white outline-none transition placeholder:text-white/20 focus:border-[#F837E2]/60 focus:ring-2 focus:ring-[#F837E2]/10" placeholder="toi@exemple.fr" />
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-bold text-white/85">{mode === "login" ? "Mot de passe" : "Choisis un mot de passe"}</span>
              <input type="password" required minLength={6} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-11 rounded-[13px] border border-white/10 bg-[#090B18] px-4 text-base text-white outline-none transition placeholder:text-white/20 focus:border-[#F837E2]/60 focus:ring-2 focus:ring-[#F837E2]/10" placeholder="••••••••" />
            </label>

            {mode === "signup" && (
              <label className="grid gap-1.5">
                <span className="text-sm font-bold text-white/85">Confirmer le mot de passe</span>
                <input type="password" required minLength={6} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="min-h-11 rounded-[13px] border border-white/10 bg-[#090B18] px-4 text-base text-white outline-none transition placeholder:text-white/20 focus:border-[#F837E2]/60 focus:ring-2 focus:ring-[#F837E2]/10" placeholder="••••••••" />
              </label>
            )}

            {mode === "login" && (
              <button type="button" onClick={handleForgotPassword} disabled={loading} className="min-h-9 justify-self-end px-1 text-xs font-bold text-white/45 transition hover:text-[#FECF4C] disabled:opacity-50">
                Mot de passe oublié ?
              </button>
            )}

            {error && <p role="alert" className="rounded-[12px] border border-red-400/15 bg-red-400/10 px-3 py-2.5 text-sm font-semibold text-red-300">{error}</p>}
            {message && <p role="status" className="rounded-[12px] border border-emerald-400/15 bg-emerald-400/10 px-3 py-2.5 text-sm font-semibold text-emerald-300">{message}</p>}

            <button type="submit" disabled={loading} className={mode === "signup" ? "min-h-11 rounded-[13px] bg-[#F837E2] px-4 py-2.5 text-sm font-black text-white shadow-[0_8px_24px_rgba(248,55,226,0.16)] transition active:scale-[0.99] disabled:cursor-wait disabled:opacity-60" : "min-h-11 rounded-[13px] bg-[#FECF4C] px-4 py-2.5 text-sm font-black text-[#31095A] shadow-[0_8px_24px_rgba(254,207,76,0.12)] transition active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"}>
              {loading ? "Chargement..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
            </button>
          </form>

          <p className="mt-4 text-center text-[10px] leading-4 text-white/25">
            {mode === "signup"
              ? "En créant ton compte, tu acceptes les conditions d’utilisation et la politique de confidentialité de Biblidex."
              : "En te connectant, tu acceptes les conditions d’utilisation et la politique de confidentialité de Biblidex."}
          </p>
        </section>
      </div>
    </main>
  );
}

function SocialButton({ label, onClick, loading, icon }: { label: string; onClick: () => void; loading: boolean; icon: ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={loading} className="flex min-h-11 items-center justify-center gap-3 rounded-[13px] border border-white/10 bg-[#171A2D] px-4 text-sm font-extrabold text-white/90 transition hover:border-white/15 hover:bg-[#1B1F35] active:scale-[0.99] disabled:opacity-60">
      {icon}
      {loading ? "Redirection..." : label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path fill="#4285F4" d="M21.35 12.23c0-.72-.06-1.42-.18-2.09H12v3.95h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.25Z" />
      <path fill="#34A853" d="M12 21.8c2.63 0 4.84-.87 6.45-2.32l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.8Z" />
      <path fill="#FBBC05" d="M6.54 13.92A5.85 5.85 0 0 1 6.24 12c0-.67.12-1.32.3-1.92V7.55H3.3A9.8 9.8 0 0 0 2.25 12c0 1.6.38 3.12 1.05 4.45l3.24-2.53Z" />
      <path fill="#EA4335" d="M12 6.05c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.15 14.63 2.2 12 2.2a9.74 9.74 0 0 0-8.7 5.35l3.24 2.53C7.31 7.77 9.46 6.05 12 6.05Z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-white">
      <path d="M16.7 12.65c0-2.37 1.94-3.52 2.03-3.58a4.35 4.35 0 0 0-3.43-1.85c-1.45-.15-2.84.86-3.58.86-.75 0-1.9-.84-3.13-.81a4.62 4.62 0 0 0-3.88 2.37c-1.68 2.91-.43 7.2 1.18 9.56.79 1.16 1.72 2.46 2.95 2.41 1.18-.05 1.63-.77 3.06-.77 1.43 0 1.84.77 3.07.74 1.28-.02 2.08-1.16 2.84-2.32a9.5 9.5 0 0 0 1.29-2.68 4.15 4.15 0 0 1-2.4-3.93ZM14.35 5.68a4.1 4.1 0 0 0 .94-2.98 4.2 4.2 0 0 0-2.71 1.4 3.9 3.9 0 0 0-.97 2.87 3.47 3.47 0 0 0 2.74-1.29Z" />
    </svg>
  );
}
