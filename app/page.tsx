"use client";

import Link from "next/link";

const books = [
  {
    title: "Dune",
    author: "Frank Herbert",
    color: "from-orange-400 to-pink-500",
  },
  {
    title: "One Piece",
    author: "Eiichiro Oda",
    color: "from-blue-400 to-violet-500",
  },
  {
    title: "Harry Potter",
    author: "J.K. Rowling",
    color: "from-violet-500 to-fuchsia-500",
  },
];

export default function Home() {

  return (
    <main className="min-h-screen bg-[#090B18] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col">

        {/* Header */}
        <header className="flex items-center justify-between px-5 pb-4 pt-6">
          <div>
            <Link
  href="/"
  aria-label="Retour à l'accueil"
   className="text-2xl font-black tracking-tight">
              Biblidex<span className="text-yellow-300">.</span>
            </Link>

            <p className="mt-1 text-xs text-white/50">
              Le Pokédex de tes livres
            </p>
          </div>
        </header>

        {/* Recherche */}
        <section className="px-5 pt-3">
  <Link
    href="/search"
    className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 transition hover:bg-white/15"
  >
    <span className="text-lg text-white/50">⌕</span>

    <span className="text-sm text-white/40">
      Rechercher un livre...
    </span>
  </Link>
</section>

        {/* Hero */}
        <section className="px-5 pt-7">
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-orange-400 via-pink-500 to-violet-600 p-6">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20 blur-2xl" />

            <div className="relative">
              <div className="mb-3 text-4xl">📚</div>

              <h1 className="text-3xl font-black leading-tight">
                Ton univers
                <br />
                de lecture.
              </h1>

              <p className="mt-3 max-w-[250px] text-sm leading-5 text-white/80">
                Collectionne, retrouve et partage tes livres avec ton cercle.
              </p>

              <Link
  href="/add"
  className="mt-5 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#151629] transition hover:scale-[1.02]"
>
  + Ajouter un livre
</Link>
            </div>
          </div>
        </section>

        {/* Statistiques */}
        <section className="grid grid-cols-3 gap-3 px-5 pt-6">
          <Stat value="127" label="Livres" />
          <Stat value="34" label="Lus" />
          <Stat value="12" label="À lire" />
        </section>

        {/* Collection */}
        <section className="px-5 pb-28 pt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">
              Ma collection
            </h2>

            <Link
  href="/collection"
  className="text-xs font-semibold text-white/50 transition hover:text-white"
>
  Voir tout
</Link>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {books.map((book) => (
              <BookCard
                key={book.title}
                title={book.title}
                author={book.author}
                color={book.color}
              />
            ))}
          </div>
        </section>


      </div>
    </main>
  );
}

function Stat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.06] p-4">
      <div className="text-xl font-black">
        {value}
      </div>

      <div className="mt-1 text-[11px] text-white/40">
        {label}
      </div>
    </div>
  );
}

function BookCard({
  title,
  author,
  color,
}: {
  title: string;
  author: string;
  color: string;
}) {
  return (
    <div>
      <div
        className={`flex aspect-[2/3] items-end rounded-xl bg-gradient-to-br ${color} p-3 shadow-lg`}
      >
        <div>
          <div className="text-sm font-black leading-tight">
            {title}
          </div>

          <div className="mt-1 text-[9px] text-white/70">
            {author}
          </div>
        </div>
      </div>

      <div className="mt-2 truncate text-[11px] text-white/60">
        {title}
      </div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active = false,
}: {
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`flex flex-col items-center gap-1 text-[10px] ${
        active ? "text-white" : "text-white/35"
      }`}
    >
      <span className="text-xl">
        {icon}
      </span>

      <span>
        {label}
      </span>
    </button>
  );
}