import Image from "next/image";
import { links } from "../lib/data";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative mx-auto max-w-3xl overflow-hidden px-6 pb-20 pt-16 sm:pt-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-violet-400 via-fuchsia-300 to-amber-300 opacity-30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-16 h-64 w-64 rounded-full bg-gradient-to-br from-teal-300 to-indigo-300 opacity-30 blur-3xl"
      />

      <div className="flex flex-col-reverse items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-4 inline-block rounded-full bg-violet-50 px-3 py-1 text-sm font-medium text-violet-600">
            Product Data Scientist
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
            Shubhi Saxena
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600">
            A model&apos;s accuracy doesn&apos;t determine whether it gets
            used, trust does. I build analytical systems that people
            actually use to make decisions.
          </p>
        </div>

        <div className="relative shrink-0 h-28 w-28 overflow-hidden rounded-full ring-4 ring-white shadow-lg shadow-violet-100 sm:h-36 sm:w-36">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-violet-400 to-amber-300"
          />
          <Image
            src="/shubhi-photo.jpg"
            alt="Shubhi Saxena"
            fill
            sizes="144px"
            className="object-cover"
            priority
          />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium">
        <a
          href="#contact"
          className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-white shadow-sm shadow-violet-200 transition-opacity hover:opacity-90"
        >
          Get in touch
        </a>
        <a
          href={links.github}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-zinc-200 px-5 py-2.5 text-zinc-700 transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
        >
          GitHub
        </a>
        <a
          href={links.medium}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-zinc-200 px-5 py-2.5 text-zinc-700 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
        >
          Medium
        </a>
      </div>
    </section>
  );
}
