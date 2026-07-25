import { links } from "../lib/data";

const items = [
  {
    label: "Email",
    value: links.email,
    href: `mailto:${links.email}`,
    accent: "border-l-violet-500",
  },
  {
    label: "LinkedIn",
    value: "in/shubhi-saxena",
    href: links.linkedin,
    accent: "border-l-indigo-500",
  },
  {
    label: "GitHub",
    value: "shubhisaxena1202",
    href: links.github,
    accent: "border-l-teal-500",
  },
  {
    label: "Medium",
    value: "@shubhiS",
    href: links.medium,
    accent: "border-l-amber-500",
  },
];

export default function Contact() {
  return (
    <section id="contact" className="mx-auto max-w-3xl px-6 py-16">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-600">
        Contact
      </h2>
      <p className="mt-4 max-w-xl text-base leading-7 text-zinc-700">
        Open to conversations about product data science roles in consumer
        and platform tech. The fastest way to reach me is email.
      </p>
      <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <a
            key={item.label}
            href={item.href}
            target={item.label === "Email" ? undefined : "_blank"}
            rel={item.label === "Email" ? undefined : "noopener noreferrer"}
            className={`flex items-center justify-between rounded-xl border border-zinc-100 border-l-4 ${item.accent} px-4 py-3 text-sm transition-colors hover:bg-zinc-50`}
          >
            <dt className="font-medium text-zinc-500">{item.label}</dt>
            <dd className="text-zinc-900">{item.value}</dd>
          </a>
        ))}
      </dl>
    </section>
  );
}
