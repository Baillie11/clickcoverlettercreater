import { featureSections } from "../../data/features";

export const metadata = {
  title: "Features | VitaePro",
  description: "Explore features across User, Crowd, and AI modes, plus security controls.",
};

export default function FeaturesPage() {
  return (
    <div className="space-y-10 pb-16 pt-12">
      <section className="section-shell space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Features</p>
        <h1 className="text-4xl font-semibold text-slate-900">Everything you need to deliver outcomes.</h1>
        <p className="max-w-3xl text-lg text-slate-600">
          Mix User, Crowd, and AI modes per step, keep audit trails, and ship shortlists with structured evidence.
        </p>
      </section>

      <section className="section-shell grid gap-6 md:grid-cols-2">
        {featureSections.map((section) => (
          <div key={section.title} className="card p-6">
            <h2 className="text-xl font-semibold text-slate-900">{section.title}</h2>
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
    </div>
  );
}
