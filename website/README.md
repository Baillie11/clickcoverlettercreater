## VitaePro marketing site

Static-exported Next.js (App Router, Tailwind v4) ready for traditional hosting (e.g., VentraIP). Includes pages: Home, How it works, Pricing, Checkout, Manage billing, Login, Features, Security, FAQ, Blog (+ individual posts), Privacy, Terms, Refunds.

### Install
```bash
npm install
```

### Develop
```bash
npm run dev
```

### Lint
```bash
npm run lint
```

### Build (static export)
```bash
npm run build
# output goes to ./out for hosting; upload to VentraIP
```

### Environment variables
Create a `.env.local` with:
- `NEXT_PUBLIC_GA_ID` — Google Analytics measurement ID (optional)
- `NEXT_PUBLIC_STRIPE_CHECKOUT_URL` — Stripe Checkout link
- `NEXT_PUBLIC_STRIPE_PORTAL_URL` — Stripe Customer Portal link
- `NEXT_PUBLIC_APP_URL` — App login/SSO URL

### Stripe integration
- `/checkout` links to `NEXT_PUBLIC_STRIPE_CHECKOUT_URL` (replace placeholder test link).
- `/manage` links to `NEXT_PUBLIC_STRIPE_PORTAL_URL` for billing, cancellations, and invoices.

### Blog content
- Sample posts live in `src/data/posts.js`. Add or edit entries; each will statically generate at `/blog/[slug]`.

### SEO/Analytics
- GA script auto-loads when `NEXT_PUBLIC_GA_ID` is set.
- Update `metadataBase` in `src/app/layout.js` to your production domain.
