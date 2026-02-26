import Link from "next/link";
import Script from "next/script";
import type { Metadata } from "next";
import EmailCaptureForm from "../components/EmailCaptureForm";

const siteUrl = "https://example.com";

export const metadata: Metadata = {
  title: "VitaePro | Authentic cover letters without AI fluff",
  description:
    "VitaePro helps job seekers and employment agencies craft tailored cover letters and selection criteria responses with human writing, crowd examples, and optional AI assist.",
  keywords: [
    "cover letter",
    "selection criteria",
    "job application",
    "employment agency",
    "career coach",
    "global hiring",
    "human writing",
    "AI assist",
  ],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "VitaePro | Authentic cover letters without AI fluff",
    description:
      "Human-first cover letter software with crowd examples and optional AI assist for job seekers and agencies.",
    url: siteUrl,
    siteName: "VitaePro",
  },
  twitter: {
    card: "summary_large_image",
    title: "VitaePro | Authentic cover letters without AI fluff",
    description:
      "Cover letter SaaS for job seekers and employment agencies. Human writing, crowd examples, optional AI.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "VitaePro",
      operatingSystem: "Web",
      applicationCategory: "BusinessApplication",
      description:
        "Cover letter and selection criteria software for job seekers and employment agencies worldwide.",
      offers: {
        "@type": "Offer",
        availability: "https://schema.org/PreOrder",
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

const howCards = [
  {
    title: "Human-first",
    body:
      "Start with your own writing. Keep voice, tone, and selection criteria tight to the role.",
  },
  {
    title: "Crowd library",
    body:
      "Adapt real examples from other users and agencies. Learn what gets interviews, fast.",
  },
  {
    title: "AI assist (optional)",
    body:
      "Use AI sparingly to draft or tidy, then edit in your own words. No AI fluff.",
  },
];

const audiences = [
  {
    title: "For individuals",
    bullets: [
      "Target selection criteria with reusable snippets",
      "Control tone to match the role and employer",
      "Export polished cover letters to PDF or Docx",
    ],
  },
  {
    title: "For agencies & coaches",
    bullets: [
      "Seat and client management in one place",
      "Shared libraries across consultants",
      "Approval, versioning, and audit trails",
    ],
  },
];

const features = [
  "Role and criteria targeting",
  "Tone and voice control",
  "Reusable snippet library",
  "Version history and comparisons",
  "Export to PDF and Docx",
  "Agency seats and client workflows",
];

const testimonials = [
  { name: "Jordan S.", role: "Career coach", quote: "VitaePro keeps drafts authentic while speeding up delivery." },
  { name: "Taylor R.", role: "Employment consultant", quote: "Crowd examples help juniors learn what good looks like." },
  { name: "Alex K.", role: "Job seeker", quote: "I landed interviews without sounding like a bot." },
];

const faqs = [
  { q: "How do you avoid AI fluff?", a: "You start with human writing, then optionally layer AI for minor edits. Crowd examples anchor the tone." },
  { q: "Is my data private?", a: "Yes. Drafts stay in your account. Shared examples are opt-in and scrubbed." },
  { q: "Do you support agencies?", a: "Yes. Seats, client folders, and shared libraries are built in for employment agencies and career coaches worldwide." },
  { q: "How is pricing handled?", a: "Straightforward plans on the pricing page, paid via Stripe." },
  { q: "Can I cancel anytime?", a: "Yes. Manage billing and cancellations through the Stripe portal." },
  { q: "Do I have to use AI?", a: "No. AI is optional and always human-edited. Human and crowd modes work alone." },
];

export default function HomePage() {
  return (
    <>
      <Script
        id="jsonld-software"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="pb-16">
        <section className="section-shell mx-auto flex max-w-6xl flex-col gap-10 px-6 pt-16 text-center md:pt-20 md:text-left">
          <div className="glass-pill inline-flex items-center gap-3 self-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide md:self-start">
            Human-first cover letters, anywhere
          </div>
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
              Authentic cover letters, zero AI fluff.
            </h1>
            <p className="max-w-2xl text-lg text-slate-100/90">
              VitaePro blends your own writing, a crowd-sourced response library, and optional AI assist to craft tailored cover letters and selection criteria responses that sound human and win job application shortlists.
            </p>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <Link
                href="/pricing"
                className="btn-primary-gradient rounded-full px-6 py-3 text-sm font-semibold shadow-md transition hover:opacity-95"
              >
                View pricing
              </Link>
              <a
                href="#early-access"
                className="btn-secondary-ghost rounded-full px-6 py-3 text-sm font-semibold backdrop-blur transition hover:border-white hover:bg-white/15"
              >
                Get early access
              </a>
            </div>
          </div>

          <div className="glass-card card grid gap-4 p-6 md:grid-cols-5 md:items-center">
            <p className="text-sm font-semibold text-slate-50 md:col-span-2">Trusted by job seekers and employment agencies</p>
            <div className="col-span-3 grid grid-cols-3 gap-4 text-sm text-slate-100/80 md:justify-items-center">
              <span className="rounded border border-white/20 bg-white/10 px-3 py-2 text-center">Agency One</span>
              <span className="rounded border border-white/20 bg-white/10 px-3 py-2 text-center">Career Coaches Intl</span>
              <span className="rounded border border-white/20 bg-white/10 px-3 py-2 text-center">Pathways</span>
            </div>
          </div>

          <div className="glass-card card p-6">
            <h2 className="text-lg font-semibold text-white">Why VitaePro</h2>
            <p className="mt-2 text-sm text-slate-100/90">
              Built for hiring processes where selection criteria matters. Keep authenticity, align tone, and move faster whether you’re a job seeker or an employment agency with multiple seats.
            </p>
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-6xl px-6">
          <div className="mb-8 flex flex-col gap-2 text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/80">How it works</p>
            <h2 className="text-3xl font-semibold text-white">Human, Crowd, AI — in that order</h2>
            <p className="text-sm text-slate-100/85">Human-first writing with optional AI assist. Crowd examples keep outputs grounded.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {howCards.map((card) => (
              <div key={card.title} className="glass-card card h-full p-6">
                <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                <p className="mt-2 text-sm text-slate-100/90">{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-16 grid max-w-6xl gap-6 px-6 md:grid-cols-2">
          {audiences.map((audience) => (
            <div key={audience.title} className="glass-card card p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/80">{audience.title}</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Built for {audience.title.toLowerCase()}</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-100/90">
                {audience.bullets.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="mx-auto mt-16 max-w-6xl px-6">
          <div className="mb-6 flex flex-col gap-2 text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/80">What you get</p>
            <h2 className="text-3xl font-semibold text-white">Tools for authentic job applications</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div key={feature} className="glass-card card h-full p-5">
                <h3 className="text-base font-semibold text-white">{feature}</h3>
                <p className="mt-2 text-sm text-slate-100/90">Covers cover letters, selection criteria, and agency workflows.</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-6xl px-6">
          <div className="mb-6 flex flex-col gap-2 text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Social proof</p>
            <h2 className="text-3xl font-semibold text-white">Real voices, no fluff</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="glass-card card h-full p-6">
                <p className="text-sm text-slate-100/90">“{t.quote}”</p>
                <p className="mt-4 text-sm font-semibold text-white">{t.name}</p>
                <p className="text-xs text-slate-100/80">{t.role}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-6xl px-6" id="early-access">
          <div className="glass-card card p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Early access</p>
                <h2 className="text-2xl font-semibold text-white">Be first when beta slots open</h2>
                <p className="text-sm text-slate-100/90">We’ll email you when beta slots open. Great for individuals and agencies wanting authentic cover letters.</p>
              </div>
              <div className="w-full md:w-[360px]">
                <EmailCaptureForm />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-6xl px-6">
          <div className="mb-6 flex flex-col gap-2 text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/80">FAQ</p>
            <h2 className="text-3xl font-semibold text-white">Questions about authenticity and billing</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {faqs.map((item) => (
              <div key={item.q} className="glass-card card p-5">
                <h3 className="text-base font-semibold text-white">{item.q}</h3>
                <p className="mt-2 text-sm text-slate-100/90">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-6xl px-6">
          <div className="glass-card card flex flex-col gap-4 p-8 text-center md:flex-row md:items-center md:justify-between md:text-left">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Ready to start</p>
              <h2 className="text-2xl font-semibold text-white">Launch VitaePro and keep it human</h2>
              <p className="text-sm text-slate-100/90">Create cover letters that sound like you, not a bot. Great for job seekers and agencies.</p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <Link
                href="https://vitaepro.com.au/app.html"
                rel="noreferrer"
                target="_blank"
                className="btn-primary-gradient rounded-full px-6 py-3 text-sm font-semibold shadow-md transition hover:opacity-95"
              >
                Launch App
              </Link>
              <Link
                href="/pricing"
                className="btn-secondary-ghost rounded-full px-6 py-3 text-sm font-semibold backdrop-blur transition hover:border-white hover:bg-white/15"
              >
                View pricing
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/20 bg-white/10 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-semibold text-white">VitaePro</p>
          <div className="flex flex-wrap gap-4 text-sm text-slate-100/80">
            <Link href="/privacy" className="transition hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-white">
              Terms
            </Link>
            <Link href="/refunds" className="transition hover:text-white">
              Refunds
            </Link>
            <Link href="/contact" className="transition hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
