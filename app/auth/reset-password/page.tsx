"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmation) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setMessage("Ton mot de passe a été mis à jour. Tu peux maintenant te connecter.");
    setLoading(false);
  }

  return (
    <main className="min-h-[100dvh] bg-[#FECF4C] px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-md flex-col justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-[0_10px_30px_rgba(49,9,90,0.14)] ring-4 ring-white">
            <img src="/logo/biblidex-owl.png" alt="Biblidex" width="82" height="82" className="h-[76px] w-[76px] object-contain" />
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-[#31095A]">Nouveau mot de passe</h1>
          <p className="mt-1 text-sm font-bold text-[#31095A]/65">Choisis un nouveau mot de passe pour ton compte.</p>
        </div>

        <section className="mt-8 rounded-[28px] bg-white p-5 shadow-[0_18px_50px_rgba(49,9,90,0.14)] sm:p-6">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <label className="grid gap-1.5">
              <span className="text-sm font-bold text-[#31095A]">Nouveau mot de passe</span>
              <input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-12 rounded-[14px] border border-[#31095A]/15 bg-[#FFFDFC] px-4 text-base text-[#31095A] outline-none transition focus:border-[#F837E2] focus:ring-2 focus:ring-[#F837E2]/15" placeholder="••••••••" />
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-bold text-[#31095A]">Confirmer le mot de passe</span>
              <input type="password" required minLength={6} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="min-h-12 rounded-[14px] border border-[#31095A]/15 bg-[#FFFDFC] px-4 text-base text-[#31095A] outline-none transition focus:border-[#F837E2] focus:ring-2 focus:ring-[#F837E2]/15" placeholder="••••••••" />
            </label>

            {error && <p role="alert" className="rounded-[12px] bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">{error}</p>}
            {message && <p role="status" className="rounded-[12px] bg-green-50 px-3 py-2.5 text-sm font-semibold text-green-700">{message}</p>}

            <button type="submit" disabled={loading || !!message} className="min-h-12 rounded-[14px] bg-[#31095A] px-4 py-3 text-sm font-black text-white shadow-[0_8px_20px_rgba(49,9,90,0.18)] transition active:scale-[0.99] disabled:cursor-wait disabled:opacity-60">
              {loading ? "Mise à jour..." : "Enregistrer le nouveau mot de passe"}
            </button>

            {message && (
              <button type="button" onClick={() => router.replace("/auth")} className="text-sm font-bold text-[#31095A] underline underline-offset-4">
                Retour à la connexion
              </button>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}
