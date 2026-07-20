"use client";

import { useEffect, useRef, useState } from "react";
import type { Deck } from "@/lib/types";
import Slide from "./Slide";

const STAGE_W = 1280;
const STAGE_H = 720;

export default function SlideViewer({ deck }: { deck: Deck }) {
  const [index, setIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const total = deck.slides.length;

  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const s = Math.min(clientWidth / STAGE_W, clientHeight / STAGE_H);
      setScale(s);
    }
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setIndex((i) => Math.min(i + 1, total - 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Escape") {
        document.exitFullscreen?.();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  function goFullscreen() {
    containerRef.current?.requestFullscreen?.();
  }

  function printDeck() {
    window.print();
  }

  return (
    <div className="flex flex-col h-full">
      <div className="no-print flex items-center justify-between px-6 py-3 border-b border-grey-3 bg-white">
        <div className="text-sm text-grey-7">
          Slide {index + 1} of {total}
        </div>
        <div className="flex gap-2">
          <button
            onClick={goFullscreen}
            className="text-sm font-semibold text-off-black border border-grey-4 rounded-md px-4 py-2 hover:bg-grey-1"
          >
            Present (fullscreen)
          </button>
          <button
            onClick={printDeck}
            className="text-sm font-semibold text-white bg-hot-pink rounded-md px-4 py-2"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Live single-slide view */}
      <div
        ref={containerRef}
        className="no-print flex-1 bg-grey-8 flex items-center justify-center relative overflow-hidden"
        onClick={(e) => {
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          if (clickX > rect.width / 2) setIndex((i) => Math.min(i + 1, total - 1));
          else setIndex((i) => Math.max(i - 1, 0));
        }}
      >
        <div style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}>
          <Slide slide={deck.slides[index]} />
        </div>
      </div>

      {/* Print-only: every slide stacked, full size, one per page */}
      <div className="print-only hidden">
        {deck.slides.map((s, i) => (
          <div key={i} style={{ display: "block" }}>
            <Slide slide={s} />
          </div>
        ))}
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
