import Link from "next/link";

const appUrl = "https://www.vitaepro.com.au/app.html";

const proofPoints = [
  { value: "Free", label: "for a limited time during launch" },
  { value: "3x", label: "faster than starting every application cold" },
  { value: "Human", label: "drafts that still sound like you" },
];

const painPoints = [
  "Blank-page panic before a deadline",
  "Generic AI cover letters that sound like everyone else",
  "Rewriting the same strengths and examples again and again",
  "Trying to match selection criteria without losing your voice",
];

const steps = [
  {
    title: "Paste the role",
    body: "Bring in the job ad or selection criteria so VitaePro can keep every answer focused on what the employer asked for.",
  },
  {
    title: "Shape the story",
    body: "Use reusable strengths, examples, tone controls, and guided prompts to turn your experience into a sharper application.",
  },
  {
    title: "Export and apply",
    body: "Create polished cover letters and responses you can review, refine, and send with confidence.",
  },
];

const features = [
  {
    title: "Cover letters that do not sound copied",
    body: "VitaePro helps you write in a clear, confident voice instead of producing a bland template or obvious AI draft.",
  },
  {
    title: "Selection criteria made less painful",
    body: "Break big criteria into manageable responses, connect your examples to the role, and keep everything structured.",
  },
  {
    title: "Reusable career evidence",
    body: "Save strong examples, achievements, and phrases so the next application starts warmer than a blank document.",
  },
  {
    title: "Optional AI, always editable",
    body: "Use AI for momentum, not autopilot. You stay in control of the final wording, tone, and proof points.",
  },
  {
    title: "Built for real job seekers",
    body: "Designed around the messy reality of applying: deadlines, different roles, changing criteria, and limited energy.",
  },
  {
    title: "Free for a limited time",
    body: "VitaePro is launched and free for a limited time, so users can start creating stronger applications before paid plans begin.",
  },
];

const audienceCards = [
  {
    title: "For job seekers",
    body: "Create stronger applications without outsourcing your personality to a template.",
    items: ["Graduate roles", "Government criteria", "Career changes", "Short-notice applications"],
  },
  {
    title: "For coaches and helpers",
    body: "Give clients a clearer writing process and a better first draft to work from.",
    items: ["Reusable examples", "Consistent structure", "Faster review cycles", "Cleaner exports"],
  },
];

const faqs = [
  {
    q: "Is VitaePro free right now?",
    a: "Yes. VitaePro is launched and free for a limited time. Paid plans will come later, but there is no payment required right now.",
  },
  {
    q: "Is this just another AI cover letter generator?",
    a: "No. AI can help, but the product is built around your own examples, role-specific prompts, and editable writing that still sounds human.",
  },
  {
    q: "What can I create with it?",
    a: "Cover letters, selection criteria responses, reusable career examples, and cleaner application drafts you can keep refining.",
  },
  {
    q: "Do I need to be technical?",
    a: "No. The app is designed for normal job seekers who want a clearer process, not another complicated writing tool.",
  },
];

function ProductPreview() {
  return (
    <div className="hero-preview" aria-hidden="true">
      <div className="preview-toolbar">
        <span />
        <span />
        <span />
      </div>
      <div className="preview-grid">
        <div className="preview-panel preview-panel-main">
          <p className="preview-kicker">Role match</p>
          <h3>Community Services Coordinator</h3>
          <div className="preview-score"><span style={{ width: "82%" }} /></div>
          <p>Strong evidence for stakeholder communication, case notes, and trauma-informed practice.</p>
        </div>
        <div className="preview-panel">
          <p className="preview-kicker">Reusable proof</p>
          <ul>
            <li>Managed 42 active client files</li>
            <li>Reduced response time by 31%</li>
            <li>Led intake workflow redesign</li>
          </ul>
        </div>
        <div className="preview-panel">
          <p className="preview-kicker">Tone</p>
          <div className="tone-row"><span>Warm</span><strong>68%</strong></div>
          <div className="tone-row"><span>Direct</span><strong>74%</strong></div>
          <div className="tone-row"><span>Formal</span><strong>57%</strong></div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-[#f7f5ef] text-slate-950">
      <section className="hero-shell">
        <div className="hero-visual">
          <ProductPreview />
        </div>
        <div className="hero-content section-shell">
          <p className="eyebrow">Launched and free for a limited time</p>
          <h1>Write the job application that gets you noticed.</h1>
          <p className="hero-copy">
            VitaePro helps job seekers turn real experience into sharper cover letters and selection criteria responses, without the stiff, generic feel of most AI writing tools.
          </p>
          <div className="hero-actions">
            <Link href={appUrl} className="button-primary">
              Launch VitaePro free
            </Link>
            <Link href="#how-it-works" className="button-secondary">
              See how it works
            </Link>
          </div>
          <p className="hero-note">No payment required during the launch period. Start writing today and build stronger applications while VitaePro is free.</p>
        </div>
      </section>

      <section className="section-shell stats-band" aria-label="VitaePro highlights">
        {proofPoints.map((item) => (
          <div key={item.value}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </section>

      <section className="section-shell problem-section">
        <div>
          <p className="eyebrow">The problem</p>
          <h2>Applying for jobs should not feel like fighting a blank page.</h2>
        </div>
        <div className="problem-list">
          {painPoints.map((point) => (
            <div key={point} className="problem-item">
              <span aria-hidden="true">/</span>
              <p>{point}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="section-shell sales-section">
        <div className="section-heading">
          <p className="eyebrow">How it works</p>
          <h2>A clearer path from job ad to finished application.</h2>
          <p>VitaePro gives you structure, momentum, and better wording while keeping the final application unmistakably yours.</p>
        </div>
        <div className="step-grid">
          {steps.map((step, index) => (
            <article key={step.title} className="sales-card">
              <span className="step-number">0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-shell sales-section">
        <div className="section-heading compact">
          <p className="eyebrow">Why people will use it</p>
          <h2>Built to help users apply with more confidence, more often.</h2>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <article key={feature.title} className="sales-card feature-card">
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-shell audience-section">
        {audienceCards.map((audience) => (
          <article key={audience.title} className="audience-card">
            <h2>{audience.title}</h2>
            <p>{audience.body}</p>
            <div className="pill-row">
              {audience.items.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="section-shell cta-panel">
        <div>
          <p className="eyebrow">Free for a limited time</p>
          <h2>Start using VitaePro now, while it is free.</h2>
          <p>
            VitaePro is live and ready to use. Create better applications, reduce writing stress, and take advantage of free access during the launch period.
          </p>
        </div>
        <Link href={appUrl} className="button-primary dark">
          Start a free application
        </Link>
      </section>

      <section className="section-shell sales-section faq-section">
        <div className="section-heading compact">
          <p className="eyebrow">Questions</p>
          <h2>Simple answers for new users.</h2>
        </div>
        <div className="faq-grid">
          {faqs.map((item) => (
            <article key={item.q} className="sales-card">
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

