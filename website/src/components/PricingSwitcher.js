import Link from "next/link";
import { agencyPlans, individualPlans } from "../data/pricing";

const appUrl = "https://www.vitaepro.com.au/app.html";
const plans = [...individualPlans, ...agencyPlans];

const PlanCard = ({ plan }) => (
  <article className={`sales-card flex h-full flex-col gap-5 ${plan.highlight ? "border-slate-950" : ""}`}>
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h3>{plan.name}</h3>
        {plan.highlight ? (
          <span className="rounded-full bg-[#fff1d6] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#a24314]">
            For client work
          </span>
        ) : null}
      </div>
      <p>{plan.description}</p>
    </div>
    <div>
      <p className="text-4xl font-black tracking-tight text-slate-950">{plan.price}</p>
      <p className="mt-2 text-sm font-semibold text-slate-500">Subscription prices coming soon</p>
    </div>
    <ul className="space-y-3 text-sm text-slate-700">
      {plan.features.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span className="mt-1.5 h-2 w-2 rounded-full bg-[#c05621]" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
    <Link href={appUrl} className="button-secondary mt-auto w-full justify-center">
      Start free for now
    </Link>
  </article>
);

export default function PricingSwitcher() {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {plans.map((plan) => (
        <PlanCard key={plan.name} plan={plan} />
      ))}
    </section>
  );
}
