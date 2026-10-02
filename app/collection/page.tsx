"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "../lib/supabase/client";

type CollectionBook = {
  id: string;
  status: string;
  rating: number | null;
  books: {
    id: string;
    title: string;
    author: string | null;
    isbn: string | null;
    cover_url: string | null;
  };
};

const filters = [
  { value: "ALL", label: "Tous" },
  { value: "TO_READ", label: "À lire" },
  { value: "READING", label: "En cours" },
  { value: "READ", label: "Lus" },
  { value: "ABANDONED", label: "Abandonnés" },
];

const statusLabels: Record<string, string> = {
  TO_READ: "À lire",
  READING: "En cours",
  READ: "Lu",
  ABANDONED: "Abandonné",
};

export default function CollectionPage() {
  const supabase = createClient();

  const [books, setBooks] = useState<CollectionBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCollection();
  }, []);

  async function loadCollection() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Tu dois être connecté pour voir ta collection.");
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
          cover_url
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setError("Impossible de charger ta collection.");
      setLoading(false);
      return;
    }

    setBooks((data as unknown as CollectionBook[]) || []);
    setLoading(false);
  }

  const filteredBooks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return books.filter((item) => {
      const matchesFilter =
        filter === "ALL" || item.status === filter;

      if (!matchesFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const title = item.books.title?.toLowerCase() || "";
      const author = item.books.author?.toLowerCase() || "";
      const isbn = item.books.isbn?.toLowerCase() || "";

      return (
        title.includes(normalizedSearch) ||
        author.includes(normalizedSearch) ||
        isbn.includes(normalizedSearch)
      );
    });
  }, [books, filter, search]);

  return (
    <main className="min-h-screen bg-[#080B18] px-5 py-8 pb-24 text-white">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="text-sm text-white/50 transition hover:text-white"
            >
              ← Biblidex
            </Link>

            <h1 className="mt-4 text-4xl font-black">
              Ma collection
            </h1>

            <p className="mt-2 text-white/50">
              {filteredBooks.length} livre
              {filteredBooks.length > 1 ? "s" : ""}
            </p>
          </div>

          <Link
            href="/add"
            className="shrink-0 rounded-2xl bg-gradient-to-r from-orange-400 via-pink-500 to-violet-500 px-5 py-3 text-sm font-bold transition hover:opacity-90"
          >
            + Ajouter
          </Link>
        </div>

        {/* RECHERCHE */}
        <div className="mt-8">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <span className="text-lg text-white/40">
              ⌕
            </span>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un livre, un auteur ou un ISBN..."
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-xs text-white/40 transition hover:text-white"
                aria-label="Effacer la recherche"
              >
                Effacer
              </button>
            )}
          </div>
        </div>

        {/* FILTRES */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {filters.map((item) => {
            const count =
              item.value === "ALL"
                ? books.length
                : books.filter(
                    (book) => book.status === item.value
                  ).length;

            const active = filter === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-white text-[#080B18]"
                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}

                <span className="ml-2 opacity-50">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* CONTENU */}
        <div className="mt-10">

          {/* LOADING */}
          {loading && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-white/50">
              Chargement de ta collection...
            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-6 text-red-300">
              {error}
            </div>
          )}

          {/* COLLECTION VIDE */}
          {!loading && !error && books.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
              <div className="text-5xl">
                📚
              </div>

              <h2 className="mt-5 text-2xl font-bold">
                Ta collection est vide
              </h2>

              <p className="mt-2 text-white/50">
                Ajoute ton premier livre pour commencer ton Biblidex.
              </p>

              <Link
                href="/add"
                className="mt-6 inline-block rounded-2xl bg-white px-6 py-3 font-bold text-[#080B18]"
              >
                Ajouter mon premier livre
              </Link>
            </div>
          )}

          {/* AUCUN RÉSULTAT */}
          {!loading &&
            !error &&
            books.length > 0 &&
            filteredBooks.length === 0 && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
                <div className="text-4xl">
                  🔎
                </div>

                <h2 className="mt-5 text-xl font-bold">
                  Aucun livre trouvé
                </h2>

                <p className="mt-2 text-sm text-white/50">
                  Aucun livre ne correspond à ta recherche ou à ce filtre.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setFilter("ALL");
                  }}
                  className="mt-6 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-[#080B18]"
                >
                  Réinitialiser
                </button>
              </div>
            )}

          {/* LIVRES */}
          {!loading &&
            !error &&
            filteredBooks.length > 0 && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">

                {filteredBooks.map((item) => {
                  const statusLabel =
                    statusLabels[item.status] || item.status;

                  return (
                    <Link
                      key={item.id}
                      href={`/book/${item.books.id}`}
                      className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition hover:-translate-y-1 hover:bg-white/10"
                    >
                      {/* COVER */}
                      <div className="aspect-[2/3] overflow-hidden bg-gradient-to-br from-orange-400 via-pink-500 to-violet-500">
                        {item.books.cover_url ? (
                          <img
                            src={item.books.cover_url}
                            alt={item.books.title}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center p-5 text-center text-xl font-black">
                            {item.books.title}
                          </div>
                        )}
                      </div>

                      {/* INFOS */}
                      <div className="p-4">
                        <h2 className="line-clamp-2 font-bold">
                          {item.books.title}
                        </h2>

                        <p className="mt-1 line-clamp-1 text-sm text-white/50">
                          {item.books.author || "Auteur inconnu"}
                        </p>

                        <div className="mt-3 inline-flex rounded-full bg-orange-400/10 px-3 py-1 text-xs font-semibold text-orange-300">
                          {statusLabel}
                        </div>
                      </div>
                    </Link>
                  );
                })}

              </div>
            )}
        </div>
      </div>
    </main>
  );
}