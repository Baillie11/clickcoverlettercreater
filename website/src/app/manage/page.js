import Link from "next/link";

export const metadata = {
  title: "Manage billing | VitaePro",
  description: "Let customers manage payment methods, invoices, and cancellations via Stripe Customer Portal.",
};

const portalUrl = process.env.NEXT_PUBLIC_STRIPE_PORTAL_URL || "https://dashboard.stripe.com/test/billing";

export default function ManagePage() {
  return (
    <div className="section-shell space-y-6 pb-16 pt-12">
      <h1 className="text-4xl font-semibold text-slate-900">Billing management</h1>
      <p className="max-w-2xl text-lg text-slate-600">
        Send customers to the Stripe Customer Portal to update cards, download invoices, and cancel or downgrade. Swap in your live portal URL via the NEXT_PUBLIC_STRIPE_PORTAL_URL environment variable.
      </p>
      <div className="card flex flex-col gap-4 p-6">
        <p className="text-sm text-slate-700">Portal URL</p>
        <code className="rounded bg-slate-900 px-3 py-2 text-sm text-white">{portalUrl}</code>
        <Link
          href={portalUrl}
          className="inline-flex w-fit items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Open Stripe portal
        </Link>
        <p className="text-xs text-slate-500">Set NEXT_PUBLIC_STRIPE_PORTAL_URL to your live Stripe portal link.</p>
      </div>
    </div>
  );
}
