"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const items = [
  { href: "/", label: "Accueil" },
  { href: "/collection", label: "Collection" },
  { href: "/search", label: "Recherche" },
  { href: "/profile", label: "Profil" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-[#31095A]/10 bg-[#FFF9F2]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <Link href="/" aria-label="Biblidex — accueil" className="flex min-w-0 items-center">
            <div className="min-w-0">
              <div className="text-xl font-extrabold leading-none tracking-tight text-[#31095A] sm:text-2xl">
                Biblidex.
              </div>
              <div className="mt-1 hidden text-[10px] font-medium leading-none text-[#756982] sm:block">
                Le Pokédex de tous les livres
              </div>
            </div>
          </Link>

          <Link href="/" aria-label="Accueil" className="md:hidden">
            <Image
              src="/logo/biblidex-owl.png"
              alt=""
              width={44}
              height={44}
              priority
              className="h-10 w-10 object-contain"
            />
          </Link>

          <nav aria-label="Navigation principale" className="hidden items-center gap-1 md:flex">
            {items.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "rounded-[14px] px-4 py-2.5 text-sm font-bold transition",
                    active
                      ? "bg-[#31095A] text-white"
                      : "text-[#31095A]/60 hover:bg-[#31095A]/5 hover:text-[#31095A]",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/add"
              className="ml-2 inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-[#FECF4C] px-5 py-2.5 text-sm font-extrabold text-[#31095A] shadow-sm transition hover:brightness-[0.98] active:scale-[0.98]"
            >
              <span aria-hidden="true" className="text-lg leading-none">+</span>
              Ajouter
            </Link>
          </nav>
        </div>
      </header>

      <nav
        aria-label="Navigation mobile"
        className="fixed inset-x-0 bottom-0 z-[100] border-t border-[#31095A]/15 bg-[#FECF4C] shadow-[0_-6px_24px_rgba(49,9,90,0.15)] md:hidden"
      >
        <div
          className="mx-auto flex h-[68px] w-full max-w-lg items-center justify-between px-1.5"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <MobileNavItem href="/" label="Accueil" active={pathname === "/"} icon={<HomeIcon />} />
          <MobileNavItem href="/collection" label="Collection" active={pathname.startsWith("/collection")} icon={<CollectionIcon />} />

          <Link
            href="/add"
            aria-label="Ajouter un livre"
            className="flex min-w-[58px] flex-col items-center justify-center"
          >
            <div className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_6px_18px_rgba(49,9,90,0.18)] ring-4 ring-white transition-transform active:scale-95">
              <Image src="/logo/biblidex-owl.png" alt="" width={48} height={48} className="h-11 w-11 object-contain" />
            </div>
            <span className="mt-1 text-[10px] font-extrabold leading-none text-[#31095A]">Ajouter</span>
          </Link>

          <MobileNavItem href="/search" label="Recherche" active={pathname.startsWith("/search")} icon={<SearchIcon />} />
          <MobileNavItem href="/profile" label="Profil" active={pathname.startsWith("/profile")} icon={<ProfileIcon />} />
        </div>
      </nav>
    </>
  );
}

function MobileNavItem({ href, label, icon, active }: { href: string; label: string; icon: ReactNode; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-0.5 py-1 text-[#31095A]/60 transition",
        active ? "text-[#31095A]" : "hover:text-[#31095A]",
      ].join(" ")}
    >
      <span className={active ? "scale-105" : ""}>{icon}</span>
      <span className={["max-w-full truncate text-[10px] leading-none", active ? "font-extrabold" : "font-semibold"].join(" ")}>
        {label}
      </span>
      <span className={["h-1 w-1 rounded-full bg-[#F837E2] transition-opacity", active ? "opacity-100" : "opacity-0"].join(" ")} />
    </Link>
  );
}

function HomeIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9 21v-6h6v6" /></svg>;
}
function CollectionIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h5v16H4z" /><path d="M10 4h5v16h-5z" /><path d="M16 4h4v16h-4z" /></svg>;
}
function SearchIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
}
function ProfileIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c.8-4 3.4-6 8-6s7.2 2 8 6" /></svg>;
}
