"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "./lib/supabase/client";
import BookCard from "./components/books/BookCard";
import BookCover from "./components/books/BookCover";
import Card from "./components/ui/Card";
import EmptyState from "./components/ui/EmptyState";
import StatusBadge from "./components/ui/StatusBadge";

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
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setBooks([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_books")
        .select(`
          id, status, created_at, book_id,
          books (id, title, author, isbn, cover_url)
        `)
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
          books: Array.isArray(row.books) ? row.books[0] ?? null : row.books ?? null,
        }));
        setBooks(normalizedBooks);
      }
      setLoading(false);
    }

    loadHome();
  }, []);

  const totalBooks = books.length;
  const readBooks = books.filter((book) => book.status === "READ").length;
  const toReadBooks = books.filter((book) => book.status === "TO_READ").length;
  const readingBooks = books.filter((book) => book.status === "READING");
  const recentBooks = books.slice(0, 6);

  return (
    <main className="biblidex-page">
      <div className="biblidex-container pb-8 pt-5 md:pt-8">
        <section className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#31095A]/50">Bienvenue dans</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-[#31095A] md:text-4xl">
              Biblidex
            </h1>
            <p className="mt-1 text-sm text-[#31095A]/55">Le Pokédex de tous les livres.</p>
          </div>
          <Link
            href="/profile"
            aria-label="Mon profil"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#31095A]/10 bg-white text-sm font-black text-[#31095A] shadow-sm"
          >
            M
          </Link>
        </section>

        <Link
          href="/search"
          className="mt-6 flex min-h-12 items-center gap-3 rounded-[16px] border border-[#31095A]/10 bg-white px-4 text-sm text-[#31095A]/40 shadow-sm"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          Rechercher un livre, une série, un auteur...
        </Link>

        <section className="mt-6 grid grid-cols-3 gap-2.5">
          <Stat value={loading ? "—" : String(totalBooks)} label="Livres" />
          <Stat value={loading ? "—" : String(readBooks)} label="Lus" />
          <Stat value={loading ? "—" : String(toReadBooks)} label="À lire" />
        </section>

        {readingBooks.length > 0 && (
          <section className="mt-8">
            <SectionHeading title="Lecture en cours" href="/collection?status=READING" />
            <div className="mt-3 space-y-3">
              {readingBooks.slice(0, 3).map((userBook) => {
                const book = userBook.books;
                if (!book) return null;
                return (
                  <Link key={userBook.id} href={`/book/${book.id}`}>
                    <Card className="flex items-center gap-3 p-3 transition hover:-translate-y-0.5">
                      <BookCover src={book.cover_url} alt={book.title || "Livre"} size="sm" />
                      <div className="min-w-0 flex-1">
                        <h2 className="line-clamp-2 text-sm font-extrabold">{book.title || "Livre sans titre"}</h2>
                        {book.author && <p className="mt-1 truncate text-xs text-[#31095A]/50">{book.author}</p>}
                        <div className="mt-2"><StatusBadge status={userBook.status} /></div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-8">
          <SectionHeading title="Ajoutés récemment" href="/collection" />
          {loading ? (
            <Card className="mt-3 p-6 text-center text-sm text-[#31095A]/50">Chargement de ta collection...</Card>
          ) : recentBooks.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                title="Ta collection est vide"
                description="Commence par ajouter ton premier livre et construis ton Biblidex."
                action="Ajouter un livre"
                href="/add"
              />
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {recentBooks.map((userBook) => {
                const book = userBook.books;
                if (!book) return null;
                return (
                  <BookCard
                    key={userBook.id}
                    href={`/book/${book.id}`}
                    title={book.title || "Livre sans titre"}
                    author={book.author}
                    coverUrl={book.cover_url}
                    status={userBook.status}
                  />
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-[24px] bg-[#31095A] p-5 text-white shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#FECF4C]">Ta bibliothèque</p>
              <h2 className="mt-1 text-xl font-black">Prêt à ajouter un nouveau livre ?</h2>
              <p className="mt-2 max-w-sm text-sm leading-5 text-white/65">Scanne un ISBN ou retrouve directement ton livre.</p>
            </div>
            <Link href="/add" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FECF4C] text-2xl font-black text-[#31095A]">+</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionHeading({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-lg font-black text-[#31095A]">{title}</h2>
      <Link href={href} className="text-xs font-bold text-[#31095A]/50 hover:text-[#31095A]">Voir tout</Link>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Card className="p-3.5">
      <div className="text-2xl font-black text-[#31095A]">{value}</div>
      <div className="mt-1 text-[11px] font-semibold text-[#31095A]/45">{label}</div>
    </Card>
  );
}
