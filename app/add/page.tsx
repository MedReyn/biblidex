"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BarcodeScanner from "../components/BarcodeScanner";
import { createClient } from "../lib/supabase/client";

type BookResult = {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  isbn: string;
  coverUrl: string | null;
  publisher: string;
  publishedDate: string;
  type: string;
  volumeNumber: number | null;
  series?: string;
  source: "Open Library" | "BnF" | "Manuel";
};

const TYPE_LABELS: Record<string, string> = {
  BOOK: "Livre",
  MANGA: "Manga",
  COMIC: "Comic",
  BD: "BD",
  GRAPHIC_NOVEL: "Roman graphique",
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function cleanIsbn(value: string) {
  return value.replace(/[^0-9Xx]/g, "").toUpperCase();
}

function resultKey(book: Omit<BookResult, "id">) {
  const isbn = cleanIsbn(book.isbn);
  if (isbn) return `isbn:${isbn}`;
  return `book:${normalize(book.title)}|${normalize(book.author)}|${book.volumeNumber ?? ""}`;
}

function detectVolume(title: string) {
  const match = title.match(/(?:tome|tom|volume|vol\.?|#)\s*(\d+)\s*$/i)
    ?? title.match(/\s(\d+)\s*$/);

  return match ? Number(match[1]) : null;
}

function inferSeries(title: string, volumeNumber: number | null) {
  if (volumeNumber === null) return "";
  return title
    .replace(/(?:tome|tom|volume|vol\.?|#)\s*\d+\s*$/i, "")
    .replace(/\s+\d+\s*$/, "")
    .trim();
}

function detectType(title: string, series: string, subjects: string[] = []) {
  const value = `${title} ${series} ${subjects.join(" ")}`.toLowerCase();

  if (value.includes("manga")) return "MANGA";
  if (value.includes("bande dessinée") || value.includes("bd")) return "BD";
  if (value.includes("comic")) return "COMIC";
  if (value.includes("graphic novel") || value.includes("roman graphique")) return "GRAPHIC_NOVEL";
  return "BOOK";
}

function dedupeResults(results: BookResult[]) {
  const map = new Map<string, BookResult>();

  for (const result of results) {
    const key = resultKey(result);
    const existing = map.get(key);

    if (!existing) {
      map.set(key, result);
      continue;
    }

    // BnF is generally richer for French bibliographic data.
    if (result.source === "BnF" && existing.source === "Open Library") {
      map.set(key, {
        ...existing,
        ...result,
        coverUrl: result.coverUrl || existing.coverUrl,
        subtitle: result.subtitle || existing.subtitle,
        series: result.series || existing.series,
        volumeNumber: result.volumeNumber ?? existing.volumeNumber,
      });
    }
  }

  return Array.from(map.values()).slice(0, 8);
}

export default function AddBookPage() {
  const supabase = useMemo(() => createClient(), []);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [alreadyInCollection, setAlreadyInCollection] = useState<Set<string>>(new Set());

  const [manualTitle, setManualTitle] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");
  const [manualIsbn, setManualIsbn] = useState("");
  const [manualPublisher, setManualPublisher] = useState("");
  const [manualPublishedDate, setManualPublishedDate] = useState("");
  const [manualSeries, setManualSeries] = useState("");
  const [manualVolume, setManualVolume] = useState("");
  const [manualType, setManualType] = useState("BOOK");

  const hasResults = results.length > 0;

  useEffect(() => {
    async function loadExistingBooks() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("user_books")
        .select("books(isbn)")
        .eq("user_id", user.id);

      const isbns = new Set<string>();

      for (const item of data ?? []) {
        const isbn = cleanIsbn(String((item.books as { isbn?: string | null } | null)?.isbn ?? ""));
        if (isbn) isbns.add(isbn);
      }

      setAlreadyInCollection(isbns);
    }

    loadExistingBooks();
  }, [supabase]);

  async function searchBooks(value: string) {
    const cleanValue = value.trim();

    if (!cleanValue) {
      setResults([]);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    setResults([]);

    const isbn = cleanIsbn(cleanValue);
    const isIsbn = /^\d{10}$/.test(isbn) || /^\d{13}$/.test(isbn);

    try {
      const openLibraryQuery = isIsbn ? `isbn:${isbn}` : cleanValue;

      const [openLibraryResult, bnfResult] = await Promise.allSettled([
        fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(openLibraryQuery)}&fields=title,author_name,cover_i,first_publish_year,isbn,publisher,subject&limit=8`
        ).then(async (response) => (response.ok ? response.json() : null)),
        fetch(`/api/bnf?q=${encodeURIComponent(cleanValue)}`).then(async (response) =>
          response.ok ? response.json() : []
        ),
      ]);

      const automaticResults: BookResult[] = [];

      if (openLibraryResult.status === "fulfilled" && openLibraryResult.value?.docs) {
        for (const book of openLibraryResult.value.docs) {
          const title = book.title || "Titre inconnu";
          const bookIsbn =
            book.isbn?.find((value: string) => /^\d{13}$/.test(cleanIsbn(value))) ||
            book.isbn?.find((value: string) => /^\d{10}$/.test(cleanIsbn(value))) ||
            "";

          if (!bookIsbn) continue;

          const volumeNumber = detectVolume(title);
          const series = inferSeries(title, volumeNumber);
          const subjects = Array.isArray(book.subject) ? book.subject : [];

          automaticResults.push({
            id: `ol-${cleanIsbn(bookIsbn)}`,
            title,
            author: book.author_name?.join(", ") || "Auteur inconnu",
            isbn: cleanIsbn(bookIsbn),
            coverUrl: book.cover_i
              ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
              : null,
            publisher: book.publisher?.[0] || "",
            publishedDate: book.first_publish_year ? String(book.first_publish_year) : "",
            type: detectType(title, series, subjects),
            volumeNumber,
            series,
            source: "Open Library",
          });
        }
      }

      if (bnfResult.status === "fulfilled" && Array.isArray(bnfResult.value)) {
        for (const book of bnfResult.value) {
          if (!book.isbn) continue;

          automaticResults.push({
            id: `bnf-${cleanIsbn(book.isbn)}`,
            title: book.title || "Titre inconnu",
            subtitle: book.subtitle || "",
            author: book.author || "Auteur inconnu",
            isbn: cleanIsbn(book.isbn),
            coverUrl: book.coverUrl || null,
            publisher: book.publisher || "",
            publishedDate: book.publishedDate || "",
            type: book.type || "BOOK",
            volumeNumber: book.volumeNumber ?? null,
            series: book.series || "",
            source: "BnF",
          });
        }
      }

      const uniqueResults = dedupeResults(automaticResults);

      if (uniqueResults.length === 0) {
        setError(
          isIsbn
            ? `Aucun livre trouvé pour l'ISBN ${isbn}.`
            : "Aucun livre trouvé. Essaie avec un titre, un auteur ou un ISBN plus précis."
        );
      } else {
        setResults(uniqueResults);
      }
    } catch (searchError) {
      console.error("Erreur recherche :", searchError);
      setError("La recherche a rencontré un problème. Réessaie dans un instant.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const isbnFromUrl = new URLSearchParams(window.location.search).get("isbn");
    if (isbnFromUrl) {
      setQuery(isbnFromUrl);
      searchBooks(isbnFromUrl);
    }
  }, []);

  function handleBarcodeDetected(isbn: string) {
    setScannerOpen(false);
    setQuery(isbn);
    searchBooks(isbn);
  }

  async function addBook(book: BookResult) {
    const isbn = cleanIsbn(book.isbn);

    if (isbn && alreadyInCollection.has(isbn)) {
      setMessage("Ce livre est déjà dans ta collection.");
      return;
    }

    setAdding(book.id);
    setError("");
    setMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Tu dois être connecté pour ajouter un livre.");
        return;
      }

      // Work + edition remain synchronized with the existing Biblidex data model.
      const { data: existingWork, error: workSearchError } = await supabase
        .from("works")
        .select("id")
        .eq("title", book.title)
        .eq("author", book.author)
        .maybeSingle();

      if (workSearchError) throw workSearchError;

      let workId: string;

      if (existingWork) {
        workId = existingWork.id;
      } else {
        const { data: newWork, error: workInsertError } = await supabase
          .from("works")
          .insert({
            title: book.title,
            author: book.author,
            type: book.type,
            volume_number: book.volumeNumber,
            cover_url: book.coverUrl,
          })
          .select("id")
          .single();

        if (workInsertError || !newWork) {
          throw workInsertError ?? new Error("Création de l'œuvre impossible");
        }

        workId = newWork.id;
      }

      if (isbn) {
        const { data: existingEdition, error: editionSearchError } = await supabase
          .from("editions")
          .select("id")
          .eq("isbn", isbn)
          .maybeSingle();

        if (editionSearchError) throw editionSearchError;

        if (!existingEdition) {
          const { error: editionInsertError } = await supabase
            .from("editions")
            .insert({
              work_id: workId,
              isbn,
              publisher: book.publisher || null,
              published_date: book.publishedDate || null,
              cover_url: book.coverUrl,
            });

          if (editionInsertError) throw editionInsertError;
        }
      }

      const { data: existingBook, error: bookSearchError } = isbn
        ? await supabase.from("books").select("id").eq("isbn", isbn).maybeSingle()
        : { data: null, error: null };

      if (bookSearchError) throw bookSearchError;

      let bookId: string;

      if (existingBook) {
        bookId = existingBook.id;
      } else {
        const { data: newBook, error: bookError } = await supabase
          .from("books")
          .insert({
            title: book.title,
            author: book.author,
            isbn: isbn || null,
            cover_url: book.coverUrl,
            publisher: book.publisher || null,
            published_date: book.publishedDate || null,
            series: book.series || null,
            series_number: book.volumeNumber,
          })
          .select("id")
          .single();

        if (bookError || !newBook) {
          throw bookError ?? new Error("Création du livre impossible");
        }

        bookId = newBook.id;
      }

      const { error: userBookError } = await supabase.from("user_books").insert({
        user_id: user.id,
        book_id: bookId,
        status: "TO_READ",
      });

      if (userBookError) {
        if (userBookError.code === "23505") {
          if (isbn) setAlreadyInCollection((current) => new Set(current).add(isbn));
          setMessage("Ce livre est déjà dans ta collection.");
          return;
        }
        throw userBookError;
      }

      if (isbn) setAlreadyInCollection((current) => new Set(current).add(isbn));
      setMessage(`« ${book.title} » a été ajouté à ta collection.`);
    } catch (addError) {
      console.error("Erreur ajout :", addError);
      setError("Impossible d'ajouter ce livre pour le moment.");
    } finally {
      setAdding(null);
    }
  }

  async function addManualBook(event: FormEvent) {
    event.preventDefault();

    const title = manualTitle.trim();
    const isbn = cleanIsbn(manualIsbn);
    const volume = manualVolume.trim() ? Number(manualVolume) : null;

    if (!title) {
      setError("Le titre est obligatoire.");
      return;
    }

    if (manualVolume.trim() && (!Number.isInteger(volume) || Number(volume) < 1)) {
      setError("Le numéro de tome doit être un entier positif.");
      return;
    }

    if (isbn && alreadyInCollection.has(isbn)) {
      setMessage("Ce livre est déjà dans ta collection.");
      return;
    }

    setAdding("manual");
    setError("");
    setMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Tu dois être connecté pour ajouter un livre.");
        return;
      }

      const author = manualAuthor.trim() || "Auteur inconnu";
      const series = manualSeries.trim() || null;

      const { data: existingWork, error: workSearchError } = await supabase
        .from("works")
        .select("id")
        .eq("title", title)
        .eq("author", author)
        .maybeSingle();

      if (workSearchError) throw workSearchError;

      let workId: string;

      if (existingWork) {
        workId = existingWork.id;
      } else {
        const { data: newWork, error: workInsertError } = await supabase
          .from("works")
          .insert({
            title,
            author,
            type: manualType,
            volume_number: volume,
          })
          .select("id")
          .single();

        if (workInsertError || !newWork) {
          throw workInsertError ?? new Error("Création de l'œuvre impossible");
        }

        workId = newWork.id;
      }

      if (isbn) {
        const { data: existingEdition, error: editionSearchError } = await supabase
          .from("editions")
          .select("id")
          .eq("isbn", isbn)
          .maybeSingle();

        if (editionSearchError) throw editionSearchError;

        if (!existingEdition) {
          const { error: editionInsertError } = await supabase
            .from("editions")
            .insert({
              work_id: workId,
              isbn,
              publisher: manualPublisher.trim() || null,
              published_date: manualPublishedDate.trim() || null,
              cover_url: null,
            });

          if (editionInsertError) throw editionInsertError;
        }
      }

      const { data: existingBook, error: bookSearchError } = isbn
        ? await supabase.from("books").select("id").eq("isbn", isbn).maybeSingle()
        : { data: null, error: null };

      if (bookSearchError) throw bookSearchError;

      let bookId: string;

      if (existingBook) {
        bookId = existingBook.id;
      } else {
        const { data: newBook, error: bookError } = await supabase
          .from("books")
          .insert({
            title,
            author,
            isbn: isbn || null,
            publisher: manualPublisher.trim() || null,
            published_date: manualPublishedDate.trim() || null,
            series,
            series_number: volume,
            cover_url: null,
          })
          .select("id")
          .single();

        if (bookError || !newBook) {
          throw bookError ?? new Error("Création du livre impossible");
        }

        bookId = newBook.id;
      }

      const { error: userBookError } = await supabase.from("user_books").insert({
        user_id: user.id,
        book_id: bookId,
        status: "TO_READ",
      });

      if (userBookError) {
        if (userBookError.code === "23505") {
          setMessage("Ce livre est déjà dans ta collection.");
          return;
        }
        throw userBookError;
      }

      if (isbn) setAlreadyInCollection((current) => new Set(current).add(isbn));

      setMessage(`« ${title} » a été ajouté à ta collection.`);
      setManualTitle("");
      setManualAuthor("");
      setManualIsbn("");
      setManualPublisher("");
      setManualPublishedDate("");
      setManualSeries("");
      setManualVolume("");
      setManualType("BOOK");
      setManualOpen(false);
    } catch (addError) {
      console.error("Erreur ajout manuel :", addError);
      setError("Impossible d'ajouter ce livre pour le moment.");
    } finally {
      setAdding(null);
    }
  }

  const resultCountLabel = useMemo(
    () => `${results.length} résultat${results.length > 1 ? "s" : ""}`,
    [results.length]
  );

  return (
    <main className="biblidex-page">
      <div className="biblidex-container pt-5 md:pt-8">
        <Link href="/collection" className="text-sm font-semibold text-white/45 transition hover:text-white">
          ← Ma collection
        </Link>

        <header className="mt-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F837E2]">Ajouter</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-white">Trouve ton livre</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/50">
            Une seule recherche. Biblidex croise automatiquement Open Library et la BnF, puis retire les doublons.
          </p>
        </header>

        <section className="mt-6 rounded-[24px] border border-white/10 bg-[#111426] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.2)] md:p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FECF4C] text-[#31095A]">
              <SearchIcon />
            </span>
            <div>
              <h2 className="text-sm font-black text-white">Recherche automatique</h2>
              <p className="text-xs text-white/40">Titre, auteur ou ISBN</p>
            </div>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              searchBooks(query);
            }}
            className="mt-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ex. Dune, One Piece 12, 9782070368228"
                className="min-h-12 flex-1 rounded-[16px] border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#F837E2]"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="min-h-12 rounded-[16px] bg-[#FECF4C] px-6 text-sm font-black text-[#31095A] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Recherche…" : "Rechercher"}
              </button>
            </div>
          </form>

          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-white/75 transition hover:bg-white/[0.07]"
          >
            <ScanIcon />
            Scanner un ISBN
          </button>
        </section>

        <section className="mt-3 rounded-[20px] border border-white/10 bg-white/[0.025] p-4">
          <button
            type="button"
            onClick={() => setManualOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-4 text-left"
          >
            <div>
              <h2 className="text-sm font-black text-white">Tu ne trouves pas ton livre ?</h2>
              <p className="mt-1 text-xs text-white/40">Ajoute-le directement, sans recherche.</p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F837E2]/15 text-lg font-bold text-[#F837E2]">
              {manualOpen ? "−" : "+"}
            </span>
          </button>

          {manualOpen && (
            <form onSubmit={addManualBook} className="mt-4 border-t border-white/10 pt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Titre *" className="sm:col-span-2">
                  <input required value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} placeholder="Titre du livre" className={inputClass} />
                </Field>
                <Field label="Auteur">
                  <input value={manualAuthor} onChange={(e) => setManualAuthor(e.target.value)} placeholder="Auteur" className={inputClass} />
                </Field>
                <Field label="ISBN">
                  <input value={manualIsbn} onChange={(e) => setManualIsbn(e.target.value)} placeholder="Optionnel" inputMode="numeric" className={inputClass} />
                </Field>
                <Field label="Type">
                  <select value={manualType} onChange={(e) => setManualType(e.target.value)} className={inputClass}>
                    <option value="BOOK">Livre</option>
                    <option value="MANGA">Manga</option>
                    <option value="COMIC">Comic</option>
                    <option value="BD">BD</option>
                    <option value="GRAPHIC_NOVEL">Roman graphique</option>
                  </select>
                </Field>
                <Field label="Série">
                  <input value={manualSeries} onChange={(e) => setManualSeries(e.target.value)} placeholder="Optionnel" className={inputClass} />
                </Field>
                <Field label="Tome">
                  <input value={manualVolume} onChange={(e) => setManualVolume(e.target.value)} placeholder="Ex. 1" inputMode="numeric" className={inputClass} />
                </Field>
                <Field label="Éditeur">
                  <input value={manualPublisher} onChange={(e) => setManualPublisher(e.target.value)} placeholder="Optionnel" className={inputClass} />
                </Field>
                <Field label="Publication">
                  <input value={manualPublishedDate} onChange={(e) => setManualPublishedDate(e.target.value)} placeholder="Ex. 2026" className={inputClass} />
                </Field>
              </div>

              <button
                type="submit"
                disabled={adding === "manual"}
                className="mt-4 min-h-12 w-full rounded-[16px] bg-[#F837E2] px-5 text-sm font-black text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {adding === "manual" ? "Ajout en cours…" : "Ajouter à ma collection"}
              </button>
            </form>
          )}
        </section>

        {error && (
          <div className="mt-4 rounded-[16px] border border-red-400/20 bg-red-400/10 p-4 text-sm leading-5 text-red-200">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-4 rounded-[16px] border border-[#FECF4C]/20 bg-[#FECF4C]/10 p-4 text-sm leading-5 text-[#FECF4C]">
            {message}
          </div>
        )}

        {loading && (
          <div className="mt-6 space-y-3">
            <div className="h-5 w-32 animate-pulse rounded bg-white/10" />
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-36 animate-pulse rounded-[20px] border border-white/5 bg-white/[0.03]" />
            ))}
          </div>
        )}

        {!loading && hasResults && (
          <section className="mt-7 pb-8">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white">Résultats</h2>
                <p className="text-xs text-white/35">{resultCountLabel} · doublons regroupés</p>
              </div>
            </div>

            <div className="space-y-3">
              {results.map((book) => {
                const inCollection = alreadyInCollection.has(cleanIsbn(book.isbn));

                return (
                  <article key={book.id} className="flex gap-3 rounded-[20px] border border-white/10 bg-[#111426] p-3.5">
                    <div className="h-32 w-[82px] shrink-0 overflow-hidden rounded-[12px] bg-white/5">
                      {book.coverUrl ? (
                        <img src={book.coverUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center p-2 text-center text-[10px] font-bold text-white/25">
                          Pas de couverture
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 text-base font-black leading-5 text-white">{book.title}</h3>
                          {book.subtitle && <p className="mt-1 line-clamp-1 text-xs text-white/40">{book.subtitle}</p>}
                        </div>
                        <span className="shrink-0 rounded-full bg-white/[0.06] px-2 py-1 text-[10px] font-bold text-white/40">
                          {book.source}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-white/60">{book.author}</p>

                      {(book.series || book.volumeNumber !== null) && (
                        <p className="mt-2 text-xs font-semibold text-[#FECF4C]">
                          {book.series || "Série"}{book.volumeNumber !== null ? ` · Tome ${book.volumeNumber}` : ""}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold text-white/30">
                        {book.type && <span>{TYPE_LABELS[book.type] || book.type}</span>}
                        {book.publishedDate && <span>· {book.publishedDate}</span>}
                        {book.isbn && <span>· ISBN {book.isbn}</span>}
                      </div>

                      <button
                        type="button"
                        onClick={() => addBook(book)}
                        disabled={inCollection || adding === book.id}
                        className={`mt-3 min-h-10 rounded-[12px] px-4 text-xs font-black transition ${
                          inCollection
                            ? "bg-white/5 text-white/35"
                            : "bg-[#FECF4C] text-[#31095A] hover:opacity-90"
                        }`}
                      >
                        {inCollection ? "✓ Déjà dans ta collection" : adding === book.id ? "Ajout…" : "+ Ajouter"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {!loading && !hasResults && !error && !message && (
          <div className="mt-8 rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FECF4C]/10 text-[#FECF4C]">
              <SearchIcon />
            </div>
            <h2 className="mt-4 text-base font-black text-white">Prêt à collectionner ?</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/40">
              Recherche un livre ou scanne son ISBN. Si Biblidex ne le trouve pas, utilise l’ajout manuel juste au-dessus.
            </p>
          </div>
        )}
      </div>

      {scannerOpen && (
        <BarcodeScanner
          onDetected={handleBarcodeDetected}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </main>
  );
}

const inputClass =
  "min-h-11 w-full rounded-[14px] border border-white/10 bg-white/[0.04] px-3.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#F837E2]";

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.08em] text-white/35">{label}</span>
      {children}
    </label>
  );
}

function SearchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function ScanIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2" />
      <path d="M7 8h1M10 8v8M13 8v8M16 8v8M7 16h1" />
    </svg>
  );
}
