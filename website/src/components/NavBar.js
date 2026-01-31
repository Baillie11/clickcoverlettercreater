import Link from "next/link";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/features", label: "Features" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
];

export default function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold text-slate-900">
          VitaePro
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-700 sm:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/login"
            className="rounded-full border border-slate-200 px-4 py-2 font-medium text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Log in
          </Link>
          <Link
            href="/checkout"
            className="rounded-full bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-800"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
