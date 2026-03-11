import Link from "next/link";

const footerLinks = [
  { href: "/security", label: "Security" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/refunds", label: "Refunds" },
  { href: "/faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/20 bg-white/10 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-semibold text-white">VitaePro</p>
<p className="text-sm text-slate-100/80">Authentic cover letters, faster.</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-slate-100/80">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
