"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";

type BookData = {
  series: string | null;
};

type UserBookData = {
  status: string;
  rating: number | null;
  books: BookData | BookData[] | null;
};

type Stats = {
  total: number;
  read: number;
  reading: number;
  toRead: number;
  abandoned: number;
};

type AdvancedStats = {
  series: number;
  averageRating: number;
};

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [editedUsername, setEditedUsername] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [editing, setEditing] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [stats, setStats] = useState<Stats>({
    total: 0,
    read: 0,
    reading: 0,
    toRead: 0,
    abandoned: 0,
  });

  const [advancedStats, setAdvancedStats] =
    useState<AdvancedStats>({
      series: 0,
      averageRating: 0,
    });

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const currentUsername =
        user.user_metadata?.username ||
        user.user_metadata?.name ||
        "";

      setEmail(user.email || "");
      setUsername(currentUsername);
      setEditedUsername(currentUsername);

      const { data, error } = await supabase
        .from("user_books")
        .select(`
          status,
          rating,
          books (
            series
          )
        `)
        .eq("user_id", user.id);

      if (error) {
        console.error(
          "Erreur chargement statistiques profil :",
          error
        );
      } else {
        const books =
          (data as unknown as UserBookData[]) || [];

        const read = books.filter(
          (book) => book.status === "READ"
        );

        const reading = books.filter(
          (book) => book.status === "READING"
        );

        const toRead = books.filter(
          (book) => book.status === "TO_READ"
        );

        const abandoned = books.filter(
          (book) => book.status === "ABANDONED"
        );

        setStats({
          total: books.length,
          read: read.length,
          reading: reading.length,
          toRead: toRead.length,
          abandoned: abandoned.length,
        });

        /*
         * Nombre de séries différentes.
         *
         * On normalise les noms pour éviter que
         * "One Piece" et "ONE PIECE" soient comptés
         * comme deux séries différentes.
         */
        const series = new Set(
          books
            .map((book) => {
              const bookData = Array.isArray(
                book.books
              )
                ? book.books[0]
                : book.books;

              return bookData?.series
                ?.trim()
                .toLowerCase();
            })
            .filter(Boolean)
        );

        /*
         * Note moyenne uniquement sur les livres
         * ayant effectivement une note.
         */
        const ratedBooks = books.filter(
          (book) =>
            typeof book.rating === "number" &&
            book.rating > 0
        );

        const averageRating =
          ratedBooks.length > 0
            ? ratedBooks.reduce(
                (total, book) =>
                  total + (book.rating || 0),
                0
              ) / ratedBooks.length
            : 0;

        setAdvancedStats({
          series: series.size,
          averageRating:
            Math.round(averageRating * 10) / 10,
        });
      }

      setLoading(false);
    }

    loadProfile();
  }, [router]);

  async function handleSaveProfile() {
    const newUsername =
      editedUsername.trim();

    if (!newUsername) {
      setErrorMessage(
        "Le pseudo ne peut pas être vide."
      );
      setMessage("");
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const { data, error } =
      await supabase.auth.updateUser({
        data: {
          username: newUsername,
        },
      });

    if (error) {
      console.error(
        "Erreur modification profil :",
        error
      );

      setErrorMessage(
        "Impossible de modifier ton profil."
      );

      setSaving(false);
      return;
    }

    const updatedUsername =
      data.user?.user_metadata?.username ||
      newUsername;

    setUsername(updatedUsername);
    setEditedUsername(updatedUsername);
    setEditing(false);

    setMessage("Profil mis à jour.");

    setSaving(false);

    router.refresh();
  }

  function handleCancelEdit() {
    setEditedUsername(username);
    setEditing(false);
    setMessage("");
    setErrorMessage("");
  }

  async function handleLogout() {
    setLoggingOut(true);

    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  const displayName =
    username ||
    (email
      ? email.split("@")[0]
      : "Lecteur");

  const avatarLetter =
    displayName.charAt(0).toUpperCase() || "?";

  const globalProgress =
    stats.total > 0
      ? Math.round(
          (stats.read / stats.total) * 100
        )
      : 0;

  return (
    <main className="min-h-screen bg-[#080B18] px-5 py-8 pb-28 text-white">
      <div className="mx-auto max-w-3xl">

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
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

            {/* AVATAR */}
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 via-pink-500 to-violet-500 text-2xl font-black">
              {loading ? "?" : avatarLetter}
            </div>

            {/* INFORMATIONS */}
            <div className="min-w-0 flex-1">

              {editing ? (
                <>
                  <label className="mb-2 block text-sm font-medium text-white/60">
                    Mon pseudo
                  </label>

                  <input
                    type="text"
                    value={editedUsername}
                    onChange={(event) =>
                      setEditedUsername(
                        event.target.value
                      )
                    }
                    maxLength={30}
                    autoFocus
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-pink-400"
                  />

                  <div className="mt-3 flex flex-wrap gap-2">

                    <button
                      type="button"
                      onClick={
                        handleSaveProfile
                      }
                      disabled={saving}
                      className="rounded-xl bg-gradient-to-r from-orange-400 via-pink-500 to-violet-500 px-4 py-2 text-sm font-bold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving
                        ? "Enregistrement..."
                        : "Enregistrer"}
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleCancelEdit
                      }
                      disabled={saving}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                    >
                      Annuler
                    </button>

                  </div>
                </>
              ) : (
                <>
                  <h2 className="truncate text-2xl font-bold">
                    {loading
                      ? "Chargement..."
                      : displayName}
                  </h2>

                  <p className="mt-1 break-all text-sm text-white/40">
                    {loading
                      ? "Chargement..."
                      : email}
                  </p>

                  {!loading && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditedUsername(
                          username
                        );

                        setEditing(true);
                        setMessage("");
                        setErrorMessage("");
                      }}
                      className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                    >
                      Modifier mon profil
                    </button>
                  )}
                </>
              )}

            </div>
          </div>

          {/* MESSAGE SUCCÈS */}
          {message && (
            <div className="mt-5 rounded-xl border border-green-400/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
              {message}
            </div>
          )}

          {/* MESSAGE ERREUR */}
          {errorMessage && (
            <div className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {errorMessage}
            </div>
          )}
        </section>

        {/* STATISTIQUES PRINCIPALES */}
        <section className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-white/40">
              Livres
            </p>

            <p className="mt-1 text-3xl font-black">
              {stats.total}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-white/40">
              Lus
            </p>

            <p className="mt-1 text-3xl font-black">
              {stats.read}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-white/40">
              En cours
            </p>

            <p className="mt-1 text-3xl font-black">
              {stats.reading}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-white/40">
              À lire
            </p>

            <p className="mt-1 text-3xl font-black">
              {stats.toRead}
            </p>
          </div>

        </section>

        {/* PROGRESSION GLOBALE */}
        <section className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-6">

          <div className="flex items-center justify-between gap-4">

            <div>
              <p className="text-sm text-white/40">
                Progression globale
              </p>

              <p className="mt-1 text-3xl font-black">
                {globalProgress}%
              </p>
            </div>

            <p className="text-sm text-white/40">
              {stats.read}/{stats.total} lus
            </p>

          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-400 via-pink-500 to-violet-500 transition-all"
              style={{
                width: `${globalProgress}%`,
              }}
            />
          </div>

        </section>

        {/* STATISTIQUES COMPLÉMENTAIRES */}
        <section className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-white/40">
              Séries
            </p>

            <p className="mt-1 text-3xl font-black">
              {advancedStats.series}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-white/40">
              Tomes
            </p>

            <p className="mt-1 text-3xl font-black">
              {stats.total}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-white/40">
              Note moyenne
            </p>

            <p className="mt-1 text-3xl font-black">
              {advancedStats.averageRating > 0
                ? `${advancedStats.averageRating}/5`
                : "—"}
            </p>
          </div>

        </section>

        {/* LIVRES ABANDONNÉS */}
        {stats.abandoned > 0 && (
          <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">
                  Livres abandonnés
                </p>

                <p className="mt-1 text-sm text-white/40">
                  Livres que tu as décidé de ne pas
                  terminer
                </p>
              </div>

              <span className="text-2xl font-black">
                {stats.abandoned}
              </span>
            </div>
          </section>
        )}

        {/* NAVIGATION */}
        <div className="mt-6 space-y-3">

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
                Ajouter un nouveau livre à ma
                collection
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
          {loggingOut
            ? "Déconnexion..."
            : "Se déconnecter"}
        </button>

      </div>
    </main>
  );
}