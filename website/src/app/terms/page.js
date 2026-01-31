export const metadata = {
  title: "Terms | VitaePro",
  description: "Terms of service placeholder. Replace with your legal terms.",
};

export default function TermsPage() {
  return (
    <div className="section-shell space-y-4 pb-16 pt-12">
      <h1 className="text-3xl font-semibold text-slate-900">Terms of Service</h1>
      <p className="text-sm text-slate-600">
        Replace this placeholder with your official terms. Include acceptable use, subscription details, and liability limits.
      </p>
      <div className="card p-6 text-sm text-slate-700">
        <p>By using VitaePro you agree to comply with applicable laws and respect customer data. Billing is handled through Stripe per plan selection.</p>
      </div>
    </div>
  );
}
