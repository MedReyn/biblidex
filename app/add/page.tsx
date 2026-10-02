"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import BarcodeScanner from "../components/BarcodeScanner";
import { createClient } from "../lib/supabase/client";

type BookResult = {
  title: string;
  subtitle?: string;
  author: string;
  isbn: string;
  coverUrl: string | null;
  publisher: string;
  publishedDate: string;
  description?: string;
  language?: string;
  type: string;
  volumeNumber: number | null;
  series?: string;
};

export default function AddBookPage() {
  const supabase = createClient();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);

  // =========================================================
 async function searchBooks(queryValue: string) {
  const value = queryValue.trim();

  if (!value) return;

  setLoading(true);
  setError("");
  setResults([]);

  try {
    const cleanValue = value.replace(/[- ]/g, "");

    const isIsbn =
      /^\d{10}$/.test(cleanValue) ||
      /^\d{13}$/.test(cleanValue);

    // =========================================================
    // 1. OPEN LIBRARY
    // =========================================================

    const openLibraryQuery = isIsbn
      ? `isbn:${cleanValue}`
      : value;

    const openLibraryResponse = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(
        openLibraryQuery
      )}&fields=key,title,author_name,cover_i,first_publish_year,isbn,publisher,subject&limit=10`
    );

    if (openLibraryResponse.ok) {
      const openLibraryData =
        await openLibraryResponse.json();

      if (openLibraryData.docs?.length > 0) {
        const results: BookResult[] =
          openLibraryData.docs.map(
            (book: any) => {
              const isbn =
                book.isbn?.find(
                  (value: string) =>
                    /^\d{13}$/.test(value)
                ) ||
                book.isbn?.[0] ||
                "";

              return {
                title:
                  book.title ||
                  "Titre inconnu",

                author:
                  book.author_name?.join(", ") ||
                  "Auteur inconnu",

                isbn,

                coverUrl:
                  book.cover_i
                    ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
                    : null,

                publisher:
                  book.publisher?.[0] || "",

                publishedDate:
                  book.first_publish_year
                    ? String(
                        book.first_publish_year
                      )
                    : "",

                description: "",

                language: "",

                type: "BOOK",

                volumeNumber: null,
              };
            }
          );

        setResults(results);
        return;
      }
    }

    // =========================================================
    // 2. BNF
    // =========================================================

    
    const bnfResponse = await fetch(
  `/api/bnf?q=${encodeURIComponent(value)}`
);

if (!bnfResponse.ok) {
  throw new Error(
    "Erreur lors de la recherche BnF."
  );
}

const bnfData = await bnfResponse.json();

const bnfResults: BookResult[] = bnfData.map(
  (book: any) => ({
    title: book.title,
    subtitle: book.subtitle || "",
    author: book.author,
    isbn: book.isbn,
    coverUrl: book.coverUrl,
    publisher: book.publisher,
    publishedDate: book.publishedDate,
    description: book.description || "",
    language: book.language || "",
    type: book.type || "BOOK",
    volumeNumber: book.volumeNumber ?? null,
    series: book.series || "",
  })
);

setResults((current) => [
  ...current,
  ...bnfResults,
]);

return;

    // =========================================================
    // 3. AUCUN RÉSULTAT
    // =========================================================

    setResults([]);

    setError(
      isIsbn
        ? `Aucun livre trouvé pour l'ISBN ${cleanValue}.`
        : "Aucun livre trouvé."
    );
  } catch (error) {
    console.error(
      "Erreur recherche :",
      error
    );

    setResults([]);

    setError(
      "Une erreur est survenue pendant la recherche."
    );
  } finally {
    setLoading(false);
  }
}
  // =========================================================
  // SCANNER CODE-BARRES
  // =========================================================

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

    // ---------------------------------------------------------
    // 1. Vérifier que l'utilisateur est connecté
    // ---------------------------------------------------------

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Tu dois être connecté pour ajouter un livre.");
      setAdding(null);
      return;
    }

    // ---------------------------------------------------------
    // 2. Chercher si l'œuvre existe déjà
    // ---------------------------------------------------------

    const {
      data: existingWork,
      error: workSearchError,
    } = await supabase
      .from("works")
      .select("id")
      .eq("title", book.title)
      .eq("author", book.author)
      .maybeSingle();

    if (workSearchError) {
      console.error(workSearchError);
      setError("Impossible de vérifier l'œuvre.");
      setAdding(null);
      return;
    }

    let workId: string;

    // ---------------------------------------------------------
    // 3. Utiliser l'œuvre existante ou la créer
    // ---------------------------------------------------------

    if (existingWork) {
      workId = existingWork.id;
    } else {
      const {
        data: newWork,
        error: workInsertError,
      } = await supabase
        .from("works")
        .insert({
          title: book.title,
          author: book.author,
          cover_url: book.coverUrl,
          type: book.type,
          volume_number: book.volumeNumber,
        })
        .select("id")
        .single();

      if (workInsertError || !newWork) {
        console.error(workInsertError);
        setError("Impossible de créer l'œuvre.");
        setAdding(null);
        return;
      }

      workId = newWork.id;
    }

    // ---------------------------------------------------------
    // 4. Chercher l'édition par ISBN
    // ---------------------------------------------------------

    const {
      data: existingEdition,
      error: editionSearchError,
    } = await supabase
      .from("editions")
      .select("id")
      .eq("isbn", book.isbn)
      .maybeSingle();

    if (editionSearchError) {
      console.error(editionSearchError);
      setError("Impossible de vérifier l'édition.");
      setAdding(null);
      return;
    }

    // ---------------------------------------------------------
    // 5. Créer l'édition si nécessaire
    // ---------------------------------------------------------

    if (!existingEdition) {
      const { error: editionInsertError } = await supabase
        .from("editions")
        .insert({
          work_id: workId,
          isbn: book.isbn,
          publisher: book.publisher,
          published_date: book.publishedDate,
          cover_url: book.coverUrl,
        });

      if (editionInsertError) {
        console.error(editionInsertError);
        setError("Impossible d'enregistrer l'édition.");
        setAdding(null);
        return;
      }
    }

    // ---------------------------------------------------------
    // 6. Chercher le livre dans l'ancienne table books
    // ---------------------------------------------------------

    let bookId: string;

    const {
      data: existingBook,
      error: searchError,
    } = await supabase
      .from("books")
      .select("id")
      .eq("isbn", book.isbn)
      .maybeSingle();

    if (searchError) {
      console.error(searchError);
      setError("Impossible de vérifier le livre.");
      setAdding(null);
      return;
    }

    // ---------------------------------------------------------
    // 7. Utiliser le livre existant ou le créer
    // ---------------------------------------------------------

    if (existingBook) {
      bookId = existingBook.id;
    } else {
      const {
        data: newBook,
        error: insertError,
      } = await supabase
        .from("books")
        .insert({
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          cover_url: book.coverUrl,
          publisher: book.publisher,
          published_date: book.publishedDate,
        })
        .select("id")
        .single();

      if (insertError || !newBook) {
        console.error(insertError);
        setError("Impossible d'enregistrer le livre.");
        setAdding(null);
        return;
      }

      bookId = newBook.id;
    }

    // ---------------------------------------------------------
    // 8. Ajouter le livre à la collection de l'utilisateur
    // ---------------------------------------------------------

    const { error: userBookError } = await supabase
      .from("user_books")
      .insert({
        user_id: user.id,
        book_id: bookId,
        status: "TO_READ",
      });

    if (userBookError) {
      if (userBookError.code === "23505") {
        setMessage("Ce livre est déjà dans ta collection.");
      } else {
        console.error(userBookError);
        setError("Impossible d'ajouter le livre à ta collection.");
      }

      setAdding(null);
      return;
    }

    // ---------------------------------------------------------
    // 9. Succès
    // ---------------------------------------------------------

    setMessage(`« ${book.title} » a été ajouté à ta collection.`);
    setAdding(null);
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

            {results.map((book) => (
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
                </div>
              </article>
            ))}
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