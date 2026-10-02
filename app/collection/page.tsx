"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "../lib/supabase/client";

type FilterStatus =
  | "ALL"
  | "TO_READ"
  | "READING"
  | "READ"
  | "ABANDONED";

type Book = {
  id: number;
  title: string;
  author: string | null;
  isbn: string | null;
  cover_url: string | null;
  series: string | null;
  series_number: number | null;
};

type UserBook = {
  id: number;
  status: string;
  rating: number | null;
  books: Book | null;
};

type SeriesGroup = {
  name: string;
  books: UserBook[];
};

export default function CollectionPage() {
  const supabase = createClient();

  const [userBooks, setUserBooks] = useState<UserBook[]>([]);
  const [activeFilter, setActiveFilter] =
    useState<FilterStatus>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCollection() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserBooks([]);
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
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(
          "Erreur chargement collection :",
          error
        );
        setUserBooks([]);
        setLoading(false);
        return;
      }

      const validBooks =
        ((data as unknown as UserBook[]) || []).filter(
          (item) => item.books !== null
        );

      setUserBooks(validBooks);
      setLoading(false);
    }

    loadCollection();
  }, []);

  const filteredBooks = useMemo(() => {
    if (activeFilter === "ALL") {
      return userBooks;
    }

    return userBooks.filter(
      (item) => item.status === activeFilter
    );
  }, [userBooks, activeFilter]);

  /*
   * On regroupe les livres par série.
   *
   * Une carte de série n'est affichée que si au moins
   * 2 tomes de cette série sont présents dans le filtre actuel.
   */
  const seriesGroups = useMemo<SeriesGroup[]>(() => {
    const groups = new Map<string, UserBook[]>();

    filteredBooks.forEach((item) => {
      const series = item.books?.series?.trim();

      if (!series) {
        return;
      }

      const key = series.toLowerCase();

      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups.get(key)!.push(item);
    });

    return Array.from(groups.entries())
      .filter(([, books]) => books.length >= 2)
      .map(([key, books]) => {
        const sortedBooks = [...books].sort(
          (a, b) =>
            (a.books?.series_number ?? 9999) -
            (b.books?.series_number ?? 9999)
        );

        return {
          name:
            sortedBooks[0].books?.series?.trim() || key,
          books: sortedBooks,
        };
      })
      .sort((a, b) =>
        a.name.localeCompare(b.name)
      );
  }, [filteredBooks]);

  /*
   * Les livres appartenant à une série affichée sont
   * retirés de la grille individuelle.
   */
  const seriesBookIds = useMemo(() => {
    const ids = new Set<number>();

    seriesGroups.forEach((series) => {
      series.books.forEach((item) => {
        if (item.books) {
          ids.add(item.books.id);
        }
      });
    });

    return ids;
  }, [seriesGroups]);

  const individualBooks = useMemo(() => {
    return filteredBooks.filter((item) => {
      if (!item.books) {
        return false;
      }

      return !seriesBookIds.has(item.books.id);
    });
  }, [filteredBooks, seriesBookIds]);

  const stats = useMemo(() => {
    return {
      total: userBooks.length,
      read: userBooks.filter(
        (item) => item.status === "READ"
      ).length,
      reading: userBooks.filter(
        (item) => item.status === "READING"
      ).length,
      toRead: userBooks.filter(
        (item) => item.status === "TO_READ"
      ).length,
      abandoned: userBooks.filter(
        (item) => item.status === "ABANDONED"
      ).length,
    };
  }, [userBooks]);

  const filters: {
    key: FilterStatus;
    label: string;
    count: number;
  }[] = [
    {
      key: "ALL",
      label: "Tous",
      count: stats.total,
    },
    {
      key: "TO_READ",
      label: "À lire",
      count: stats.toRead,
    },
    {
      key: "READING",
      label: "En cours",
      count: stats.reading,
    },
    {
      key: "READ",
      label: "Lus",
      count: stats.read,
    },
    {
      key: "ABANDONED",
      label: "Abandonnés",
      count: stats.abandoned,
    },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0f0f14] px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-white/60">
            Chargement de ta collection...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f0f14] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <header className="mb-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium uppercase tracking-widest text-white/40">
                Biblidex
              </p>

              <h1 className="text-4xl font-bold">
                Ma collection
              </h1>

              <p className="mt-2 text-white/50">
                {stats.total}{" "}
                {stats.total > 1 ? "livres" : "livre"} dans ta
                bibliothèque
              </p>
            </div>

            <Link
              href="/add"
              className="inline-flex w-fit items-center rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-white/90"
            >
              + Ajouter un livre
            </Link>
          </div>
        </header>

        {/* STATS */}
        <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-white/40">
              Total
            </p>
            <p className="mt-1 text-3xl font-bold">
              {stats.total}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-white/40">
              Lus
            </p>
            <p className="mt-1 text-3xl font-bold">
              {stats.read}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-white/40">
              En cours
            </p>
            <p className="mt-1 text-3xl font-bold">
              {stats.reading}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-white/40">
              À lire
            </p>
            <p className="mt-1 text-3xl font-bold">
              {stats.toRead}
            </p>
          </div>
        </section>

        {/* FILTERS */}
        <div className="mb-10 flex flex-wrap gap-2">
          {filters.map((filter) => {
            const active =
              activeFilter === filter.key;

            return (
              <button
                key={filter.key}
                type="button"
                onClick={() =>
                  setActiveFilter(filter.key)
                }
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-white text-black"
                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                {filter.label}
                <span
                  className={`ml-2 ${
                    active
                      ? "text-black/50"
                      : "text-white/30"
                  }`}
                >
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* SERIES */}
        {seriesGroups.length > 0 && (
          <section className="mb-12">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                Séries
              </h2>

              <span className="text-sm text-white/40">
                {seriesGroups.length}{" "}
                {seriesGroups.length > 1
                  ? "séries"
                  : "série"}
              </span>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {seriesGroups.map((series) => {
                const readCount =
                  series.books.filter(
                    (item) => item.status === "READ"
                  ).length;

                const progress =
                  series.books.length > 0
                    ? Math.round(
                        (readCount /
                          series.books.length) *
                          100
                      )
                    : 0;

                return (
                  <Link
                    key={series.name}
                    href={`/series/${encodeURIComponent(
                      series.name
                    )}`}
                    className="block overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:bg-white/[0.08]"
                  >
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold">
                          {series.name}
                        </h3>

                        <p className="mt-1 text-sm text-white/40">
                          {series.books.length}{" "}
                          {series.books.length > 1
                            ? "tomes"
                            : "tome"}
                        </p>
                      </div>

                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">
                        {readCount}/
                        {series.books.length} lus
                      </span>
                    </div>

                    {/* COVERS */}
                    <div className="mb-5 flex gap-3 overflow-hidden">
                      {series.books
                        .slice(0, 5)
                        .map((item) => {
                          if (!item.books) {
                            return null;
                          }

                          return (
                            <div
                              key={item.id}
                              className="relative h-32 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-white/5"
                            >
                              {item.books.cover_url ? (
                                <img
                                  src={
                                    item.books.cover_url
                                  }
                                  alt={item.books.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center p-2 text-center text-xs text-white/30">
                                  Pas de couverture
                                </div>
                              )}

                              {item.books.series_number !==
                                null && (
                                <div className="absolute bottom-1 left-1 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-bold">
                                  T.
                                  {
                                    item.books
                                      .series_number
                                  }
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>

                    {/* PROGRESS */}
                    <div>
                      <div className="mb-2 flex justify-between text-xs text-white/40">
                        <span>
                          Progression
                        </span>

                        <span>
                          {progress}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-white transition-all"
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* BOOKS */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {seriesGroups.length > 0
                ? "Livres"
                : "Ma bibliothèque"}
            </h2>

            <span className="text-sm text-white/40">
              {individualBooks.length}{" "}
              {individualBooks.length > 1
                ? "livres"
                : "livre"}
            </span>
          </div>

          {individualBooks.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center">
              <div className="mb-4 text-5xl">
                📚
              </div>

              <h3 className="text-xl font-semibold">
                Aucun livre à afficher
              </h3>

              <p className="mt-2 text-white/40">
                Ajoute des livres à ta collection pour
                les retrouver ici.
              </p>

              <Link
                href="/add"
                className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 font-semibold text-black"
              >
                Ajouter un livre
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {individualBooks.map((item) => {
                if (!item.books) {
                  return null;
                }

                const book = item.books;

                return (
                  <Link
                    key={item.id}
                    href={`/book/${book.id}`}
                    className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:-translate-y-1 hover:bg-white/10"
                  >
                    <div className="relative aspect-[2/3] overflow-hidden bg-white/5">
                      {book.cover_url ? (
                        <img
                          src={book.cover_url}
                          alt={book.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center p-4 text-center text-sm text-white/30">
                          Pas de couverture
                        </div>
                      )}

                      <div className="absolute bottom-3 left-3 rounded-full bg-black/80 px-3 py-1 text-xs backdrop-blur">
                        {item.status === "READ"
                          ? "Lu"
                          : item.status ===
                              "READING"
                            ? "En cours"
                            : item.status ===
                                "TO_READ"
                              ? "À lire"
                              : "Abandonné"}
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="line-clamp-2 font-semibold">
                        {book.title}
                      </h3>

                      {book.author && (
                        <p className="mt-1 line-clamp-1 text-sm text-white/40">
                          {book.author}
                        </p>
                      )}

                      {book.series && (
                        <p className="mt-2 line-clamp-1 text-xs text-white/30">
                          {book.series}
                          {book.series_number !==
                            null &&
                            ` · Tome ${book.series_number}`}
                        </p>
                      )}
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