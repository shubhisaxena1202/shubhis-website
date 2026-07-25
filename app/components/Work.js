import { experience, projects, links } from "../lib/data";

const tagColors = [
  "bg-violet-50 text-violet-700",
  "bg-teal-50 text-teal-700",
  "bg-amber-50 text-amber-700",
  "bg-rose-50 text-rose-700",
];

export default function Work() {
  return (
    <section id="work" className="mx-auto max-w-3xl px-6 py-16">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-600">
        Work
      </h2>

      <div className="mt-6 space-y-6">
        {experience.map((job) => (
          <div
            key={job.role + job.org}
            className="rounded-xl border border-zinc-100 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <h3 className="text-base font-semibold text-zinc-950">
                {job.role} · {job.org}
              </h3>
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
                {job.period}
              </span>
            </div>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-zinc-600">
              {job.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h3 className="mt-12 mb-4 text-sm font-semibold uppercase tracking-wide text-amber-600">
        Featured project
      </h3>
      <div className="space-y-6">
        {projects.map((p) => (
          <a
            key={p.title}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl border border-zinc-100 p-5 transition-colors hover:border-violet-200 hover:bg-violet-50/30"
          >
            <h4 className="text-base font-semibold text-zinc-950">
              {p.title}
            </h4>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{p.blurb}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.tags.map((t, i) => (
                <span
                  key={t}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    tagColors[i % tagColors.length]
                  }`}
                >
                  {t}
                </span>
              ))}
            </div>
          </a>
        ))}
      </div>

      <a
        href={links.github}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-block text-sm font-medium text-violet-600 hover:underline"
      >
        See more on GitHub →
      </a>
    </section>
  );
}
