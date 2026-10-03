export type BookResult = {
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

export async function searchBooks(
  queryValue: string
): Promise<BookResult[]> {
  const value = queryValue.trim();

  if (!value) {
    return [];
  }

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

  try {
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
          openLibraryData.docs
            .map((book: any) => {
              // =================================================
              // ISBN
              // =================================================

              const isbn =
                book.isbn?.find(
                  (value: string) =>
                    /^\d{13}$/.test(
                      value.replace(/[- ]/g, "")
                    )
                ) ||
                book.isbn?.[0] ||
                "";

              // =================================================
              // TITRE
              // =================================================

              const title =
                book.title ||
                "Titre inconnu";

              // =================================================
              // DÉTECTION DU TOME
              // =================================================

              const volumeMatch = title.match(
                /(?:tome|tom|volume|vol\.?|#)\s*(\d+)\s*$/i
              );

              let volumeNumber: number | null =
                volumeMatch
                  ? Number(volumeMatch[1])
                  : null;

              // Fallback :
              // "ONE PIECE 1" → 1
              // "ONE PIECE 14" → 14

              if (volumeNumber === null) {
                const trailingNumberMatch =
                  title.match(/\s(\d+)\s*$/);

                if (trailingNumberMatch) {
                  volumeNumber = Number(
                    trailingNumberMatch[1]
                  );
                }
              }

              // =================================================
              // DÉTECTION DE LA SÉRIE
              // =================================================

              let series = "";

              const seriesSubject =
                book.subject?.find(
                  (subject: string) => {
                    const lower =
                      subject.toLowerCase();

                    return (
                      lower.includes("(series)") ||
                      lower.includes("series")
                    );
                  }
                );

              if (seriesSubject) {
                series = seriesSubject
                  .replace(/^\s*series\s*:\s*/i, "")
                  .replace(/\s*\(series\)\s*/gi, "")
                  .replace(/\s*series\s*$/i, "")
                  .trim();
              }

              // Si aucune série n'est trouvée,
              // on la déduit du titre lorsqu'un tome est présent.

              if (!series && volumeNumber !== null) {
                series = title
                  .replace(
                    /(?:tome|tom|volume|vol\.?|#)\s*\d+\s*$/i,
                    ""
                  )
                  .replace(/\s+\d+\s*$/, "")
                  .trim();
              }

              // =================================================
              // TYPE
              // =================================================

              const lowerTitle =
                title.toLowerCase();

              const lowerSeries =
                series.toLowerCase();

              let type = "BOOK";

              if (
                lowerTitle.includes("manga") ||
                lowerSeries.includes("manga") ||
                book.subject?.some(
                  (subject: string) =>
                    subject
                      .toLowerCase()
                      .includes("manga")
                )
              ) {
                type = "MANGA";
              } else if (
                lowerTitle.includes("comic") ||
                lowerSeries.includes("comic") ||
                book.subject?.some(
                  (subject: string) =>
                    subject
                      .toLowerCase()
                      .includes("comic")
                )
              ) {
                type = "COMIC";
              } else if (
                book.subject?.some(
                  (subject: string) =>
                    subject
                      .toLowerCase()
                      .includes("graphic novel")
                )
              ) {
                type = "GRAPHIC_NOVEL";
              }

              // =================================================
              // RÉSULTAT
              // =================================================

              return {
                title,

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

                type,

                volumeNumber,

                series,
              };
            })
            .filter(
              (book: BookResult) =>
                book.isbn
            );

        if (results.length > 0) {
          return results;
        }
      }
    }
  } catch (error) {
    console.error(
      "Erreur OpenLibrary :",
      error
    );
  }

  // =========================================================
  // 2. BNF
  // =========================================================

  try {
    const bnfResponse = await fetch(
      `/api/bnf?q=${encodeURIComponent(value)}`
    );

    if (!bnfResponse.ok) {
      throw new Error(
        "Erreur lors de la recherche BnF."
      );
    }

    const bnfData =
      await bnfResponse.json();

    const bnfResults: BookResult[] =
      Array.isArray(bnfData)
        ? bnfData.map((book: any) => ({
            title:
              book.title ||
              "Titre inconnu",

            subtitle:
              book.subtitle || "",

            author:
              book.author ||
              "Auteur inconnu",

            isbn:
              book.isbn ||
              "",

            coverUrl:
              book.coverUrl ||
              null,

            publisher:
              book.publisher ||
              "",

            publishedDate:
              book.publishedDate ||
              "",

            description:
              book.description ||
              "",

            language:
              book.language ||
              "",

            type:
              book.type ||
              "BOOK",

            volumeNumber:
              book.volumeNumber ??
              null,

            series:
              book.series ||
              "",
          }))
        : [];

    if (bnfResults.length > 0) {
      return bnfResults;
    }
  } catch (error) {
    console.error(
      "Erreur BnF :",
      error
    );
  }

  // =========================================================
  // 3. AUCUN RÉSULTAT
  // =========================================================

  return [];
}