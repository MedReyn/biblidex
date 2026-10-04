"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#FFF9F2] px-6 py-10 text-[#31095A]">
      <div className="mx-auto max-w-md">
        <Link
          href="/"
          className="text-sm text-[#31095A]/60 hover:text-[#31095A]"
        >
          ← Retour à Biblidex
        </Link>

        <div className="mt-12">
          <h1 className="text-4xl font-black">
            Connexion
          </h1>

          <p className="mt-2 text-[#31095A]/60">
            Connecte-toi pour gérer ta collection.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="mt-8 space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Email
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="toi@email.com"
              className="w-full rounded-2xl border border-[#31095A]/10 bg-white px-4 py-3 outline-none focus:border-pink-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Mot de passe
            </label>

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-[#31095A]/10 bg-white px-4 py-3 outline-none focus:border-pink-400"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#FECF4C] text-[#31095A] px-5 py-4 font-bold transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#31095A]/50">
          Pas encore de compte ?{" "}
          <Link
            href="/signup"
            className="font-semibold text-[#F837E2] hover:text-[#F837E2]"
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </main>
  );
}