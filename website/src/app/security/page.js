export const metadata = {
  title: "Security | VitaePro",
  description: "How we handle data, access, and compliance basics for hiring workflows.",
};

const controls = [
  {
    title: "Data handling",
    detail: "Data is encrypted in transit (TLS 1.2+) and at rest. Minimal PII collected; retention policies are configurable.",
  },
  {
    title: "Access control",
    detail: "Role-based permissions with least-privilege defaults. Audit trails for every shortlist change.",
  },
  {
    title: "AI safeguards",
    detail: "Prompt versioning, review gates, and bias checks keep AI outputs transparent and reviewable.",
  },
  {
    title: "Hosting",
    detail: "Static-exported site ready for shared hosting (VentraIP). App and data services can live separately.",
  },
];

export default function SecurityPage() {
  return (
    <div className="section-shell space-y-6 pb-16 pt-12">
      <h1 className="text-4xl font-semibold text-slate-900">Security and trust</h1>
      <p className="max-w-3xl text-lg text-slate-600">
        Build trust with clear controls. Pair this marketing site with your product infrastructure and keep customer data locked down.
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        {controls.map((item) => (
          <div key={item.title} className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
