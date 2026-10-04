"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "../lib/supabase/client";
import BookCard from "../components/books/BookCard";
import BookCover from "../components/books/BookCover";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";

type FilterStatus = "ALL" | "TO_READ" | "READING" | "READ" | "ABANDONED";
type Book = { id: number; title: string; author: string | null; isbn: string | null; cover_url: string | null; series: string | null; series_number: number | null };
type UserBook = { id: number; status: string; rating: number | null; books: Book | null };
type SeriesGroup = { name: string; books: UserBook[] };

export default function CollectionPage() {
  const supabase = createClient();
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCollection() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setUserBooks([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_books")
        .select(`
          id, status, rating,
          books (id, title, author, isbn, cover_url, series, series_number)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erreur chargement collection :", error);
        setUserBooks([]);
      } else {
        const validBooks = ((data as unknown as UserBook[]) || []).filter((item) => item.books !== null);
        setUserBooks(validBooks);
      }
      setLoading(false);
    }

    loadCollection();
  }, []);

  const filteredBooks = useMemo(
    () => activeFilter === "ALL" ? userBooks : userBooks.filter((item) => item.status === activeFilter),
    [userBooks, activeFilter]
  );

  const seriesGroups = useMemo<SeriesGroup[]>(() => {
    const groups = new Map<string, UserBook[]>();
    filteredBooks.forEach((item) => {
      const series = item.books?.series?.trim();
      if (!series) return;
      const key = series.toLowerCase();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    });

    return Array.from(groups.entries())
      .filter(([, books]) => books.length >= 2)
      .map(([key, books]) => ({
        name: [...books].sort((a, b) => (a.books?.series_number ?? 9999) - (b.books?.series_number ?? 9999))[0].books?.series?.trim() || key,
        books: [...books].sort((a, b) => (a.books?.series_number ?? 9999) - (b.books?.series_number ?? 9999)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredBooks]);

  const seriesBookIds = useMemo(() => {
    const ids = new Set<number>();
    seriesGroups.forEach((series) => series.books.forEach((item) => item.books && ids.add(item.books.id)));
    return ids;
  }, [seriesGroups]);

  const individualBooks = useMemo(
    () => filteredBooks.filter((item) => item.books && !seriesBookIds.has(item.books.id)),
    [filteredBooks, seriesBookIds]
  );

  const stats = useMemo(() => ({
    total: userBooks.length,
    read: userBooks.filter((item) => item.status === "READ").length,
    reading: userBooks.filter((item) => item.status === "READING").length,
    toRead: userBooks.filter((item) => item.status === "TO_READ").length,
    abandoned: userBooks.filter((item) => item.status === "ABANDONED").length,
  }), [userBooks]);

  const filters = [
    { key: "ALL" as const, label: "Tous", count: stats.total },
    { key: "TO_READ" as const, label: "À lire", count: stats.toRead },
    { key: "READING" as const, label: "En cours", count: stats.reading },
    { key: "READ" as const, label: "Lus", count: stats.read },
    { key: "ABANDONED" as const, label: "Abandonnés", count: stats.abandoned },
  ];

  if (loading) {
    return (
      <main className="biblidex-page">
        <div className="biblidex-container pt-8">
          <div className="h-8 w-44 animate-pulse rounded-lg bg-[#31095A]/10" />
          <div className="mt-3 h-4 w-64 animate-pulse rounded bg-[#31095A]/5" />
          <div className="mt-8 grid grid-cols-2 gap-3">
            {[1,2,3,4].map((i) => <div key={i} className="h-24 animate-pulse rounded-[20px] bg-[#31095A]/5" />)}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="biblidex-page">
      <div className="biblidex-container pt-5 md:pt-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#31095A]/45">Bibliothèque</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">Ma collection</h1>
            <p className="mt-1 text-sm text-[#31095A]/50">{stats.total} {stats.total > 1 ? "livres" : "livre"} dans ton Biblidex</p>
          </div>
          <Link href="/add" className="flex h-11 shrink-0 items-center rounded-[14px] bg-[#FECF4C] px-4 text-sm font-black text-[#31095A] shadow-sm">+ Ajouter</Link>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-2.5 md:grid-cols-4">
          <MiniStat label="Total" value={stats.total} />
          <MiniStat label="Lus" value={stats.read} />
          <MiniStat label="En cours" value={stats.reading} />
          <MiniStat label="À lire" value={stats.toRead} />
        </section>

        <div className="-mx-4 mt-6 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:px-0">
          <div className="flex w-max gap-2">
            {filters.map((filter) => {
              const active = activeFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveFilter(filter.key)}
                  className={`min-h-10 rounded-full px-4 text-sm font-bold transition ${active ? "bg-[#31095A] text-white" : "border border-[#31095A]/10 bg-white text-[#31095A]/60"}`}
                >
                  {filter.label}<span className={`ml-1.5 ${active ? "text-white/60" : "text-[#31095A]/35"}`}>{filter.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {seriesGroups.length > 0 && (
          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-black">Séries</h2>
              <span className="text-xs font-semibold text-[#31095A]/40">{seriesGroups.length} {seriesGroups.length > 1 ? "séries" : "série"}</span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible">
              {seriesGroups.map((series) => {
                const readCount = series.books.filter((item) => item.status === "READ").length;
                const progress = Math.round((readCount / series.books.length) * 100);
                return (
                  <Link
                    key={series.name}
                    href={`/series/${encodeURIComponent(series.name)}`}
                    className="w-[300px] shrink-0 rounded-[20px] border border-[#31095A]/10 bg-white p-4 shadow-[0_4px_20px_rgba(49,9,90,0.05)] transition hover:-translate-y-0.5 md:w-auto"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-black">{series.name}</h3>
                        <p className="mt-1 text-xs text-[#31095A]/45">{series.books.length} tomes · {readCount} lus</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#FECF4C] px-2.5 py-1 text-[11px] font-black text-[#31095A]">{progress}%</span>
                    </div>
                    <div className="mt-4 flex gap-2 overflow-hidden">
                      {series.books.slice(0, 5).map((item) => item.books && (
                        <div key={item.id} className="relative h-28 w-[74px] shrink-0">
                          <BookCover src={item.books.cover_url} alt={item.books.title} size="sm" />
                          {item.books.series_number !== null && (
                            <span className="absolute bottom-1 left-1 rounded bg-[#31095A] px-1.5 py-0.5 text-[9px] font-black text-white">T.{item.books.series_number}</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#31095A]/10">
                      <div className="h-full rounded-full bg-[#F837E2]" style={{ width: `${progress}%` }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-8 pb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black">{seriesGroups.length > 0 ? "Autres livres" : "Mes livres"}</h2>
            <span className="text-xs font-semibold text-[#31095A]/40">{individualBooks.length}</span>
          </div>

          {individualBooks.length === 0 ? (
            <EmptyState
              title={activeFilter === "ALL" ? "Ta collection est vide" : "Aucun livre ici"}
              description={activeFilter === "ALL" ? "Ajoute des livres pour construire ta bibliothèque." : "Essaie un autre filtre ou ajoute un nouveau livre."}
              action="Ajouter un livre"
              href="/add"
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {individualBooks.map((item) => {
                if (!item.books) return null;
                return (
                  <BookCard
                    key={item.id}
                    href={`/book/${item.books.id}`}
                    title={item.books.title}
                    author={item.books.author}
                    coverUrl={item.books.cover_url}
                    status={item.status}
                    meta={item.books.series ? `${item.books.series}${item.books.series_number !== null ? ` · T.${item.books.series_number}` : ""}` : null}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-3.5">
      <p className="text-[11px] font-bold text-[#31095A]/45">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </Card>
  );
}
