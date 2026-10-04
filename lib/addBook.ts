import { createClient } from "../app/lib/supabase/client";
import type { BookResult } from "./bookSearch";

export async function addBookToCollection(
  book: BookResult
): Promise<{
  success: boolean;
  alreadyExists?: boolean;
  message?: string;
}> {
  const supabase = createClient();

  // =========================================================
  // 1. VÉRIFIER QUE L'UTILISATEUR EST CONNECTÉ
  // =========================================================

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "Tu dois être connecté pour ajouter un livre.",
    };
  }

  const isbn = book.isbn.trim();

  // =========================================================
  // 2. VÉRIFIER SI LE LIVRE EST DÉJÀ DANS LA COLLECTION
  // =========================================================

  const { data: userBooks, error: userBooksSearchError } = await supabase
    .from("user_books")
    .select("book_id")
    .eq("user_id", user.id);

  if (userBooksSearchError) {
    console.error(userBooksSearchError);

    return {
      success: false,
      message: "Impossible de vérifier ta collection.",
    };
  }

  const userBookIds = (userBooks ?? []).map((item) => item.book_id);

  if (userBookIds.length > 0) {
    const { data: duplicateBook, error: duplicateSearchError } = await supabase
      .from("books")
      .select("id")
      .in("id", userBookIds)
      .ilike("title", book.title.trim())
      .ilike("author", book.author.trim())
      .limit(1)
      .maybeSingle();

    if (duplicateSearchError) {
      console.error(duplicateSearchError);

      return {
        success: false,
        message: "Impossible de vérifier si le livre est déjà dans ta collection.",
      };
    }

    if (duplicateBook) {
      return {
        success: false,
        alreadyExists: true,
        message: "Ce livre est déjà dans ta collection.",
      };
    }
  }

  // =========================================================
  // 3. CHERCHER SI L'ŒUVRE EXISTE DÉJÀ
  // =========================================================

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

    return {
      success: false,
      message: "Impossible de vérifier l'œuvre.",
    };
  }

  let workId: string;

  // =========================================================
  // 3. UTILISER L'ŒUVRE EXISTANTE OU LA CRÉER
  // =========================================================

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
        description: book.description || null,
        cover_url: book.coverUrl,
        type: book.type,
        volume_number: book.volumeNumber,
      })
      .select("id")
      .single();

    if (workInsertError || !newWork) {
      console.error(workInsertError);

      return {
        success: false,
        message: "Impossible de créer l'œuvre.",
      };
    }

    workId = newWork.id;
  }

  // =========================================================
  // 4. CHERCHER LE LIVRE DANS books
  // =========================================================

  let bookId: number;

  let existingBook = null;

  // On ne cherche par ISBN que si un ISBN est renseigné.
  if (isbn) {
    const {
      data,
      error: searchError,
    } = await supabase
      .from("books")
      .select("id")
      .eq("isbn", isbn)
      .maybeSingle();

    if (searchError) {
      console.error(searchError);

      return {
        success: false,
        message: "Impossible de vérifier le livre.",
      };
    }

    existingBook = data;
  }

  // =========================================================
  // 5. UTILISER LE LIVRE EXISTANT OU LE CRÉER
  // =========================================================

  if (existingBook) {
    bookId = existingBook.id;

    if (book.series || book.volumeNumber !== null) {
      const { error: updateError } = await supabase
        .from("books")
        .update({
          series: book.series || null,
          series_number: book.volumeNumber ?? null,
        })
        .eq("id", existingBook.id);

      if (updateError) {
        console.error(updateError);

        return {
          success: false,
          message:
            "Le livre existe déjà, mais ses informations de série n'ont pas pu être mises à jour.",
        };
      }
    }
  } else {
    const {
      data: newBook,
      error: insertError,
    } = await supabase
      .from("books")
      .insert({
        title: book.title,
        author: book.author,
        isbn: isbn || null,
        cover_url: book.coverUrl,
        publisher: book.publisher,
        published_date: book.publishedDate,
        description: book.description || null,
        series: book.series || null,
        series_number: book.volumeNumber ?? null,
      })
      .select("id")
      .single();

    if (insertError || !newBook) {
      console.error(insertError);

      return {
        success: false,
        message: "Impossible d'enregistrer le livre.",
      };
    }

    bookId = newBook.id;
  }

  // =========================================================
  // 6. CRÉER L'ÉDITION UNIQUEMENT SI ISBN RENSEIGNÉ
  // =========================================================

  if (isbn) {
    const {
      data: existingEdition,
      error: editionSearchError,
    } = await supabase
      .from("editions")
      .select("id")
      .eq("isbn", isbn)
      .maybeSingle();

    if (editionSearchError) {
      console.error(editionSearchError);

      return {
        success: false,
        message: "Impossible de vérifier l'édition.",
      };
    }

    if (!existingEdition) {
      const { error: editionInsertError } = await supabase
        .from("editions")
        .insert({
          work_id: workId,
          isbn,
          publisher: book.publisher,
          published_date: book.publishedDate,
          cover_url: book.coverUrl,
          language: book.language || null,
        });

      if (editionInsertError) {
        console.error(editionInsertError);

        return {
          success: false,
          message: "Impossible d'enregistrer l'édition.",
        };
      }
    }
  }

  // =========================================================
  // 7. AJOUTER LE LIVRE À LA COLLECTION
  // =========================================================

  const { error: userBookError } = await supabase
    .from("user_books")
    .insert({
      user_id: user.id,
      book_id: bookId,
      status: "TO_READ",
    });

  if (userBookError) {
    if (userBookError.code === "23505") {
      return {
        success: false,
        alreadyExists: true,
        message: "Ce livre est déjà dans ta collection.",
      };
    }

    console.error(userBookError);

    return {
      success: false,
      message: "Impossible d'ajouter le livre à ta collection.",
    };
  }

  return {
    success: true,
    message: `« ${book.title} » a été ajouté à ta collection.`,
  };
}