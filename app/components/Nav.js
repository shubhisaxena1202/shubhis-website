const sections = [
  { label: "About", href: "#about" },
  { label: "Work", href: "#work" },
  { label: "Writing", href: "#writing" },
  { label: "Contact", href: "#contact" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <a
          href="#top"
          className="bg-gradient-to-r from-violet-600 to-teal-500 bg-clip-text text-sm font-semibold tracking-tight text-transparent"
        >
          Shubhi Saxena
        </a>
        <ul className="flex items-center gap-6 text-sm text-zinc-600">
          {sections.map((s) => (
            <li key={s.href}>
              <a
                href={s.href}
                className="transition-colors hover:text-violet-600"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
