import Link from "next/link";
import PricingSwitcher from "../../components/PricingSwitcher";

export const metadata = {
  title: "Pricing | VitaePro",
  description: "Pricing for individuals and agencies with Stripe checkout and portal management.",
};

export default function PricingPage() {
  return (
    <div className="space-y-10 pb-16 pt-12">
      <section className="section-shell space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pricing</p>
        <h1 className="text-4xl font-semibold text-slate-900">Simple pricing, Stripe-managed billing.</h1>
        <p className="max-w-3xl text-lg text-slate-600">
          Toggle between Individual and Agency plans. Checkout and billing are hosted by Stripe. Upgrade, downgrade, or cancel anytime via the Stripe portal.
        </p>
        <PricingSwitcher />
      </section>

      <section className="section-shell card flex flex-col gap-4 p-6">
        <h2 className="text-xl font-semibold text-slate-900">Billing management</h2>
        <p className="text-sm text-slate-600">
          Customers manage payment methods, invoices, and cancellations in the Stripe Customer Portal. Replace the portal link with your live Stripe portal URL when ready.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/manage"
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Open billing portal
          </Link>
          <Link
            href="/security"
            className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Review security
          </Link>
        </div>
      </section>
    </div>
  );
}
