"use client";

import { FormEvent, useState } from "react";
import { createClient } from "../lib/supabase/client";
import Link from "next/link";

export default function SignupPage() {
  const supabase = createClient();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      "Compte créé ! Vérifie ton email pour confirmer ton inscription."
    );

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#090B18] px-5 text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center">

        <div className="mb-8 text-center">
          <div className="mb-5 text-6xl">
            ✨
          </div>

          <h1 className="text-3xl font-black">
            Bienvenue dans Biblidex
          </h1>

          <p className="mt-3 text-sm text-white/50">
            Le Pokédex de tes livres.
          </p>
        </div>

        <form
          onSubmit={handleSignup}
          className="space-y-4"
        >

          <div>
            <label className="mb-2 block text-sm font-medium">
              Pseudo
            </label>

            <input
              type="text"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Ton pseudo"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 outline-none placeholder:text-white/25 focus:border-pink-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Email
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ton@email.com"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 outline-none placeholder:text-white/25 focus:border-pink-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Mot de passe
            </label>

            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 outline-none placeholder:text-white/25 focus:border-pink-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-orange-400 via-pink-500 to-violet-500 px-5 py-4 font-bold shadow-lg transition hover:scale-[1.01] disabled:opacity-50"
          >
            {loading
              ? "Création..."
              : "Créer mon Biblidex"}
          </button>

        </form>

        {message && (
          <div className="mt-5 rounded-2xl bg-white/5 p-4 text-center text-sm text-white/70">
            {message}
          </div>
        )}

        <p className="mt-6 text-center text-sm text-white/40">
          Déjà inscrit ?{" "}
          <Link
            href="/login"
            className="font-semibold text-pink-400"
          >
            Se connecter
          </Link>
        </p>

      </div>
    </main>
  );
}