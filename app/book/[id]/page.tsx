"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

type Book = {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  cover_url: string | null;
  publisher: string | null;
  published_date: string | null;
};

type Edition = {
  id: string;
  isbn: string | null;
  publisher: string | null;
  published_date: string | null;
  cover_url: string | null;
  language: string | null;
  format: string | null;
};

type UserBook = {
  id: string;
  status: string;
  rating: number | null;
};

const statuses = [
  { value: "TO_READ", label: "À lire" },
  { value: "READING", label: "En cours" },
  { value: "READ", label: "Lu" },
  { value: "ABANDONED", label: "Abandonné" },
];

export default function BookPage() {
  const params = useParams();
  const bookId = params.id as string;

  const supabase = createClient();

  const [book, setBook] = useState<Book | null>(null);
  const [edition, setEdition] = useState<Edition | null>(null);
  const [userBook, setUserBook] = useState<UserBook | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadBook();
  }, [bookId]);

  async function loadBook() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Tu dois être connecté.");
      setLoading(false);
      return;
    }

    /* =========================
       LIVRE
    ========================= */

    const { data: bookData, error: bookError } = await supabase
      .from("books")
      .select(`
        id,
        title,
        author,
        isbn,
        cover_url,
        publisher,
        published_date
      `)
      .eq("id", bookId)
      .single();

    if (bookError) {
      console.error(bookError);
      setError("Livre introuvable.");
      setLoading(false);
      return;
    }

    /* =========================
       ÉDITION
    ========================= */

    let editionData: Edition | null = null;

    if (bookData.isbn) {
      const { data, error: editionError } = await supabase
        .from("editions")
        .select(`
          id,
          isbn,
          publisher,
          published_date,
          cover_url,
          language,
          format
        `)
        .eq("isbn", bookData.isbn)
        .maybeSingle();

      if (editionError) {
        console.error("Erreur édition :", editionError);
      }

      editionData = data;
    }

    /* =========================
       LIVRE DE L'UTILISATEUR
    ========================= */

    const { data: userBookData, error: userBookError } =
      await supabase
        .from("user_books")
        .select("id, status, rating")
        .eq("book_id", bookId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (userBookError) {
      console.error("Erreur user_book :", userBookError);
      setError("Impossible de récupérer ton exemplaire.");
      setLoading(false);
      return;
    }

    setBook(bookData);
    setEdition(editionData);
    setUserBook(userBookData);

    setLoading(false);
  }

  /* =========================
     STATUT
  ========================= */

  async function updateStatus(status: string) {
    if (!userBook) return;

    setSaving(true);
    setError("");

    const { error } = await supabase
      .from("user_books")
      .update({ status })
      .eq("id", userBook.id);

    if (error) {
      console.error(error);
      setError("Impossible de modifier le statut.");
    } else {
      setUserBook({
        ...userBook,
        status,
      });
    }

    setSaving(false);
  }

  /* =========================
     NOTE
  ========================= */

  async function updateRating(rating: number) {
    if (!userBook) return;

    setSaving(true);
    setError("");

    const newRating =
      userBook.rating === rating ? null : rating;

    const { error } = await supabase
      .from("user_books")
      .update({ rating: newRating })
      .eq("id", userBook.id);

    if (error) {
      console.error(error);
      setError("Impossible d'enregistrer la note.");
    } else {
      setUserBook({
        ...userBook,
        rating: newRating,
      });
    }

    setSaving(false);
  }

  /* =========================
     SUPPRESSION
  ========================= */

  async function removeFromCollection() {
    if (!userBook) return;

    const confirmed = window.confirm(
      "Retirer ce livre de ta collection ?"
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");

    const { error } = await supabase
      .from("user_books")
      .delete()
      .eq("id", userBook.id);

    if (error) {
      console.error(error);
      setError(
        "Impossible de retirer ce livre de ta collection."
      );
      setDeleting(false);
      return;
    }

    window.location.href = "/collection";
  }

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080B18] p-6 text-white">
        <div className="mx-auto max-w-3xl py-20 text-center text-white/50">
          Chargement...
        </div>
      </main>
    );
  }

  /* =========================
     ERREUR
  ========================= */

  if (error || !book) {
    return (
      <main className="min-h-screen bg-[#080B18] p-6 text-white">
        <div className="mx-auto max-w-3xl py-20 text-center">
          <div className="text-5xl">
            📚
          </div>

          <p className="mt-5 text-red-300">
            {error || "Livre introuvable."}
          </p>

          <Link
            href="/collection"
            className="mt-6 inline-block rounded-2xl bg-white px-5 py-3 font-bold text-[#080B18]"
          >
            ← Retour à ma collection
          </Link>
        </div>
      </main>
    );
  }

  const currentStatus =
    statuses.find(
      (status) => status.value === userBook?.status
    )?.label || "À lire";

  return (
    <main className="min-h-screen bg-[#080B18] px-5 py-8 pb-20 text-white">
      <div className="mx-auto max-w-3xl">

        {/* =========================
            RETOUR
        ========================= */}

        <Link
          href="/collection"
          className="text-sm text-white/50 transition hover:text-white"
        >
          ← Ma collection
        </Link>

        {/* =========================
            LIVRE
        ========================= */}

        <div className="mt-8 grid gap-8 md:grid-cols-[260px_1fr]">

          {/* COUVERTURE */}

          <div className="mx-auto w-full max-w-[260px]">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
              {book.cover_url ? (
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="aspect-[2/3] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[2/3] items-center justify-center p-6 text-center text-2xl font-black">
                  {book.title}
                </div>
              )}
            </div>
          </div>

          {/* INFORMATIONS */}

          <div>

            <p className="text-sm font-semibold uppercase tracking-widest text-pink-400">
              Mon livre
            </p>

            <h1 className="mt-3 text-4xl font-black leading-tight">
              {book.title}
            </h1>

            <p className="mt-3 text-lg text-white/60">
              {book.author || "Auteur inconnu"}
            </p>

            {/* =========================
                STATUT
            ========================= */}

            {userBook && (
              <div className="mt-8">
                <label className="mb-2 block text-sm font-semibold text-white/60">
                  Statut
                </label>

                <select
                  value={userBook.status}
                  disabled={saving || deleting}
                  onChange={(event) =>
                    updateStatus(event.target.value)
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-white outline-none transition focus:border-pink-400"
                >
                  {statuses.map((status) => (
                    <option
                      key={status.value}
                      value={status.value}
                      className="bg-[#080B18]"
                    >
                      {status.label}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs text-white/40">
                  Statut actuel : {currentStatus}
                </p>
              </div>
            )}

            {/* =========================
                NOTE
            ========================= */}

            {userBook && (
              <div className="mt-8">
                <p className="mb-3 text-sm font-semibold text-white/60">
                  Ma note
                </p>

                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      disabled={saving || deleting}
                      onClick={() => updateRating(star)}
                      aria-label={`Noter ${star} sur 5`}
                      className={`text-3xl transition ${
                        (userBook.rating || 0) >= star
                          ? "text-yellow-300"
                          : "text-white/20 hover:text-yellow-200"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                {userBook.rating && (
                  <p className="mt-2 text-xs text-white/40">
                    {userBook.rating}/5
                  </p>
                )}
              </div>
            )}

          </div>
        </div>

        {/* =========================
            ERREUR D'ACTION
        ========================= */}

        {error && (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* =========================
            ÉDITION
        ========================= */}

        <section className="mt-12">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-pink-400">
            Édition
          </p>

          <div className="grid grid-cols-2 gap-3">

            <InfoCard
              label="ISBN"
              value={edition?.isbn || book.isbn || "—"}
            />

            <InfoCard
              label="Éditeur"
              value={
                edition?.publisher ||
                book.publisher ||
                "—"
              }
            />

            <InfoCard
              label="Publication"
              value={
                edition?.published_date ||
                book.published_date ||
                "—"
              }
            />

            <InfoCard
              label="Format"
              value={edition?.format || "—"}
            />

            <InfoCard
              label="Langue"
              value={edition?.language || "—"}
            />

          </div>
        </section>

        {/* =========================
            ACTIONS
        ========================= */}

        <section className="mt-12 border-t border-white/10 pt-8">

          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/30">
            Actions
          </p>

          <button
            type="button"
            disabled={saving || deleting || !userBook}
            onClick={removeFromCollection}
            className="w-full rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm font-semibold text-red-300 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting
              ? "Suppression..."
              : "Retirer de ma collection"}
          </button>

        </section>

      </div>
    </main>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <p className="text-xs text-white/40">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}