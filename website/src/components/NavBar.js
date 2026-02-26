"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/features", label: "Features" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
];

const loginHref = process.env.NEXT_PUBLIC_APP_URL || "/login";
const checkoutHref = process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL || "/checkout";

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const headerClasses = scrolled
    ? "border-slate-200 bg-white/95 text-slate-900 shadow-sm"
    : "border-transparent bg-transparent text-white";

  const linkClasses = scrolled
    ? "text-slate-700 transition hover:text-slate-900"
    : "text-slate-100 transition hover:text-white";

  const loginClasses = scrolled
    ? "rounded-full border border-slate-200 px-4 py-2 font-medium text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
    : "btn-secondary-ghost rounded-full px-4 py-2 font-medium backdrop-blur transition hover:border-white hover:bg-white/15";

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur transition-colors duration-300 ${headerClasses}`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className={`text-lg font-semibold ${scrolled ? "text-slate-900" : "text-white"}`}>
          VitaePro
        </Link>
        <nav className="hidden items-center gap-6 text-sm sm:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={linkClasses}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <Link href={loginHref} className={loginClasses}>
            Log in
          </Link>
          <Link
            href={checkoutHref}
            className="btn-primary-gradient rounded-full px-4 py-2 font-medium text-white shadow-md transition hover:opacity-95"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
