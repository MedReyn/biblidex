"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addBookToCollection,
} from "../../../lib/addBook";
import { BookResult } from "../../../lib/bookSearch";

export default function ManualAddPage() {
    const router = useRouter();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [isbn, setIsbn] = useState("");
  const [publisher, setPublisher] = useState("");
  const [publishedDate, setPublishedDate] = useState("");
  const [series, setSeries] = useState("");
  const [volumeNumber, setVolumeNumber] = useState("");
  const [type, setType] = useState("Roman");
  const [language, setLanguage] = useState("Français");
  const [coverUrl, setCoverUrl] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
const [message, setMessage] = useState("");
const [error, setError] = useState("");

async function handleSubmit(event: FormEvent) {
  event.preventDefault();

  setSaving(true);
  setMessage("");
  setError("");

  const book: BookResult = {
    title: title.trim(),
    author: author.trim(),
    subtitle: subtitle.trim() || undefined,
    isbn: isbn.trim(),
    coverUrl: coverUrl.trim() || null,
    publisher: publisher.trim(),
    publishedDate,
    description: description.trim() || undefined,
    language,
    type,
    volumeNumber: volumeNumber
      ? Number(volumeNumber)
      : null,
    series: series.trim() || undefined,
  };

try {
  const result = await addBookToCollection(book);

  console.log("RÉSULTAT AJOUT MANUEL :", result);

 if (result.success) {
  console.log("REDIRECTION VERS COLLECTION");

  window.location.href = "/collection";
  return;
}

if (result.alreadyExists) {
  setMessage(
    result.message ||
      "Ce livre est déjà dans ta collection."
  );
  return;
}

setError(
  result.message ||
    "Impossible d'ajouter le livre à ta collection."
);
} catch (error) {
    console.error("Erreur ajout manuel :", error);

    setError(
      "Une erreur est survenue pendant l'ajout du livre."
    );
  } finally {
    setSaving(false);
  }
}

  return (
    <main className="min-h-screen bg-[#080B18] px-5 py-8 pb-24 text-white">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/add"
          className="text-sm text-white/50 transition hover:text-white"
        >
          ← Ajouter un livre
        </Link>

        <div className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-pink-400">
            Biblidex
          </p>

          <h1 className="mt-2 text-4xl font-black">
            Ajouter manuellement
          </h1>

          <p className="mt-2 text-white/50">
            Renseigne les informations du livre que tu souhaites ajouter.
          </p>
        </div>
{error && (
  <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
    {error}
  </div>
)}

{message && (
  <div className="mb-6 rounded-2xl border border-green-400/20 bg-green-400/10 p-4 text-sm text-green-300">
    {message}
  </div>
)}

<form onSubmit={handleSubmit} className="mt-8 space-y-6"></form>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* INFORMATIONS PRINCIPALES */}

          <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-bold">
              Informations principales
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-semibold">
                  Titre *
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  placeholder="Titre du livre"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-pink-400"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Auteur *
                </label>

                <input
                  type="text"
                  value={author}
                  onChange={(event) => setAuthor(event.target.value)}
                  required
                  placeholder="Nom de l'auteur"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-pink-400"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Sous-titre
                </label>

                <input
                  type="text"
                  value={subtitle}
                  onChange={(event) => setSubtitle(event.target.value)}
                  placeholder="Sous-titre"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-pink-400"
                />
              </div>
            </div>
          </section>

          {/* IDENTIFICATION */}

          <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-bold">
              Identification
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-semibold">
                  ISBN
                </label>

                <input
                  type="text"
                  value={isbn}
                  onChange={(event) => setIsbn(event.target.value)}
                  placeholder="9782070368228"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-pink-400"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Type
                </label>

                <select
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-pink-400"
                >
                  <option value="Roman">Roman</option>
                  <option value="BD">BD</option>
                  <option value="Manga">Manga</option>
                  <option value="Comics">Comics</option>
                  <option value="Album">Album</option>
                  <option value="Artbook">Artbook</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Langue
                </label>

                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-pink-400"
                >
                  <option value="Français">Français</option>
                  <option value="Anglais">Anglais</option>
                  <option value="Espagnol">Espagnol</option>
                  <option value="Allemand">Allemand</option>
                  <option value="Italien">Italien</option>
                  <option value="Japonais">Japonais</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>
          </section>

          {/* ÉDITION */}

          <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-bold">
              Édition
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-semibold">
                  Éditeur
                </label>

                <input
                  type="text"
                  value={publisher}
                  onChange={(event) => setPublisher(event.target.value)}
                  placeholder="Nom de l'éditeur"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-pink-400"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Date de publication
                </label>

                <input
                  type="date"
                  value={publishedDate}
                  onChange={(event) => setPublishedDate(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-pink-400"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Série
                </label>

                <input
                  type="text"
                  value={series}
                  onChange={(event) => setSeries(event.target.value)}
                  placeholder="Nom de la série"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-pink-400"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Numéro de tome
                </label>

                <input
                  type="number"
                  min="1"
                  value={volumeNumber}
                  onChange={(event) => setVolumeNumber(event.target.value)}
                  placeholder="1"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-pink-400"
                />
              </div>
            </div>
          </section>

          {/* COUVERTURE */}

          <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-bold">
              Couverture
            </h2>

            <div className="mt-5">
              <label className="text-sm font-semibold">
                URL de la couverture
              </label>

              <input
                type="url"
                value={coverUrl}
                onChange={(event) => setCoverUrl(event.target.value)}
                placeholder="https://..."
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-pink-400"
              />
            </div>
          </section>

          {/* DESCRIPTION */}

          <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-bold">
              Description
            </h2>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={6}
              placeholder="Description du livre..."
              className="mt-5 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-pink-400"
            />
          </section>

<button
  type="submit"
  disabled={saving}
  className="w-full rounded-2xl bg-white px-6 py-4 font-bold text-[#080B18] transition hover:bg-white/90 disabled:opacity-50"
>
  {saving
    ? "Ajout en cours..."
    : "＋ Ajouter à ma collection"}
</button>
        </form>
      </div>
    </main>
  );
}