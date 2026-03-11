"use client";

import { FormEvent, useState } from "react";
import { trackEarlyAccessSignup } from "../lib/analytics";

export default function EmailCaptureForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email.");
      setStatus("error");
      return;
    }
    setError("");
    setStatus("submitting");

    try {
      const response = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(typeof data.error === "string" ? data.error : "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      trackEarlyAccessSignup();
      setStatus("success");
    } catch (err) {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex w-full flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-white/80" htmlFor="email">
          Get early access
        </label>
        <div className="flex gap-3">
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-full border border-white/30 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-white/50 focus:ring-2 focus:ring-white/50"
            aria-describedby="email-help"
            aria-busy={status === "submitting"}
            required
          />
          <button
            type="submit"
            className="btn-primary-gradient shrink-0 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-70"
            disabled={status === "submitting" || status === "success"}
          >
            {status === "success" ? "Thanks!" : status === "submitting" ? "Saving..." : "Notify me"}
          </button>
        </div>
        <p id="email-help" className="text-xs text-white/70">
          We’ll email you when beta slots open. No spam.
        </p>
        {error ? <p className="text-xs font-semibold text-rose-200">{error}</p> : null}
        {status === "success" ? (
          <p className="text-xs font-semibold text-emerald-200">You’re on the list.</p>
        ) : null}
      </div>
    </form>
  );
}
