"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "./lib/supabase/client";

type Book = {
  id: string;
  title: string | null;
  author: string | null;
  isbn: string | null;
  cover_url: string | null;
};

type UserBook = {
  id: string;
  status: string;
  created_at: string;
  book_id: string;
  books: Book | null;
};

export default function Home() {
  const supabase = createClient();

  const [books, setBooks] = useState<UserBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHome() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setBooks([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_books")
        .select(
          `
            id,
            status,
            created_at,
            book_id,
            books (
              id,
              title,
              author,
              isbn,
              cover_url
            )
          `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erreur chargement Home :", error);
        setBooks([]);
 } else {
  const normalizedBooks: UserBook[] = (data ?? []).map((row) => ({
    id: row.id,
    status: row.status,
    created_at: row.created_at,
    book_id: row.book_id,
    books: Array.isArray(row.books)
      ? row.books[0] ?? null
      : row.books ?? null,
  }));

  setBooks(normalizedBooks);
}

      setLoading(false);
    }

    loadHome();
  }, []);

  const totalBooks = books.length;

  const readBooks = books.filter(
    (book) => book.status === "READ"
  ).length;

  const toReadBooks = books.filter(
    (book) => book.status === "TO_READ"
  ).length;

  const readingBooks = books.filter(
    (book) => book.status === "READING"
  );

  const recentBooks = books.slice(0, 6);

  return (
    <main className="min-h-screen bg-[#090B18] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col">

        {/* HEADER */}
        <header className="flex items-center justify-between px-5 pb-4 pt-6">
          <div>
            <Link
              href="/"
              aria-label="Retour à l'accueil"
              className="text-2xl font-black tracking-tight"
            >
              Biblidex<span className="text-yellow-300">.</span>
            </Link>

            <p className="mt-1 text-xs text-white/50">
              Le Pokédex de tes livres
            </p>
          </div>
        </header>

        {/* RECHERCHE */}
        <section className="px-5 pt-3">
          <Link
            href="/search"
            className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 transition hover:bg-white/15"
          >
            <span className="text-lg text-white/50">
              ⌕
            </span>

            <span className="text-sm text-white/40">
              Rechercher un livre...
            </span>
          </Link>
        </section>

        {/* HERO */}
        <section className="px-5 pt-7">
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-orange-400 via-pink-500 to-violet-600 p-6">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20 blur-2xl" />

            <div className="relative">
              <div className="mb-3 text-4xl">
                📚
              </div>

              <h1 className="text-3xl font-black leading-tight">
                Ton univers
                <br />
                de lecture.
              </h1>

              <p className="mt-3 max-w-[250px] text-sm leading-5 text-white/80">
                Collectionne, retrouve et partage tes livres avec ton cercle.
              </p>

              <Link
                href="/add"
                className="mt-5 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#151629] transition hover:scale-[1.02]"
              >
                + Ajouter un livre
              </Link>
            </div>
          </div>
        </section>

        {/* STATISTIQUES */}
        <section className="grid grid-cols-3 gap-3 px-5 pt-6">
          <Stat
            value={loading ? "—" : String(totalBooks)}
            label="Livres"
          />

          <Stat
            value={loading ? "—" : String(readBooks)}
            label="Lus"
          />

          <Stat
            value={loading ? "—" : String(toReadBooks)}
            label="À lire"
          />
        </section>

        {/* LECTURE EN COURS */}
        {readingBooks.length > 0 && (
          <section className="px-5 pt-8">
            <div className="mb-4">
              <h2 className="text-lg font-bold">
                Lecture en cours
              </h2>
            </div>

            <div className="space-y-3">
              {readingBooks.slice(0, 3).map((userBook) => {
                const book = userBook.books;

                if (!book) {
                  return null;
                }

                return (
                  <Link
                    key={userBook.id}
                    href={`/book/${book.id}`}
                    className="flex gap-3 rounded-2xl bg-white/[0.06] p-3 transition hover:bg-white/[0.1]"
                  >
                    <div className="flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10">
                      {book.cover_url ? (
                        <img
                          src={book.cover_url}
                          alt={book.title || "Livre"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">
                          📖
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 py-1">
                      <p className="truncate text-sm font-bold">
                        {book.title || "Livre sans titre"}
                      </p>

                      {book.author && (
                        <p className="mt-1 truncate text-xs text-white/50">
                          {book.author}
                        </p>
                      )}

                      <p className="mt-3 text-[10px] font-semibold text-yellow-300">
                        EN COURS
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* AJOUTÉS RÉCEMMENT */}
        <section className="px-5 pb-28 pt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">
              Ajoutés récemment
            </h2>

            <Link
              href="/collection"
              className="text-xs font-semibold text-white/50 transition hover:text-white"
            >
              Voir tout
            </Link>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-white/[0.06] p-6 text-center text-sm text-white/40">
              Chargement...
            </div>
          ) : recentBooks.length === 0 ? (
            <div className="rounded-2xl bg-white/[0.06] p-6 text-center">
              <p className="text-sm text-white/50">
                Ta collection est encore vide.
              </p>

              <Link
                href="/add"
                className="mt-4 inline-block rounded-full bg-white px-5 py-2 text-xs font-bold text-[#151629]"
              >
                Ajouter mon premier livre
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {recentBooks.map((userBook) => {
                const book = userBook.books;

                if (!book) {
                  return null;
                }

                return (
                  <Link
                    key={userBook.id}
                    href={`/book/${book.id}`}
                    className="group"
                  >
                    <div className="flex aspect-[2/3] items-center justify-center overflow-hidden rounded-xl bg-white/10 shadow-lg transition group-hover:scale-[1.02]">
                      {book.cover_url ? (
                        <img
                          src={book.cover_url}
                          alt={book.title || "Livre"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="p-3 text-center">
                          <span className="text-2xl">
                            📚
                          </span>

                          <p className="mt-2 text-[10px] font-bold">
                            {book.title || "Livre"}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-2 truncate text-[11px] text-white/60">
                      {book.title || "Livre sans titre"}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.06] p-4">
      <div className="text-xl font-black">
        {value}
      </div>

      <div className="mt-1 text-[11px] text-white/40">
        {label}
      </div>
    </div>
  );
}