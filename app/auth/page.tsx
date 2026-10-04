"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "../lib/supabase/client";

type Mode = "login" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>(searchParams.get("mode") === "signup" ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "apple" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const requestedMode = searchParams.get("mode");
    if (requestedMode === "signup" || requestedMode === "login") setMode(requestedMode);
    if (searchParams.get("error") === "auth_callback") setError("La connexion n’a pas pu être finalisée. Réessaie.");
  }, [searchParams]);

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
      setMessage("Compte créé. Vérifie ton e-mail pour confirmer ton adresse.");
      setLoading(false);
      return;
    }

    router.replace("/");
    router.refresh();
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
    <main className="min-h-[100dvh] bg-[#FECF4C] px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-md flex-col justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-[0_10px_30px_rgba(49,9,90,0.14)] ring-4 ring-white">
            <Image src="/logo/biblidex-owl.png" alt="Biblidex" width={82} height={82} priority className="h-[76px] w-[76px] object-contain" />
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-[#31095A]">Biblidex.</h1>
          <p className="mt-1 text-sm font-bold text-[#31095A]/65">Le Pokédex de tes livres.</p>
        </div>

        <section className="mt-8 rounded-[28px] bg-white p-5 shadow-[0_18px_50px_rgba(49,9,90,0.14)] sm:p-6">
          <div className="grid grid-cols-2 rounded-[14px] bg-[#FFF9F2] p-1">
            <button type="button" onClick={() => switchMode("login")} className={mode === "login" ? "rounded-[11px] bg-[#31095A] px-3 py-2.5 text-sm font-extrabold text-white" : "rounded-[11px] px-3 py-2.5 text-sm font-bold text-[#31095A]/55"}>Se connecter</button>
            <button type="button" onClick={() => switchMode("signup")} className={mode === "signup" ? "rounded-[11px] bg-[#31095A] px-3 py-2.5 text-sm font-extrabold text-white" : "rounded-[11px] px-3 py-2.5 text-sm font-bold text-[#31095A]/55"}>Créer un compte</button>
          </div>

          <div className="mt-5 grid gap-3">
            <SocialButton label="Continuer avec Google" onClick={() => handleSocial("google")} loading={socialLoading === "google"} icon={<GoogleIcon />} />
            <SocialButton label="Continuer avec Apple" onClick={() => handleSocial("apple")} loading={socialLoading === "apple"} icon={<AppleIcon />} />
          </div>

          <div className="my-5 flex items-center gap-3 text-xs font-semibold text-[#31095A]/35">
            <div className="h-px flex-1 bg-[#31095A]/10" /><span>OU AVEC TON E-MAIL</span><div className="h-px flex-1 bg-[#31095A]/10" />
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <label className="grid gap-1.5">
              <span className="text-sm font-bold text-[#31095A]">Adresse e-mail</span>
              <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-12 rounded-[14px] border border-[#31095A]/15 bg-[#FFFDFC] px-4 text-base text-[#31095A] outline-none transition focus:border-[#F837E2] focus:ring-2 focus:ring-[#F837E2]/15" placeholder="toi@exemple.fr" />
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-bold text-[#31095A]">Mot de passe</span>
              <input type="password" required minLength={6} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-12 rounded-[14px] border border-[#31095A]/15 bg-[#FFFDFC] px-4 text-base text-[#31095A] outline-none transition focus:border-[#F837E2] focus:ring-2 focus:ring-[#F837E2]/15" placeholder="••••••••" />
            </label>

            {mode === "signup" && (
              <label className="grid gap-1.5">
                <span className="text-sm font-bold text-[#31095A]">Confirmer le mot de passe</span>
                <input type="password" required minLength={6} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="min-h-12 rounded-[14px] border border-[#31095A]/15 bg-[#FFFDFC] px-4 text-base text-[#31095A] outline-none transition focus:border-[#F837E2] focus:ring-2 focus:ring-[#F837E2]/15" placeholder="••••••••" />
              </label>
            )}

            {mode === "login" && <button type="button" className="justify-self-end text-xs font-bold text-[#31095A]/55 hover:text-[#31095A]">Mot de passe oublié ?</button>}
            {error && <p role="alert" className="rounded-[12px] bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">{error}</p>}
            {message && <p role="status" className="rounded-[12px] bg-green-50 px-3 py-2.5 text-sm font-semibold text-green-700">{message}</p>}

            <button type="submit" disabled={loading} className="min-h-12 rounded-[14px] bg-[#FECF4C] px-4 py-3 text-sm font-black text-[#31095A] shadow-sm transition active:scale-[0.99] disabled:cursor-wait disabled:opacity-60">
              {loading ? "Chargement..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs leading-5 text-[#31095A]/45">En continuant, tu acceptes les conditions d’utilisation et la politique de confidentialité de Biblidex.</p>
        </section>
      </div>
    </main>
  );
}

function SocialButton({ label, onClick, loading, icon }: { label: string; onClick: () => void; loading: boolean; icon: React.ReactNode }) {
  return <button type="button" onClick={onClick} disabled={loading} className="flex min-h-12 items-center justify-center gap-3 rounded-[14px] border border-[#31095A]/12 bg-white px-4 text-sm font-extrabold text-[#31095A] shadow-sm transition hover:bg-[#FFF9F2] active:scale-[0.99] disabled:opacity-60">{icon}{loading ? "Redirection..." : label}</button>;
}

function GoogleIcon() { return <span aria-hidden="true" className="text-base font-black">G</span>; }
function AppleIcon() { return <span aria-hidden="true" className="text-xl leading-none">●</span>; }
