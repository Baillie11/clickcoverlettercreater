import Link from "next/link";

export const metadata = {
  title: "Login | VitaePro",
  description: "Link users to your app login or SSO provider.",
};

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.example.com/login";

export default function LoginPage() {
  return (
    <div className="section-shell space-y-6 pb-16 pt-12">
      <h1 className="text-4xl font-semibold text-slate-900">Login</h1>
      <p className="max-w-2xl text-lg text-slate-600">
        Point this page to your production app login or SSO provider. Update the NEXT_PUBLIC_APP_URL environment variable to control the target.
      </p>
      <div className="card flex flex-col gap-4 p-6">
        <p className="text-sm text-slate-700">App login URL</p>
        <code className="rounded bg-slate-900 px-3 py-2 text-sm text-white">{appUrl}</code>
        <Link
          href={appUrl}
          className="inline-flex w-fit items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Continue to app
        </Link>
        <p className="text-xs text-slate-500">Set NEXT_PUBLIC_APP_URL to your live app login URL.</p>
      </div>
    </div>
  );
}
