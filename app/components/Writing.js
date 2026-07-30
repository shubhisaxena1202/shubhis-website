"use client";

import { useRef } from "react";
import Image from "next/image";
import { articles, links } from "../lib/data";

const cardColors = [
  { panel: "bg-violet-50/60" },
  { panel: "bg-teal-50/60" },
  { panel: "bg-amber-50/60" },
  { panel: "bg-rose-50/60" },
];

function ArrowButton({ direction, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "left" ? "Scroll left" : "Scroll right"}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition-colors hover:border-violet-300 hover:text-violet-600"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        {direction === "left" ? (
          <polyline points="15 18 9 12 15 6" />
        ) : (
          <polyline points="9 18 15 12 9 6" />
        )}
      </svg>
    </button>
  );
}

export default function Writing() {
  const scrollerRef = useRef(null);

  const scrollByCard = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = 280 * dir;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <section id="writing" className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-violet-500">
          Writing
        </h2>
        <div className="flex gap-2">
          <ArrowButton direction="left" onClick={() => scrollByCard(-1)} />
          <ArrowButton direction="right" onClick={() => scrollByCard(1)} />
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="no-scrollbar mt-6 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2"
      >
        {articles.map((a, i) => {
          const c = cardColors[i % cardColors.length];
          return (
            <a
              key={a.url}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block w-64 shrink-0 snap-start overflow-hidden rounded-2xl border-2 border-zinc-900 transition-shadow hover:shadow-lg hover:shadow-zinc-200/70"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
                <Image
                  src={a.image}
                  alt={a.title}
                  fill
                  sizes="256px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className={`p-4 ${c.panel}`}>
                <h3 className="text-sm font-semibold text-zinc-950">
                  {a.title}
                </h3>
                <p className="mt-1 text-xs text-zinc-500">{a.date}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {a.blurb}
                </p>
              </div>
            </a>
          );
        })}
      </div>

      <a
        href={links.medium}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-block text-sm font-medium text-violet-600 hover:underline"
      >
        Read more on Medium →
      </a>
    </section>
  );
}
