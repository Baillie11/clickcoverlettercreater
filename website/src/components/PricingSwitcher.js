'use client';

import Link from "next/link";
import { useState } from "react";
import { agencyPlans, individualPlans } from "../data/pricing";

const PlanCard = ({ plan }) => (
  <div className={`card flex flex-col gap-4 p-6 ${plan.highlight ? "border-slate-900" : ""}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-900">{plan.name}</p>
        <p className="text-xs text-slate-500">{plan.description}</p>
      </div>
      {plan.highlight ? (
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          Most popular
        </span>
      ) : null}
    </div>
    <p className="text-3xl font-semibold text-slate-900">{plan.price}</p>
    <ul className="space-y-2 text-sm text-slate-700">
      {plan.features.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
    <Link
      href="/checkout"
      className="mt-auto inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
    >
      Choose plan
    </Link>
  </div>
);

export default function PricingSwitcher() {
  const [mode, setMode] = useState("individual");
  const plans = mode === "individual" ? individualPlans : agencyPlans;

  return (
    <>
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 text-sm font-semibold text-slate-700 shadow-sm">
        <button
          type="button"
          onClick={() => setMode("individual")}
          className={`rounded-full px-4 py-2 transition ${mode === "individual" ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`}
        >
          Individual
        </button>
        <button
          type="button"
          onClick={() => setMode("agency")}
          className={`rounded-full px-4 py-2 transition ${mode === "agency" ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`}
        >
          Agency
        </button>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <PlanCard key={plan.name} plan={plan} />
        ))}
      </section>
    </>
  );
}
