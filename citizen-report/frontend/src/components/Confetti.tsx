'use client';

import { useEffect, useState } from 'react';

const COLORS = ['#b3312c', '#c99a3f', '#1d4ed8', '#16a34a', '#f59e0b', '#7c3aed'];

interface Piece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  rotate: number;
  width: number;
  height: number;
}

/** One-shot celebratory burst for success states (e.g. after submitting a report). */
export function Confetti({ count = 70 }: { count?: number }) {
  const [pieces, setPieces] = useState<Piece[] | null>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setPieces(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2.4 + Math.random() * 1.6,
        color: COLORS[i % COLORS.length],
        rotate: Math.random() * 360,
        width: 6 + Math.random() * 5,
        height: 10 + Math.random() * 6,
      })),
    );
  }, [count]);

  if (!pieces) return null;

  return (
    <div className="confetti-container" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            background: p.color,
            width: p.width,
            height: p.height,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
