"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

type SeriesBook = {
  id: number;
  status: string;
  rating: number | null;
  books: {
    id: number;
    title: string;
    author: string | null;
    isbn: string | null;
    cover_url: string | null;
    series: string | null;
    series_number: number | null;
  } | null;
};

export default function SeriesPage() {
  const params = useParams();
  const supabase = createClient();

  const seriesName = decodeURIComponent(
    String(params.name || "")
  ).trim();

  const [books, setBooks] = useState<SeriesBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSeries() {
      setLoading(true);

      const {
        data: {
          user,
        },
      } = await supabase.auth.getUser();

      if (!user) {
        setBooks([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_books")
        .select(`
          id,
          status,
          rating,
          books (
            id,
            title,
            author,
            isbn,
            cover_url,
            series,
            series_number
          )
        `)
        .eq("user_id", user.id);

      if (error) {
        console.error("Erreur chargement série :", error);
        setBooks([]);
        setLoading(false);
        return;
      }

      const allBooks =
        (data as unknown as SeriesBook[]) || [];

      // Comparaison insensible à la casse et aux espaces
      const normalizedSeries = seriesName
        .toLowerCase()
        .trim();

      const seriesBooks = allBooks
        .filter((item) => {
          if (!item.books?.series) {
            return false;
          }

          return (
            item.books.series
              .toLowerCase()
              .trim() === normalizedSeries
          );
        })
        .sort(
          (a, b) =>
            (a.books?.series_number ?? 9999) -
            (b.books?.series_number ?? 9999)
        );

      console.log("Série demandée :", seriesName);
      console.log(
        "Séries trouvées :",
        allBooks
          .filter((item) => item.books?.series)
          .map((item) => item.books?.series)
      );
      console.log("Tomes de la série :", seriesBooks);

      setBooks(seriesBooks);
      setLoading(false);
    }

    loadSeries();
  }, [seriesName]);

  const readCount = books.filter(
    (item) => item.status === "READ"
  ).length;

  const progress =
    books.length > 0
      ? Math.round((readCount / books.length) * 100)
      : 0;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FFF9F2] px-6 py-10 text-[#31095A]">
        <div className="mx-auto max-w-6xl">
          <p className="text-[#31095A]/60">
            Chargement de la série...
          </p>
        </div>
      </main>
    );
  }

  if (books.length === 0) {
    return (
      <main className="min-h-screen bg-[#FFF9F2] px-6 py-10 text-[#31095A]">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/collection"
            className="mb-8 inline-flex text-sm text-[#31095A]/60 transition hover:text-[#31095A]"
          >
            ← Ma collection
          </Link>

          <div className="py-20 text-center">
            <div className="mb-4 text-5xl">📚</div>

            <h1 className="mb-3 text-3xl font-bold">
              Série introuvable
            </h1>

            <p className="mb-8 text-[#31095A]/50">
              Aucun tome de cette série n'est présent dans ta
              collection.
            </p>

            <Link
              href="/collection"
              className="inline-flex rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-white/90"
            >
              ← Retour à ma collection
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFF9F2] px-6 py-10 text-[#31095A]">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/collection"
          className="mb-8 inline-flex text-sm text-[#31095A]/60 transition hover:text-[#31095A]"
        >
          ← Ma collection
        </Link>

        <header className="mb-10">
          <div className="mb-3 flex items-center gap-3">
            <span className="text-3xl">📚</span>

            <h1 className="text-4xl font-bold">
              {seriesName}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-[#31095A]/50">
            <span>
              {books.length}{" "}
              {books.length > 1 ? "tomes" : "tome"}
            </span>

            <span>•</span>

            <span>
              {readCount}/{books.length} lus
            </span>

            <span>•</span>

            <span>{progress}%</span>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </header>

        <section className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {books.map((item) => {
            if (!item.books) {
              return null;
            }

            const book = item.books;

            return (
              <Link
                key={item.id}
                href={`/book/${book.id}`}
                className="group overflow-hidden rounded-2xl border border-[#31095A]/10 bg-white transition hover:-translate-y-1 hover:bg-white"
              >
                <div className="relative aspect-[2/3] overflow-hidden bg-white">
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-4 text-center text-sm text-[#31095A]/40">
                      Pas de couverture
                    </div>
                  )}

                  {book.series_number !== null && (
                    <div className="absolute left-3 top-3 rounded-full bg-black/80 px-3 py-1 text-sm font-bold backdrop-blur">
                      Tome {book.series_number}
                    </div>
                  )}

                  <div className="absolute bottom-3 right-3 rounded-full bg-black/80 px-3 py-1 text-xs backdrop-blur">
                    {item.status === "READ"
                      ? "Lu"
                      : item.status === "READING"
                        ? "En cours"
                        : item.status === "TO_READ"
                          ? "À lire"
                          : "Abandonné"}
                  </div>
                </div>

                <div className="p-4">
                  <h2 className="line-clamp-2 font-semibold">
                    {book.title}
                  </h2>

                  {book.author && (
                    <p className="mt-1 line-clamp-1 text-sm text-[#31095A]/50">
                      {book.author}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}