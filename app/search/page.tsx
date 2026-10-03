"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type BookResult = {
  key: string;
  title: string;
  author: string;
  coverUrl: string | null;
  publishedDate: string;
  isbn: string;
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function searchBooks(e: FormEvent) {
    e.preventDefault();

    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(
          query.trim()
        )}&fields=key,title,author_name,cover_i,first_publish_year,isbn&limit=20`
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la recherche.");
      }

      const data = await response.json();

      const books: BookResult[] = data.docs
        .map((result: any) => {
          const isbn =
            result.isbn?.find((value: string) => {
              const clean = value.replace(/[- ]/g, "");
              return /^\d{10}$|^\d{13}$/.test(clean);
            }) || "";

          return {
            key: result.key,
            title: result.title || "Titre inconnu",
            author: result.author_name?.[0] || "Auteur inconnu",
            coverUrl: result.cover_i
              ? `https://covers.openlibrary.org/b/id/${result.cover_i}-M.jpg`
              : null,
            publishedDate: result.first_publish_year
              ? String(result.first_publish_year)
              : "",
            isbn: isbn.replace(/[- ]/g, ""),
          };
        })
        .filter(
          (book: BookResult) =>
            book.title && book.isbn
        );

      setResults(books);

      if (books.length === 0) {
        setError("Aucun livre trouvé.");
      }
    } catch (err) {
      console.error(err);
      setError("Impossible d'effectuer la recherche.");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#080B18] px-5 py-8 pb-28 text-white">
      <div className="mx-auto max-w-4xl">

        {/* HEADER */}
        <p className="text-sm font-semibold uppercase tracking-widest text-pink-400">
          Biblidex
        </p>

        <h1 className="mt-2 text-4xl font-black">
          Recherche
        </h1>

        <p className="mt-3 text-white/50">
          Trouve un livre, un manga, une BD ou un comic.
        </p>


        {/* SEARCH */}
        <form
          onSubmit={searchBooks}
          className="mt-8 flex gap-3"
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Titre, auteur, ISBN..."
            className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none placeholder:text-white/30 focus:border-pink-500/50"
          />

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="rounded-2xl bg-white px-6 py-4 font-bold text-[#080B18] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "..." : "Rechercher"}
          </button>
        </form>

        {/* ERROR */}
        {error && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-white/60">
            {error}
          </div>
        )}

        {/* RESULTS */}
        {results.length > 0 && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">

            {results.map((book, index) => (
              <Link
                key={`${book.isbn}-${book.title}-${index}`}
                href={`/add?isbn=${encodeURIComponent(book.isbn)}`}
                className="group flex gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
              >
                {/* COVER */}
                <div className="h-32 w-20 shrink-0 overflow-hidden rounded-xl bg-white/10">
                  {book.coverUrl ? (
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-2 text-center text-xs text-white/30">
                      Pas de couverture
                    </div>
                  )}
                </div>

                {/* INFO */}
                <div className="min-w-0 flex-1">
                  <h2 className="line-clamp-2 font-bold">
                    {book.title}
                  </h2>

                  <p className="mt-2 text-sm text-white/50">
                    {book.author}
                  </p>

                  {book.publishedDate && (
                    <p className="mt-1 text-xs text-white/30">
                      {book.publishedDate}
                    </p>
                  )}

                  <div className="mt-4 text-sm font-semibold text-pink-400">
  ＋ Ajouter à ma collection
</div>
                </div>
              </Link>
            ))}

          </div>
        )}

        {/* EMPTY STATE */}
        {!loading &&
          !error &&
          results.length === 0 && (
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
              <p className="text-lg font-bold">
                Que cherches-tu ?
              </p>

              <p className="mt-2 text-sm text-white/40">
                Recherche par titre, auteur ou ISBN.
              </p>

              <Link
                href="/add"
                className="mt-6 inline-block rounded-2xl bg-gradient-to-r from-orange-400 via-pink-500 to-violet-500 px-6 py-3 font-bold"
              >
                Ajouter un livre
              </Link>
            </div>
          )}

      </div>
    </main>
  );
}