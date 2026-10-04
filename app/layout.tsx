import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavigationShell from "./components/NavigationShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Biblidex — Le Pokédex de tous les livres",
  description: "Collectionne, organise et découvre tous tes livres.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="biblidex-app min-h-full bg-[#090B18] font-sans text-white">
        {children}
        <NavigationShell />
      </body>
    </html>
  );
}
