import Link from "next/link";

export const metadata = {
  title: "Login | VitaePro",
  description: "Log in to VitaePro to create authentic cover letters.",
};

const appUrl = "https://www.vitaepro.com.au/app.html";

export default function LoginPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 pb-16 pt-12">
      <div className="glass-card card w-full max-w-md space-y-6 p-8 text-center">
        <h1 className="text-3xl font-semibold text-white">Log in to VitaePro</h1>
        <p className="text-sm text-slate-100/80">
          Access your cover letters, response library, and account settings.
        </p>
        <Link
          href={appUrl}
          className="btn-primary-gradient inline-block rounded-full px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
        >
          Continue to App
        </Link>
      </div>
    </div>
  );
}
