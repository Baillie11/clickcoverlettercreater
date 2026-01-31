export const metadata = {
  title: "Refunds | VitaePro",
  description: "Refund policy placeholder. Be explicit if no refunds.",
};

export default function RefundsPage() {
  return (
    <div className="section-shell space-y-4 pb-16 pt-12">
      <h1 className="text-3xl font-semibold text-slate-900">Refund Policy</h1>
      <p className="text-sm text-slate-600">
        State your refund policy clearly. If no refunds are provided, say so explicitly and describe any exceptions.
      </p>
      <div className="card p-6 text-sm text-slate-700">
        <p>Subscriptions are billed via Stripe. Unless required by law, fees are non-refundable. You can cancel anytime through the Stripe portal to stop future charges.</p>
      </div>
    </div>
  );
}
