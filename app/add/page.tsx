"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import BarcodeScanner from "../components/BarcodeScanner";
import { createClient } from "../lib/supabase/client";
import {
  searchBooks as searchBooksApi,
  BookResult,
} from "../../lib/bookSearch";
import { addBookToCollection } from "../../lib/addBook";

export default function AddBookPage() {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [collectionBooks, setCollectionBooks] = useState<string[]>([]);
  useEffect(() => {
  async function loadCollection() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCollectionBooks([]);
      return;
    }

    const { data, error } = await supabase
      .from("user_books")
      .select(`
        books (
          isbn
        )
      `)
      .eq("user_id", user.id);

    if (error) {
      console.error(
        "Erreur chargement collection :",
        error
      );
      return;
    }

    const isbns = (data ?? [])
      .map((row) => {
        const book = Array.isArray(row.books)
          ? row.books[0]
          : row.books;

        return book?.isbn;
      })
      .filter(
        (isbn): isbn is string =>
          Boolean(isbn)
      );

    setCollectionBooks(isbns);
  }

  loadCollection();
}, []);

  // =========================================================
async function searchBooks(queryValue: string) {
  const value = queryValue.trim();

  if (!value) return;

  setLoading(true);
  setError("");
  setResults([]);

  try {
    const data = await searchBooksApi(value);

    if (data.length > 0) {
      setResults(data);
      return;
    }

    const cleanValue = value.replace(/[- ]/g, "");

    const isIsbn =
      /^\d{10}$/.test(cleanValue) ||
      /^\d{13}$/.test(cleanValue);

    setError(
      isIsbn
        ? `Aucun livre trouvé pour l'ISBN ${cleanValue}.`
        : "Aucun livre trouvé."
    );
  } catch (error) {
    console.error("Erreur recherche :", error);

    setResults([]);
    setError(
      "Une erreur est survenue pendant la recherche."
    );
  } finally {
    setLoading(false);
  }
}
  // =========================================================
// ISBN transmis depuis une autre page
// =========================================================

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const isbnFromUrl = params.get("isbn");

  if (isbnFromUrl) {
    setQuery(isbnFromUrl);
    searchBooks(isbnFromUrl);
  }
}, []);

  function handleBarcodeDetected(isbn: string) {
    setScannerOpen(false);
    setQuery(isbn);

    // Lance automatiquement la recherche
    searchBooks(isbn);
  }

  // =========================================================
  // AJOUTER UN LIVRE
  // =========================================================

  async function addBook(book: BookResult) {
  setAdding(book.isbn);
  setError("");
  setMessage("");

  try {
    const result = await addBookToCollection(book);

if (result.success) {
  setCollectionBooks((current) =>
    current.includes(book.isbn)
      ? current
      : [...current, book.isbn]
  );

  setMessage(
    result.message ||
      `« ${book.title} » a été ajouté à ta collection.`
  );
} else {
      if (result.alreadyExists) {
        setMessage(
          result.message ||
            "Ce livre est déjà dans ta collection."
        );
      } else {
        setError(
          result.message ||
            "Impossible d'ajouter le livre à ta collection."
        );
      }
    }
  } catch (error) {
    console.error("Erreur ajout livre :", error);
    setError(
      "Une erreur est survenue pendant l'ajout du livre."
    );
  } finally {
    setAdding(null);
  }
}
function isBookInCollection(book: BookResult) {
  return collectionBooks.includes(book.isbn);
}
  // =========================================================
  // INTERFACE
  // =========================================================

  return (
    <main className="min-h-screen bg-[#080B18] px-5 py-8 pb-24 text-white">
      <div className="mx-auto max-w-4xl">

        {/* HEADER */}

        <Link
          href="/collection"
          className="text-sm text-white/50 hover:text-white"
        >
          ← Ma collection
        </Link>

        <div className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-pink-400">
            Biblidex
          </p>

          <h1 className="mt-2 text-4xl font-black">
            Ajouter un livre
          </h1>

          <p className="mt-2 text-white/50">
            Recherche par titre, auteur ou ISBN.
          </p>
        </div>

        {/* SCANNER */}

        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          className="mt-6 w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold transition hover:bg-white/10"
        >
          Scanner le code-barres
        </button>

        {/* SEARCH */}

        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            searchBooks(query);
          }}
          className="mt-8 flex flex-col gap-3 sm:flex-row"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Dune, Frank Herbert, 9782070368228..."
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none placeholder:text-white/30 focus:border-pink-400"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-gradient-to-r from-orange-400 via-pink-500 to-violet-500 px-7 py-4 font-bold transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Recherche..." : "Rechercher"}
          </button>
        </form>

        {/* MESSAGES */}

        {error && (
          <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {message && !error && (
          <div className="mt-5 rounded-2xl border border-green-400/20 bg-green-400/10 p-4 text-sm text-green-300">
            {message}
          </div>
        )}

        {/* RESULTS */}

        {results.length > 0 && (
          <div className="mt-8 space-y-4">
            <p className="text-sm font-semibold text-white/50">
              {results.length} résultat
              {results.length > 1 ? "s" : ""}
            </p>

{results.map((book) => {
  const alreadyInCollection =
    isBookInCollection(book);

  return (
    <article
                key={`${book.isbn}-${book.title}-${book.publisher}-${book.publishedDate}`}
                className="flex gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
              >
                {/* COVER */}

                <div className="h-32 w-22 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-orange-400 via-pink-500 to-violet-500">
                  {book.coverUrl ? (
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-2 text-center text-xs font-bold">
                      {book.title}
                    </div>
                  )}
                </div>

                {/* INFOS */}

                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold">
                    {book.title}
                  </h2>
{book.subtitle && (
  <p className="text-sm text-white/50">
    {book.subtitle}
  </p>
)}

{book.series && (
  <p className="text-xs text-white/40">
    {book.series}
    {book.volumeNumber
      ? ` · Tome ${book.volumeNumber}`
      : ""}
  </p>
)}
                  <p className="mt-1 text-sm text-white/60">
                    {book.author}
                  </p>
{alreadyInCollection && (
  <span className="mt-2 inline-flex rounded-full bg-yellow-300/15 px-2 py-1 text-[9px] font-bold text-yellow-300">
    ✓DÉJÀ AJOUTÉ
  </span>
)}
                  {book.publishedDate && (
                    <p className="mt-2 text-xs text-white/40">
                      {book.publishedDate}
                    </p>
                  )}

                  {book.isbn && (
                    <p className="mt-1 text-xs text-white/30">
                      ISBN {book.isbn}
                    </p>
                  )}

{!alreadyInCollection && (
  <button
    type="button"
    onClick={() => addBook(book)}
    disabled={adding === book.isbn}
    className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#080B18] transition hover:bg-white/90 disabled:opacity-50"
  >
    {adding === book.isbn
      ? "Ajout..."
      : "＋ Ajouter à ma collection"}
  </button>
)}
                </div>
              </article>
  );
})}
          </div>
        )}

        {/* EMPTY STATE */}

        {!loading && results.length === 0 && !message && !error && (
          <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
            <div className="text-5xl">🔎</div>

            <h2 className="mt-4 text-xl font-bold">
              Quel livre cherches-tu ?
            </h2>

            <p className="mt-2 text-sm text-white/40">
              Essaie un titre, un auteur ou un ISBN.
            </p>
          </div>
        )}
      </div>

      {/* SCANNER */}

      {scannerOpen && (
        <BarcodeScanner
          onDetected={handleBarcodeDetected}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </main>
  );
}