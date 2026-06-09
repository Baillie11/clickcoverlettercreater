import Link from "next/link";
import PricingSwitcher from "../../components/PricingSwitcher";

const appUrl = "https://www.vitaepro.com.au/app.html";

export const metadata = {
  title: "Pricing | VitaePro",
  description:
    "VitaePro is free for now. Subscription packages for individuals, coaches, and helpers are coming soon.",
};

const founderBenefits = [
  "12 months free when paid plans are introduced",
  "Keep access while pricing is being finalised",
  "Help shape the product around real job applications",
  "Early influence on features for cover letters and selection criteria",
  "Priority consideration for new templates, workflows, and improvements",
];

export default function PricingPage() {
  return (
    <div className="bg-[#f7f5ef] pb-20 pt-12 text-slate-950">
      <section className="section-shell space-y-6">
        <p className="eyebrow">Pricing</p>
        <div className="max-w-4xl space-y-5">
          <h1 className="text-5xl font-black leading-none tracking-tight text-slate-950 md:text-7xl">
            VitaePro is free for now.
          </h1>
          <p className="max-w-3xl text-xl leading-8 text-slate-700">
            Subscription packages are coming soon. For now, you can use VitaePro to create stronger cover letters and selection criteria responses without paying.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={appUrl} className="button-primary">
            Open app
          </Link>
          <a href="#founders" className="button-secondary">
            Founders Club
          </a>
        </div>
      </section>

      <section id="founders" className="section-shell mt-16">
        <div className="cta-panel">
          <div>
            <p className="eyebrow">Founders Club</p>
            <h2>Register now and receive 12 months free.</h2>
            <p>
              Join while VitaePro is free and become part of the Founders Club. Founding users help shape the product and receive 12 months free once paid subscriptions are introduced.
            </p>
          </div>
          <Link href={appUrl} className="button-primary dark">
            Join free today
          </Link>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-5">
          {founderBenefits.map((benefit) => (
            <article key={benefit} className="sales-card">
              <p className="mt-0 text-sm font-semibold text-slate-800">{benefit}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-shell mt-16 space-y-8">
        <div className="section-heading compact">
          <p className="eyebrow">Subscription prices coming soon</p>
          <h2>Simple plans for individuals, coaches, and helpers.</h2>
          <p>
            These are the planned subscription packages. VitaePro is currently free to use, giving you the chance to create stronger applications before paid plans are introduced.
          </p>
        </div>
        <PricingSwitcher />
      </section>
    </div>
  );
}
