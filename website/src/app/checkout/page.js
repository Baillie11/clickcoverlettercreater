import Link from "next/link";

export const metadata = {
  title: "Checkout | VitaePro",
  description: "Redirect users to your Stripe Checkout session to start a subscription.",
};

const checkoutUrl = process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL || "https://dashboard.stripe.com/test/payments";

export default function CheckoutPage() {
  return (
    <div className="section-shell space-y-6 pb-16 pt-12">
      <h1 className="text-4xl font-semibold text-slate-900">Checkout</h1>
      <p className="max-w-2xl text-lg text-slate-600">
        This page should redirect users to your Stripe Checkout link. Replace the placeholder URL with a live Stripe Checkout session URL when you are ready.
      </p>
      <div className="card flex flex-col gap-4 p-6">
        <p className="text-sm text-slate-700">Checkout URL</p>
        <code className="rounded bg-slate-900 px-3 py-2 text-sm text-white">
          {checkoutUrl}
        </code>
        <Link
          href={checkoutUrl}
          className="inline-flex w-fit items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Go to checkout
        </Link>
        <p className="text-xs text-slate-500">Set NEXT_PUBLIC_STRIPE_CHECKOUT_URL to your live Stripe Checkout link.</p>
      </div>
    </div>
  );
}
