"use client";

import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";

export default function NavigationShell() {
  const pathname = usePathname();
  if (pathname === "/auth" || pathname.startsWith("/auth/")) return null;
  return <BottomNav />;
}
