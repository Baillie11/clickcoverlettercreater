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

      <main className="bg-slate-50 pb-16">
        <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 pt-16 text-center md:pt-20 md:text-left">
          <div className="inline-flex items-center gap-3 self-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm md:self-start">
            Human-first cover letters, anywhere
          </div>
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
              Authentic cover letters, zero AI fluff.
            </h1>
            <p className="max-w-2xl text-lg text-slate-700">
              VitaePro blends your own writing, a crowd-sourced response library, and optional AI assist to craft tailored cover letters and selection criteria responses that sound human and win job application shortlists.
            </p>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <Link
                href="/pricing"
                className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                View pricing
              </Link>
              <a
                href="#early-access"
                className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-white"
              >
                Get early access
              </a>
            </div>
          </div>

          <div className="card grid gap-4 border-slate-200 p-6 md:grid-cols-5 md:items-center">
            <p className="text-sm font-semibold text-slate-700 md:col-span-2">Trusted by job seekers and employment agencies</p>
            <div className="col-span-3 grid grid-cols-3 gap-4 text-sm text-slate-500 md:justify-items-center">
              <span className="rounded bg-slate-100 px-3 py-2 text-center">Agency One</span>
              <span className="rounded bg-slate-100 px-3 py-2 text-center">Career Coaches Intl</span>
              <span className="rounded bg-slate-100 px-3 py-2 text-center">Pathways</span>
            </div>
          </div>

          <div className="card border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Why VitaePro</h2>
            <p className="mt-2 text-sm text-slate-700">
              Built for hiring processes where selection criteria matters. Keep authenticity, align tone, and move faster whether you’re a job seeker or an employment agency with multiple seats.
            </p>
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-6xl px-6">
          <div className="mb-8 flex flex-col gap-2 text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">How it works</p>
            <h2 className="text-3xl font-semibold text-slate-900">Human, Crowd, AI — in that order</h2>
            <p className="text-sm text-slate-700">Human-first writing with optional AI assist. Crowd examples keep outputs grounded.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {howCards.map((card) => (
              <div key={card.title} className="card h-full border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-2 text-sm text-slate-700">{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-16 grid max-w-6xl gap-6 px-6 md:grid-cols-2">
          {audiences.map((audience) => (
            <div key={audience.title} className="card border-slate-200 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{audience.title}</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">Built for {audience.title.toLowerCase()}</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {audience.bullets.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="mx-auto mt-16 max-w-6xl px-6">
          <div className="mb-6 flex flex-col gap-2 text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">What you get</p>
            <h2 className="text-3xl font-semibold text-slate-900">Tools for authentic job applications</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div key={feature} className="card h-full border-slate-200 p-5">
                <h3 className="text-base font-semibold text-slate-900">{feature}</h3>
                <p className="mt-2 text-sm text-slate-700">Covers cover letters, selection criteria, and agency workflows.</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-6xl px-6">
          <div className="mb-6 flex flex-col gap-2 text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Social proof</p>
            <h2 className="text-3xl font-semibold text-slate-900">Real voices, no fluff</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="card h-full border-slate-200 p-6">
                <p className="text-sm text-slate-700">“{t.quote}”</p>
                <p className="mt-4 text-sm font-semibold text-slate-900">{t.name}</p>
                <p className="text-xs text-slate-600">{t.role}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-6xl px-6" id="early-access">
          <div className="card border-slate-200 p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Early access</p>
                <h2 className="text-2xl font-semibold text-slate-900">Be first when beta slots open</h2>
                <p className="text-sm text-slate-700">We’ll email you when beta slots open. Great for individuals and agencies wanting authentic cover letters.</p>
              </div>
              <div className="w-full md:w-[360px]">
                <EmailCaptureForm />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-6xl px-6">
          <div className="mb-6 flex flex-col gap-2 text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">FAQ</p>
            <h2 className="text-3xl font-semibold text-slate-900">Questions about authenticity and billing</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {faqs.map((item) => (
              <div key={item.q} className="card border-slate-200 p-5">
                <h3 className="text-base font-semibold text-slate-900">{item.q}</h3>
                <p className="mt-2 text-sm text-slate-700">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-6xl px-6">
          <div className="card flex flex-col gap-4 border-slate-200 p-8 text-center md:flex-row md:items-center md:justify-between md:text-left">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Ready to start</p>
              <h2 className="text-2xl font-semibold text-slate-900">Launch VitaePro and keep it human</h2>
              <p className="text-sm text-slate-700">Create cover letters that sound like you, not a bot. Great for job seekers and agencies.</p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <Link
                href="https://www.vitaepro.com.au/app.html"
                rel="noreferrer"
                target="_blank"
                className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Launch App
              </Link>
              <Link
                href="/pricing"
                className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-white"
              >
                View pricing
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-semibold text-slate-900">VitaePro</p>
          <div className="flex flex-wrap gap-4 text-sm text-slate-700">
            <Link href="/privacy" className="transition hover:text-slate-900">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-slate-900">
              Terms
            </Link>
            <Link href="/refunds" className="transition hover:text-slate-900">
              Refunds
            </Link>
            <Link href="/contact" className="transition hover:text-slate-900">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
