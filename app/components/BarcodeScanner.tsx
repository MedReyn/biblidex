"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

type BarcodeScannerProps = {
  onDetected: (isbn: string) => void;
  onClose: () => void;
};

export default function BarcodeScanner({
  onDetected,
  onClose,
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const [error, setError] = useState("");

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    let controls: { stop: () => void } | undefined;

    async function startScanner() {
      try {
        setError("");

        if (!videoRef.current) {
          return;
        }

        controls = await reader.decodeFromConstraints(
          {
            video: {
              facingMode: { ideal: "environment" },
            },
            audio: false,
          },
          videoRef.current,
          (result) => {
            if (!result) return;

            const rawValue = result.getText();
            const isbn = rawValue.replace(/[- ]/g, "");

            // Les livres utilisent généralement un code EAN-13
            if (!/^\d{13}$/.test(isbn)) {
              return;
            }

            onDetected(isbn);

            controls?.stop();
          }
        );
      } catch (err) {
        console.error(err);

        setError(
          "Impossible d'accéder à la caméra. Vérifie l'autorisation de ton navigateur."
        );
      }
    }

    startScanner();

    return () => {
  controls?.stop();
};
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* Header */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-5 py-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-pink-400">
            Biblidex
          </p>

          <h2 className="mt-1 text-xl font-black text-white">
            Scanner un livre
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xl text-white backdrop-blur"
          aria-label="Fermer le scanner"
        >
          ×
        </button>
      </div>

      {/* Caméra */}
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        autoPlay
        muted
        playsInline
      />

      {/* Cadre de scan */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative h-48 w-[80%] max-w-sm rounded-3xl border-2 border-white/80">
          <div className="absolute left-4 right-4 top-1/2 h-0.5 -translate-y-1/2 bg-pink-400 shadow-lg shadow-pink-400/50" />
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent px-6 pb-10 pt-24 text-center">
        {error ? (
          <p className="text-sm text-red-300">{error}</p>
        ) : (
          <>
            <p className="text-lg font-bold text-white">
              Place le code-barres dans le cadre
            </p>

            <p className="mt-2 text-sm text-white/50">
              Le numéro ISBN sera détecté automatiquement.
            </p>
          </>
        )}
      </div>
    </div>
  );
}