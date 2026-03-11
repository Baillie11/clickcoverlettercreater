import Script from "next/script";
import type { Metadata } from "next";
import TrackingLink from "../components/TrackingLink";

const siteUrl = "https://www.vitaepro.com.au";
const appUrl = "https://www.vitaepro.com.au/app.html";

/* ──────────────────────────── SEO metadata ──────────────────────────── */

export const metadata: Metadata = {
  title: "VitaePro | Authentic Cover Letters Without AI Fluff",
  description:
    "Create authentic cover letters faster with VitaePro. Build reusable responses, learn from real examples, and refine with optional AI assist.",
  keywords: [
    "cover letter",
    "selection criteria",
    "job application",
    "employment agency",
    "career coach",
    "human writing",
    "AI assist",
    "reusable responses",
    "cover letter creator",
    "authentic applications",
  ],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "VitaePro | Authentic Cover Letters Without AI Fluff",
    description:
      "Create authentic cover letters faster with VitaePro. Build reusable responses, learn from real examples, and refine with optional AI assist.",
    url: siteUrl,
    siteName: "VitaePro",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VitaePro | Authentic Cover Letters Without AI Fluff",
    description:
      "Human-first cover letter software with crowd examples and optional AI assist for job seekers and agencies.",
  },
};

/* ────────────────────────── Structured data ──────────────────────────── */

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "VitaePro",
      operatingSystem: "Web",
      applicationCategory: "BusinessApplication",
      description:
        "Cover letter and selection criteria software for job seekers and employment agencies.",
      offers: {
        "@type": "Offer",
        availability: "https://schema.org/OnlineOnly",
      },
      url: siteUrl,
    },
    {
      "@type": "Organization",
      name: "VitaePro",
      url: siteUrl,
      sameAs: [siteUrl],
    },
  ],
};

/* ────────────────────────────── Data ─────────────────────────────────── */

const problemCards = [
  {
    title: "Generic AI Applications",
    body: "Recruiters are seeing hundreds of identical AI generated cover letters that say nothing real.",
  },
  {
    title: "Starting From Scratch",
    body: "Most job seekers rewrite the same experience again and again for every application.",
  },
  {
    title: "No Clear Structure",
    body: "Candidates struggle to explain their experience clearly against selection criteria.",
  },
];

const howCards = [
  {
    title: "Human-first",
    body: "Start with your own writing. Keep voice, tone and selection criteria aligned to the role.",
  },
  {
    title: "Crowd Library",
    body: "Adapt real examples from other users and agencies to see what works.",
  },
  {
    title: "AI Assist (optional)",
    body: "Use AI sparingly to refine structure and tone without losing authenticity.",
  },
];

const features = [
  {
    title: "Reusable snippet library",
    body: "Store and reuse your best responses.",
  },
  {
    title: "Role and criteria targeting",
    body: "Align cover letters clearly with role requirements.",
  },
  {
    title: "Tone and voice control",
    body: "Maintain your authentic voice while refining clarity.",
  },
  {
    title: "Export to PDF and Docx",
    body: "Generate clean professional documents instantly.",
  },
  {
    title: "Agency workflows",
    body: "Manage candidates and shared response libraries.",
  },
];

const testimonials = [
  {
    role: "Career Coach",
    quote:
      "VitaePro keeps applications authentic while saving huge amounts of time.",
  },
  {
    role: "Employment Consultant",
    quote:
      "Crowd examples help candidates understand what good applications look like.",
  },
  {
    role: "Job Seeker",
    quote: "I landed interviews without sounding like a bot.",
  },
];

/* ────────────────────────────── Page ─────────────────────────────────── */

export default function HomePage() {
  return (
    <>
      <Script
        id="jsonld-software"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="pb-20">
        {/* ─── 1. HERO ─────────────────────────────────────────────── */}
        <section
          aria-label="Hero"
          className="section-shell mx-auto flex max-w-6xl flex-col gap-10 px-6 pt-16 text-center md:pt-20 md:text-left"
        >
          <div className="flex flex-col gap-10 md:flex-row md:items-center md:gap-16">
            <div className="flex-1 space-y-6">
              <img
                src="/logo.png"
                alt="VitaePro — authentic cover letter creator"
                width={240}
                height={68}
                className="self-center md:self-start"
              />
              <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
                Authentic cover letters. Zero AI&nbsp;fluff.
              </h1>
              <p className="max-w-2xl text-lg text-slate-100/90">
                VitaePro blends your own writing, a crowd-sourced response library, and optional AI assist to craft tailored cover letters that sound human and win job application shortlists.
              </p>
              <p className="text-sm font-medium italic text-slate-100/70">
                Because AI alone isn&apos;t enough.
              </p>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <TrackingLink
                  href={appUrl}
                  event="signup_button_click"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary-gradient rounded-full px-6 py-3 text-sm font-semibold shadow-md transition hover:opacity-95"
                >
                  Get Started
                </TrackingLink>
                <TrackingLink
                  href="/pricing"
                  event="pricing_view"
                  className="btn-secondary-ghost rounded-full px-6 py-3 text-sm font-semibold backdrop-blur transition hover:border-white hover:bg-white/15"
                >
                  View Pricing
                </TrackingLink>
              </div>
              <p className="text-xs text-slate-100/70">
                Trusted by job seekers and employment agencies.
              </p>
            </div>

            {/* Product screenshot */}
            <div className="flex-1">
              <div className="glass-card card overflow-hidden rounded-2xl">
                <img
                  src="/screenshot.png"
                  alt="VitaePro cover letter builder interface"
                  width={600}
                  height={400}
                  className="h-auto w-full"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── 2. PROBLEM ──────────────────────────────────────────── */}
        <section aria-labelledby="problem-title" className="mx-auto mt-24 max-w-6xl px-6">
          <div className="mb-10 flex flex-col gap-2 text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
              The problem
            </p>
            <h2 id="problem-title" className="text-3xl font-semibold text-white">
              Why job applications feel broken
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {problemCards.map((card) => (
              <article key={card.title} className="glass-card card h-full p-6">
                <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                <p className="mt-2 text-sm text-slate-100/90">{card.body}</p>
              </article>
            ))}
          </div>
          <p className="mt-6 text-center text-sm font-semibold text-white/90 md:text-left">
            VitaePro fixes all three.
          </p>
        </section>

        {/* ─── 3. HOW VITAEPRO WORKS ───────────────────────────────── */}
        <section aria-labelledby="how-title" className="mx-auto mt-24 max-w-6xl px-6">
          <div className="mb-10 flex flex-col gap-2 text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
              How it works
            </p>
            <h2 id="how-title" className="text-3xl font-semibold text-white">
              Human, Crowd, AI — in that order
            </h2>
            <p className="text-sm text-slate-100/85">
              Human-first writing with optional AI assist. Start with your own voice, refine with real examples, and optionally use AI to polish the result.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {howCards.map((card) => (
              <article key={card.title} className="glass-card card h-full p-6">
                <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                <p className="mt-2 text-sm text-slate-100/90">{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ─── 4. WHO VITAEPRO IS FOR ──────────────────────────────── */}
        <section aria-labelledby="who-title" className="mx-auto mt-24 max-w-6xl px-6">
          <div className="mb-10 flex flex-col gap-2 text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
              Who it&apos;s for
            </p>
            <h2 id="who-title" className="text-3xl font-semibold text-white">
              Who VitaePro is for
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Job Seekers */}
            <article className="glass-card card flex flex-col p-6">
              <h3 className="text-xl font-semibold text-white">For Job Seekers</h3>
              <p className="mt-2 text-sm text-slate-100/90">
                Stop rewriting cover letters for every job. Save your best responses once and adapt them quickly for each role.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-100/90">
                {[
                  "Create cover letters in minutes",
                  "Reuse your best paragraphs",
                  "Avoid generic AI sounding applications",
                  "Export polished letters instantly",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <TrackingLink
                  href={appUrl}
                  event="signup_button_click"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary-gradient inline-block rounded-full px-5 py-2.5 text-sm font-semibold shadow-md transition hover:opacity-95"
                >
                  Start my first cover letter
                </TrackingLink>
              </div>
            </article>

            {/* Recruiters & Agencies */}
            <article className="glass-card card flex flex-col p-6">
              <h3 className="text-xl font-semibold text-white">For Recruiters &amp; Agencies</h3>
              <p className="mt-2 text-sm text-slate-100/90">
                Help candidates submit clearer, higher-quality applications recruiters actually want to read.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-100/90">
                {[
                  "Guide candidates with structured responses",
                  "Reduce low quality AI generated applications",
                  "Maintain consistency across applications",
                  "Manage multiple candidates efficiently",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <TrackingLink
                  href={appUrl}
                  event="signup_button_click"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary-ghost inline-block rounded-full px-5 py-2.5 text-sm font-semibold backdrop-blur transition hover:border-white hover:bg-white/15"
                >
                  Agency access
                </TrackingLink>
              </div>
            </article>
          </div>
        </section>

        {/* ─── 5. KEY FEATURES ─────────────────────────────────────── */}
        <section aria-labelledby="features-title" className="mx-auto mt-24 max-w-6xl px-6">
          <div className="mb-10 flex flex-col gap-2 text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
              What you get
            </p>
            <h2 id="features-title" className="text-3xl font-semibold text-white">
              Everything you need for authentic job applications
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((f) => (
              <article key={f.title} className="glass-card card h-full p-6">
                <h3 className="text-base font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-100/90">{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ─── 6. SOCIAL PROOF ─────────────────────────────────────── */}
        <section aria-labelledby="proof-title" className="mx-auto mt-24 max-w-6xl px-6">
          <div className="mb-10 flex flex-col gap-2 text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
              Social proof
            </p>
            <h2 id="proof-title" className="text-3xl font-semibold text-white">
              Why people prefer VitaePro
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <blockquote key={t.role} className="glass-card card h-full p-6">
                <p className="text-sm text-slate-100/90">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-4">
                  <p className="text-sm font-semibold text-white">{t.role}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        {/* ─── 7. FINAL CTA ────────────────────────────────────────── */}
        <section aria-label="Call to action" className="mx-auto mt-24 max-w-6xl px-6">
          <div className="glass-card card flex flex-col gap-4 p-8 text-center md:flex-row md:items-center md:justify-between md:text-left">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                Ready to start
              </p>
              <h2 className="text-2xl font-semibold text-white">
                Launch VitaePro and keep it human.
              </h2>
              <p className="text-sm text-slate-100/90">
                Create cover letters that sound like you — not a bot.
              </p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <TrackingLink
                href={appUrl}
                event="launch_app_click"
                target="_blank"
                rel="noreferrer"
                className="btn-primary-gradient rounded-full px-6 py-3 text-sm font-semibold shadow-md transition hover:opacity-95"
              >
                Launch App
              </TrackingLink>
              <TrackingLink
                href="/pricing"
                event="pricing_view"
                className="btn-secondary-ghost rounded-full px-6 py-3 text-sm font-semibold backdrop-blur transition hover:border-white hover:bg-white/15"
              >
                View Pricing
              </TrackingLink>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
