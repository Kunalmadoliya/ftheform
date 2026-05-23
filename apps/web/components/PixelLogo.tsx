"use client"

// Pixel-art scroll/script logo for ftheform.
const I = "var(--quest-ink)";        // outline
const P = "var(--quest-cream)";       // parchment
const S = "oklch(0.78 0.04 80)";      // shadow on parchment
const R = "var(--quest-amber)";       // ribbon / roll ends
const L = "var(--primary)";           // ink line on parchment
const _ = "transparent";

// 12x10 unrolled scroll with two ink lines
const GRID: string[][] = [
  [_, _, I, I, I, I, I, I, I, I, _, _],
  [_, I, R, R, R, R, R, R, R, R, I, _],
  [I, R, R, I, R, R, R, R, I, R, R, I],
  [I, R, I, P, P, P, P, P, P, I, R, I],
  [I, R, I, P, L, L, L, L, P, I, R, I],
  [I, R, I, P, P, P, P, P, P, I, R, I],
  [I, R, I, P, L, L, L, P, P, I, R, I],
  [I, R, I, P, P, P, P, P, P, I, R, I],
  [I, R, R, I, S, S, S, S, I, R, R, I],
  [_, I, I, I, I, I, I, I, I, I, I, _],
];

export function PixelLogo({ size = 28 }: { size?: number }) {
  const px = Math.max(2, Math.floor(size / 10));
  return (
    <div
      aria-hidden
      className="shrink-0 drop-shadow-[2px_2px_0_rgba(0,0,0,0.25)]"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(12, ${px}px)`,
        gridTemplateRows: `repeat(10, ${px}px)`,
        imageRendering: "pixelated",
      }}
    >
      {GRID.flat().map((c, i) => (
        <div key={i} style={{ background: c }} />
      ))}
    </div>
  );
}

export function BrandMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <PixelLogo size={size} />
      <span className="font-pixel text-2xl tracking-tight">FTHEFORM</span>
    </div>
  );
}
