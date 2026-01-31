import { faqs } from "../../data/faq";

export const metadata = {
  title: "FAQ | VitaePro",
  description: "Answers about modes, billing, hosting, and login.",
};

export default function FaqPage() {
  return (
    <div className="section-shell space-y-6 pb-16 pt-12">
      <h1 className="text-4xl font-semibold text-slate-900">Frequently asked questions</h1>
      <div className="space-y-4">
        {faqs.map((item) => (
          <div key={item.question} className="card p-5">
            <p className="text-base font-semibold text-slate-900">{item.question}</p>
            <p className="mt-2 text-sm text-slate-700">{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
