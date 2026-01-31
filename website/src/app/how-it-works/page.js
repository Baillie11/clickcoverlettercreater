import Link from "next/link";
import { featureSections } from "../../data/features";

export const metadata = {
  title: "How it works | VitaePro",
  description: "Understand the User, Crowd, and AI modes and the workflow from intake to shortlist.",
};

const steps = [
  {
    title: "Intake and outcomes",
    detail: "Define the outcome profile, skills, and evidence required. Assign reviewers and SLAs.",
  },
  {
    title: "Run the mode you need",
    detail: "Pick User, Crowd, or AI mode per step. Add approval gates and quality checks.",
  },
  {
    title: "Score, export, share",
    detail: "Use structured scorecards, export to ATS/CRM, and share shortlists with stakeholders.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="space-y-14 pb-16 pt-12">
      <section className="section-shell space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Workflow
        </p>
        <h1 className="text-4xl font-semibold text-slate-900">How it works</h1>
        <p className="max-w-3xl text-lg text-slate-600">
          Each hiring step can run in User, Crowd, or AI mode. You decide where humans stay in the loop and when to automate. Stripe handles checkout and billing so you can focus on outcomes.
        </p>
        <div className="flex gap-3">
          <Link href="/pricing" className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
            View pricing
          </Link>
          <Link href="/checkout" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50">
            Go to checkout
          </Link>
        </div>
      </section>

      <section className="section-shell grid gap-6 md:grid-cols-3">
        {featureSections.slice(0, 3).map((section) => (
          <div key={section.title} className="card p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mode</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">{section.title}</h2>
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
      </section>

      <section className="section-shell grid gap-6 md:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step.title} className="card p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step {index + 1}</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">{step.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{step.detail}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
