import Link from "next/link";

const footerLinks = [
  { href: "/features", label: "Features" },
  { href: "/security", label: "Security" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
];

export default function Footer() {
  return (
    <footer className="border-t border-black/10 bg-[#f7f5ef]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-bold tracking-tight text-slate-950">VitaePro</p>
          <p className="text-sm text-slate-600">Better cover letters and selection criteria, free for a limited time.</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-600">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-slate-950">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="border-t border-black/10 px-6 py-4 text-center text-xs font-medium text-slate-500">
        Powered by:{" "}
        <a
          href="https://www.clickecommerce.com.au"
          target="_blank"
          rel="noreferrer"
          className="font-bold text-slate-700 underline-offset-4 transition hover:text-slate-950 hover:underline"
        >
          Click eCommerce
        </a>
      </div>
    </footer>
  );
}

