import Link from "next/link";

const appUrl = "https://www.vitaepro.com.au/app.html";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "#how-it-works", label: "How it works" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
];

export default function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[#f7f5ef]/92 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-bold tracking-tight text-slate-950">
          VitaePro
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-slate-950">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <Link
            href={appUrl}
            className="rounded-md bg-slate-950 px-4 py-2 font-semibold text-white transition hover:bg-slate-800"
          >
            Open app
          </Link>
        </div>
      </div>
    </header>
  );
}


