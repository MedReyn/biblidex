"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/",
    label: "Accueil",
  },
  {
    href: "/collection",
    label: "Collection",
  },
  {
    href: "/search",
    label: "Recherche",
  },
  {
    href: "/profile",
    label: "Profil",
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      {/* =====================================================
          HEADER GLOBAL
          ===================================================== */}

      <header className="sticky top-0 z-50 w-full border-b border-[#31095A]/10 bg-[#FFF9F2]/95 shadow-[0_2px_12px_rgba(49,9,90,0.05)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center px-3 sm:h-16 sm:px-5 md:h-20 md:px-6">

          {/* MARQUE + LOGO */}
          <div className="flex w-full items-center justify-between md:w-auto">
            <Link
              href="/"
              className="flex min-w-0 items-center transition-opacity hover:opacity-90"
            >
              <div className="min-w-0">
                <div className="text-xl font-extrabold leading-none tracking-tight text-[#31095A] sm:text-2xl">
                  Biblidex.
                </div>

                <div className="mt-1 text-[9px] font-medium leading-none text-[#756982] sm:text-[10px]">
                  Le Pokédex de tous les livres
                </div>
              </div>
            </Link>

            {/* LOGO MOBILE */}
            <Link
              href="/"
              className="ml-4 flex shrink-0 items-center md:hidden"
            >
              <Image
                src="/logo/biblidex-owl.png"
                alt="Biblidex"
                width={56}
                height={56}
                priority
                className="h-10 w-10 object-contain sm:h-11 sm:w-11"
              />
            </Link>
          </div>

          {/* =================================================
              DESKTOP NAVIGATION
              ================================================= */}

          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {items.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition-all lg:px-4 lg:py-2.5 ${
                    active
                      ? "bg-[#31095A] text-white shadow-sm"
                      : "text-[#31095A]/60 hover:bg-[#31095A]/5 hover:text-[#31095A]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* AJOUTER */}
            <Link
              href="/add"
              className="ml-1 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFAA5F] via-[#F837E2] to-[#5A0FA8] px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg lg:ml-2 lg:px-5 lg:py-2.5"
            >
              <span className="text-lg leading-none">+</span>
              <span>Ajouter</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* =====================================================
          MOBILE BOTTOM NAVIGATION
          Toujours #FECF4C
          ===================================================== */}

      <nav className="fixed inset-x-0 bottom-0 z-[100] w-full border-t border-[#31095A]/15 bg-[#FECF4C] shadow-[0_-6px_24px_rgba(49,9,90,0.15)] md:hidden">
        <div
          className="mx-auto flex h-[68px] w-full max-w-lg items-center justify-between px-1.5 sm:h-[72px] sm:px-2"
          style={{
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {/* ACCUEIL */}
          <MobileNavItem
            href="/"
            label="Accueil"
            active={pathname === "/"}
            icon={<HomeIcon />}
          />

          {/* COLLECTION */}
          <MobileNavItem
            href="/collection"
            label="Collection"
            active={pathname.startsWith("/collection")}
            icon={<CollectionIcon />}
          />

          {/* =================================================
              BOUTON CENTRAL — HIBOU
              Cercle blanc + anneau blanc
              ================================================= */}

          <Link
            href="/add"
            aria-label="Ajouter un livre"
            className="flex min-w-[58px] flex-col items-center justify-center"
          >
            <div className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_6px_18px_rgba(49,9,90,0.18)] ring-4 ring-white transition-transform duration-150 hover:scale-105 active:scale-95 sm:h-16 sm:w-16">
              <Image
                src="/logo/biblidex-owl.png"
                alt=""
                width={48}
                height={48}
                className="h-11 w-11 object-contain sm:h-12 sm:w-12"
              />
            </div>

            <span className="mt-1 text-[9px] font-bold leading-none text-[#31095A] sm:text-[10px]">
              Ajouter
            </span>
          </Link>

          {/* RECHERCHE */}
          <MobileNavItem
            href="/search"
            label="Recherche"
            active={pathname.startsWith("/search")}
            icon={<SearchIcon />}
          />

          {/* PROFIL */}
          <MobileNavItem
            href="/profile"
            label="Profil"
            active={pathname.startsWith("/profile")}
            icon={<ProfileIcon />}
          />
        </div>
      </nav>
    </>
  );
}

/* =========================================================
   MOBILE NAV ITEM
   ========================================================= */

function MobileNavItem({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-0.5 py-1 transition-all ${
        active
          ? "text-[#31095A]"
          : "text-[#31095A]/60 hover:text-[#31095A]"
      }`}
    >
      <span
        className={`shrink-0 transition-transform ${
          active ? "scale-105" : ""
        }`}
      >
        {icon}
      </span>

      <span
        className={`max-w-full truncate text-[9px] leading-none sm:text-[10px] ${
          active ? "font-bold" : "font-semibold"
        }`}
      >
        {label}
      </span>

      {active && (
        <span className="h-1 w-1 shrink-0 rounded-full bg-[#F837E2]" />
      )}
    </Link>
  );
}

/* =========================================================
   ICONS
   ========================================================= */

function HomeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9 21v-6h6v6" />
    </svg>
  );
}

function CollectionIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4h5v16H4z" />
      <path d="M10 4h5v16h-5z" />
      <path d="M16 4h4v16h-4z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c.8-4 3.4-6 8-6s7.2 2 8 6" />
    </svg>
  );
}