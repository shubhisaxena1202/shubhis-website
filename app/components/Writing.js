import Image from "next/image";
import { articles, links } from "../lib/data";

const cardColors = [
  { panel: "bg-violet-50/60" },
  { panel: "bg-teal-50/60" },
  { panel: "bg-amber-50/60" },
];

export default function Writing() {
  return (
    <section id="writing" className="mx-auto max-w-3xl px-6 py-16">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-violet-500">
        Writing
      </h2>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {articles.map((a, i) => {
          const c = cardColors[i % cardColors.length];
          return (
            <a
              key={a.url}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block overflow-hidden rounded-2xl border-2 border-zinc-900 transition-shadow hover:shadow-lg hover:shadow-zinc-200/70"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
                <Image
                  src={a.image}
                  alt={a.title}
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
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
