"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setEmail(user.email || "");
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  async function handleLogout() {
    setLoggingOut(true);

    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#080B18] px-5 py-8 pb-28 text-white">
      <div className="mx-auto max-w-2xl">

        {/* HEADER */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-pink-400">
            Biblidex
          </p>

          <h1 className="mt-2 text-4xl font-black">
            Mon profil
          </h1>
        </div>

        {/* PROFIL */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">

          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 via-pink-500 to-violet-500 text-2xl font-black">
            {email ? email[0].toUpperCase() : "?"}
          </div>

          <p className="mt-5 text-sm text-white/40">
            Email
          </p>

          <p className="mt-1 break-all font-semibold">
            {loading ? "Chargement..." : email}
          </p>
        </div>

        {/* NAVIGATION */}
        <div className="mt-4 space-y-3">

          <Link
            href="/collection"
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
          >
            <div>
              <p className="font-semibold">
                Ma collection
              </p>

              <p className="mt-1 text-sm text-white/40">
                Voir tous mes livres
              </p>
            </div>

            <span className="text-xl text-white/40">
              →
            </span>
          </Link>

          <Link
            href="/add"
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
          >
            <div>
              <p className="font-semibold">
                Ajouter un livre
              </p>

              <p className="mt-1 text-sm text-white/40">
                Ajouter un nouveau livre à ma collection
              </p>
            </div>

            <span className="text-xl text-white/40">
              →
            </span>
          </Link>

          <Link
            href="/search"
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
          >
            <div>
              <p className="font-semibold">
                Rechercher
              </p>

              <p className="mt-1 text-sm text-white/40">
                Trouver un livre
              </p>
            </div>

            <span className="text-xl text-white/40">
              →
            </span>
          </Link>

        </div>

        {/* DÉCONNEXION */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-8 w-full rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-left font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loggingOut ? "Déconnexion..." : "Se déconnecter"}
        </button>

      </div>
    </main>
  );
}