export const metadata = {
  title: "Privacy | VitaePro",
  description: "Privacy policy placeholder. Replace with your legal text.",
};

export default function PrivacyPage() {
  return (
    <div className="section-shell space-y-4 pb-16 pt-12">
      <h1 className="text-3xl font-semibold text-slate-900">Privacy Policy</h1>
      <p className="text-sm text-slate-600">
        Replace this placeholder with your official privacy policy. Include data collection, processing, retention, and contact details.
      </p>
      <div className="card p-6 text-sm text-slate-700">
        <p>We respect your privacy. This site uses Google Analytics (if enabled) and Stripe for billing. All customer payment data is handled by Stripe.</p>
      </div>
    </div>
  );
}
