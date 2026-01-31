import Link from "next/link";
import { featureSections } from "../data/features";
import { posts } from "../data/posts";

export default function Home() {
  const featuredPosts = posts.slice(0, 3);

  return (
    <div className="space-y-24 pb-16 pt-12">
      <section className="section-shell flex flex-col gap-10 text-center sm:text-left">
        <div className="inline-flex items-center gap-3 self-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm sm:self-start">
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">New</span>
          Outcome-first hiring with User, Crowd, and AI modes
        </div>
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
            Ship shortlists faster with outcome-based hiring.
          </h1>
          <p className="max-w-2xl text-lg text-slate-600">
            Standardize scorecards, route tasks to the right people (or AI), and keep billing simple with Stripe. Built to export statically so you can host anywhere, including VentraIP.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/checkout"
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Start free →
            </Link>
            <Link
              href="/how-it-works"
              className="text-sm font-semibold text-slate-800 underline-offset-4 hover:underline"
            >
              See how it works
            </Link>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {["User", "Crowd", "AI"].map((mode) => (
            <div key={mode} className="card p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {mode} mode
              </p>
              <p className="mt-3 text-base text-slate-700">
                {mode === "User"
                  ? "Your team drives the workflow with structured scorecards and reviewer assignments."
                  : mode === "Crowd"
                    ? "Send tasks to vetted contributors with guardrails and consensus checks."
                    : "Automate repetitive reviews with transparent prompts and human approval gates."}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-shell space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">Why teams ship faster</h2>
          <Link href="/features" className="text-sm font-medium text-slate-700 hover:text-slate-900">
            All features →
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {featureSections.slice(0, 3).map((section) => (
            <div key={section.title} className="card p-6">
              <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{section.description}</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {section.bullets.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="section-shell space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900">Latest from the blog</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {featuredPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="card flex flex-col p-5 transition hover:-translate-y-1 hover:shadow-md">
              <p className="text-xs uppercase tracking-wide text-slate-500">{post.date}</p>
              <h3 className="mt-3 text-lg font-semibold text-slate-900">{post.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{post.summary}</p>
              <span className="mt-4 text-sm font-semibold text-slate-800">Read more →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-shell card flex flex-col gap-4 p-8 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Get started</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">Ready to launch?</h3>
          <p className="text-sm text-slate-600">Start with Stripe checkout and upgrade or cancel anytime in the Stripe portal.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/checkout"
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Go to checkout
          </Link>
          <Link
            href="/pricing"
            className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
          >
            View pricing
          </Link>
        </div>
      </section>
    </div>
  );
}
