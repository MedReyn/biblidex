"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/",
    label: "Accueil",
    icon: "⌂",
  },
  {
    href: "/collection",
    label: "Collection",
    icon: "▣",
  },
  {
    href: "/add",
    label: "Ajouter",
    icon: "+",
    primary: true,
  },
  {
    href: "/search",
    label: "Recherche",
    icon: "⌕",
  },
  {
    href: "/profile",
    label: "Profil",
    icon: "●",
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#080B18]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-2xl items-center justify-around px-3">

        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          if (item.primary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex -translate-y-4 flex-col items-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-orange-400 via-pink-500 to-violet-500 text-3xl font-light text-white shadow-xl shadow-pink-500/20">
                  {item.icon}
                </div>

                <span className="mt-1 text-[10px] font-semibold text-white/60">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-[60px] flex-col items-center gap-1 transition ${
                active
                  ? "text-white"
                  : "text-white/35 hover:text-white/70"
              }`}
            >
              <span className="text-2xl">
                {item.icon}
              </span>

              <span className="text-[10px] font-semibold">
                {item.label}
              </span>
            </Link>
          );
        })}

      </div>
    </nav>
  );
}