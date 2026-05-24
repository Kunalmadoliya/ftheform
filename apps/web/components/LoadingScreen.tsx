"use client";

import { useEffect, useState } from "react";
import { PixelLogo } from "./PixelLogo";

export function LoadingScreen({
  label = "Loading save file",
}: {
  label?: string;
}) {
  const [pct, setPct] = useState(8);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const t = setInterval(() => {
      setPct((p) => (p < 92 ? p + Math.random() * 14 : p));
    }, 180);

    const d = setInterval(() => {
      setDots((x) => (x.length >= 3 ? "" : x + "."));
    }, 300);

    return () => {
      clearInterval(t);
      clearInterval(d);
    };
  }, []);

  return (
    <div className="min-h-screen grid place-items-center bg-quest-ink text-quest-cream crt scanlines-fixed">
      <div className="w-full max-w-md px-8 text-center">
        <div className="flex justify-center mb-6 animate-float">
          <PixelLogo size={56} />
        </div>

        <div className="font-pixel text-3xl uppercase tracking-widest mb-2">
          ftheform
        </div>

        <div className="font-pixel text-[10px] uppercase tracking-[0.3em] text-quest-cream/50 mb-8">
          insert coin · press start
        </div>

        <div className="h-3 border-2 border-quest-cream/30 bg-black/40 rounded-sm overflow-hidden">
          <div
            className="h-full bg-primary transition-[width] duration-200"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>

        <div className="mt-4 font-pixel text-xs uppercase tracking-widest text-quest-cream/60">
          {label}
          {dots}
        </div>
      </div>
    </div>
  );
}