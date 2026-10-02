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
  const [scannerOpen, setScannerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  function handleBarcodeDetected(isbn: string) {
  setScannerOpen(false);
  setQuery(isbn);
  const [error, setError] = useState("");
}
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

    const { data: editionData, error: editionError } = await supabase
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
      console.error(editionError);
    }

    const { data: userBookData, error: userBookError } = await supabase
      .from("user_books")
      .select("id, status, rating")
      .eq("book_id", bookId)
      .eq("user_id", user.id)
      .single();

    if (userBookError) {
      console.error(userBookError);
    }

    setBook(bookData);
    setEdition(editionData);
    setUserBook(userBookData);
    setLoading(false);
  }

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

  async function updateRating(rating: number) {
    if (!userBook) return;

    setSaving(true);
    setError("");

    const { error } = await supabase
      .from("user_books")
      .update({ rating })
      .eq("id", userBook.id);

    if (error) {
      console.error(error);
      setError("Impossible d'enregistrer la note.");
    } else {
      setUserBook({
        ...userBook,
        rating,
      });
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080B18] p-6 text-white">
        <div className="mx-auto max-w-3xl py-20 text-center text-white/50">
          Chargement...
        </div>
      </main>
    );
  }

  if (error || !book) {
    return (
      <main className="min-h-screen bg-[#080B18] p-6 text-white">
        <div className="mx-auto max-w-3xl py-20 text-center">
          <p className="text-red-300">
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
    statuses.find((status) => status.value === userBook?.status)?.label ||
    "À lire";

  return (
    <main className="min-h-screen bg-[#080B18] px-5 py-8 text-white">
      <div className="mx-auto max-w-3xl">

        {/* RETOUR */}
        <Link
          href="/collection"
          className="text-sm text-white/50 hover:text-white"
        >
          ← Ma collection
        </Link>

        {/* LIVRE */}
        <div className="mt-8 grid gap-8 md:grid-cols-[260px_1fr]">

          {/* COUVERTURE */}
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={book.title}
                className="w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[2/3] items-center justify-center p-6 text-center text-2xl font-black">
                {book.title}
              </div>
            )}
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

            {/* STATUT */}
            <div className="mt-8">
              <label className="mb-2 block text-sm font-semibold text-white/60">
                Statut
              </label>

              <select
                value={userBook?.status || "TO_READ"}
                disabled={saving}
                onChange={(e) => updateStatus(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-white outline-none focus:border-pink-400"
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

            {/* NOTE */}
            <div className="mt-8">
              <p className="mb-3 text-sm font-semibold text-white/60">
                Ma note
              </p>

              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    disabled={saving}
                    onClick={() => updateRating(star)}
                    className={`text-3xl transition ${
                      (userBook?.rating || 0) >= star
                        ? "text-yellow-300"
                        : "text-white/20 hover:text-yellow-200"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* ÉDITION */}
            <div className="mt-10">
              <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-pink-400">
                Édition
              </p>

              <div className="grid grid-cols-2 gap-3">

                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs text-white/40">
                    ISBN
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {edition?.isbn || book.isbn || "—"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs text-white/40">
                    Éditeur
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {edition?.publisher || book.publisher || "—"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs text-white/40">
                    Publication
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {edition?.published_date ||
                      book.published_date ||
                      "—"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs text-white/40">
                    Format
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {edition?.format || "—"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs text-white/40">
                    Langue
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {edition?.language || "—"}
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}