"use client";

import { useEffect, useRef, useState } from "react";
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
  description: string | null;
  series: string | null;
  series_number: number | null;
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
  notes: string | null;
  created_at: string | null;
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
  const [notesSaving, setNotesSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [error, setError] = useState("");
  const notesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadBook();

    return () => {
      if (notesTimerRef.current) {
        clearTimeout(notesTimerRef.current);
      }
    };
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
      .select(
        `
          id,
          title,
          author,
          isbn,
          cover_url,
          publisher,
          published_date,
          description,
          series,
          series_number
        `
      )
      .eq("id", bookId)
      .single();

    if (bookError) {
      console.error(bookError);
      setError("Livre introuvable.");
      setLoading(false);
      return;
    }

    let editionData: Edition | null = null;

    if (bookData.isbn) {
      const { data, error: editionError } = await supabase
        .from("editions")
        .select(
          `
            id,
            isbn,
            publisher,
            published_date,
            cover_url,
            language,
            format
          `
        )
        .eq("isbn", bookData.isbn)
        .maybeSingle();

      if (editionError) {
        console.error("Erreur édition :", editionError);
      }

      editionData = data;
    }

    const { data: userBookData, error: userBookError } = await supabase
      .from("user_books")
      .select("id, status, rating, notes, created_at")
      .eq("book_id", bookId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (userBookError) {
      console.error("Erreur user_book :", userBookError);
      setError("Impossible de récupérer ton exemplaire.");
      setLoading(false);
      return;
    }

    if (!userBookData) {
      setError("Ce livre n'est pas dans ta collection.");
      setLoading(false);
      return;
    }

    setBook(bookData);
    setEdition(editionData);
    setUserBook(userBookData);
    setLoading(false);
  }

  async function updateUserBook(values: Partial<UserBook>) {
    if (!userBook) return false;

    setSaving(true);
    setError("");
    setNotesSaved(false);

    const { error: updateError } = await supabase
      .from("user_books")
      .update(values)
      .eq("id", userBook.id);

    if (updateError) {
      console.error(updateError);
      setError("Impossible d'enregistrer la modification.");
      setSaving(false);
      return false;
    }

    setUserBook({
      ...userBook,
      ...values,
    });

    setSaving(false);
    return true;
  }

  async function updateStatus(status: string) {
    await updateUserBook({ status });
  }

  async function updateRating(rating: number) {
    const newRating = userBook?.rating === rating ? null : rating;
    await updateUserBook({ rating: newRating });
  }

  function handleNotesChange(notes: string) {
    if (!userBook) return;

    setUserBook({
      ...userBook,
      notes,
    });
    setNotesSaved(false);

    if (notesTimerRef.current) {
      clearTimeout(notesTimerRef.current);
    }

    notesTimerRef.current = setTimeout(async () => {
      setNotesSaving(true);
      setError("");

      const { error: notesError } = await supabase
        .from("user_books")
        .update({ notes })
        .eq("id", userBook.id);

      setNotesSaving(false);

      if (notesError) {
        console.error(notesError);
        setError("Impossible d'enregistrer tes notes.");
        return;
      }

      setNotesSaved(true);
    }, 700);
  }

  async function removeFromCollection() {
    if (!userBook) return;

    const confirmed = window.confirm(
      "Retirer ce livre de ta collection ?"
    );

    if (!confirmed) return;

    setDeleting(true);
    setError("");

    const { error: deleteError } = await supabase
      .from("user_books")
      .delete()
      .eq("id", userBook.id);

    if (deleteError) {
      console.error(deleteError);
      setError("Impossible de retirer ce livre de ta collection.");
      setDeleting(false);
      return;
    }

    window.location.href = "/collection";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080B18] p-6 text-white">
        <div className="mx-auto max-w-5xl py-20 text-center text-white/50">
          Chargement de la fiche...
        </div>
      </main>
    );
  }

  if (error || !book || !userBook) {
    return (
      <main className="min-h-screen bg-[#080B18] p-6 text-white">
        <div className="mx-auto max-w-3xl py-20 text-center">
          <div className="text-5xl">📚</div>
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
    statuses.find((status) => status.value === userBook.status)?.label ||
    "À lire";

  const addedDate = userBook.created_at
    ? new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(userBook.created_at))
    : null;

  return (
    <main className="min-h-screen bg-[#080B18] px-5 py-8 pb-20 text-white">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/collection"
          className="text-sm text-white/50 transition hover:text-white"
        >
          ← Ma collection
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[300px_1fr]">
          <div>
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

            {addedDate && (
              <p className="mt-4 text-center text-xs text-white/30">
                Ajouté à ta collection le {addedDate}
              </p>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-pink-400">
              Ma fiche
            </p>

            <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
              {book.title}
            </h1>

            <p className="mt-3 text-lg text-white/60">
              {book.author || "Auteur inconnu"}
            </p>

            {book.series && (
              <Link
                href={"/series/" + encodeURIComponent(book.series)}
                className="mt-5 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/15 hover:text-white"
              >
                {book.series}
                {book.series_number !== null &&
                  " · Tome " + book.series_number}
              </Link>
            )}

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-white/60">
                  Statut de lecture
                </p>
                <span className="text-xs text-white/30">
                  {saving ? "Enregistrement..." : currentStatus}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {statuses.map((status) => {
                  const active = userBook.status === status.value;

                  return (
                    <button
                      key={status.value}
                      type="button"
                      disabled={saving || deleting}
                      onClick={() => updateStatus(status.value)}
                      className={
                        "rounded-xl px-3 py-3 text-sm font-semibold transition " +
                        (active
                          ? "bg-white text-[#080B18]"
                          : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white")
                      }
                    >
                      {status.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white/60">
                Ma note
              </p>

              <div className="mt-3 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    disabled={saving || deleting}
                    onClick={() => updateRating(star)}
                    aria-label={"Noter " + star + " sur 5"}
                    className={
                      "text-3xl transition " +
                      ((userBook.rating || 0) >= star
                        ? "text-yellow-300"
                        : "text-white/20 hover:text-yellow-200")
                    }
                  >
                    ★
                  </button>
                ))}

                <span className="ml-3 text-sm text-white/40">
                  {userBook.rating
                    ? userBook.rating + "/5"
                    : "Pas encore noté"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          {book.description && (
            <section>
              <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-pink-400">
                À propos du livre
              </p>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="whitespace-pre-line text-sm leading-7 text-white/60">
                  {book.description}
                </p>
              </div>
            </section>
          )}

          <section>
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
                value={edition?.publisher || book.publisher || "—"}
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
        </div>

        <section className="mt-12">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-pink-400">
                Mes notes
              </p>
              <p className="mt-1 text-xs text-white/30">
                Elles sont enregistrées automatiquement.
              </p>
            </div>

            <span className="text-xs text-white/30">
              {notesSaving
                ? "Enregistrement..."
                : notesSaved
                  ? "Enregistré"
                  : ""}
            </span>
          </div>

          <textarea
            value={userBook.notes || ""}
            onChange={(event) => handleNotesChange(event.target.value)}
            disabled={deleting}
            placeholder="Ajoute tes impressions, ce que tu veux retenir, où tu en es..."
            rows={6}
            className="w-full resize-y rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-white/20 focus:border-pink-400/50 focus:bg-white/[0.07]"
          />
        </section>

        <section className="mt-12 border-t border-white/10 pt-8">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/30">
            Actions
          </p>

          <button
            type="button"
            disabled={saving || deleting}
            onClick={removeFromCollection}
            className="w-full rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm font-semibold text-red-300 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? "Suppression..." : "Retirer de ma collection"}
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
      <p className="text-xs text-white/40">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}
