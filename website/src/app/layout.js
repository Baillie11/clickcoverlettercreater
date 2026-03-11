import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import Footer from "../components/Footer";
import NavBar from "../components/NavBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const LINKEDIN_PARTNER_ID = process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID;

export const metadata = {
  title: "VitaePro | Authentic Cover Letters Without AI Fluff",
  description:
    "Create authentic cover letters faster with VitaePro. Build reusable responses, learn from real examples, and refine with optional AI assist.",
  metadataBase: new URL("https://www.vitaepro.com.au"),
  alternates: {
    canonical: "https://www.vitaepro.com.au",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "VitaePro | Human First Cover Letter Creator",
    description:
      "Create authentic cover letters faster with VitaePro. Build reusable responses, learn from real examples, and refine with optional AI assist.",
    url: "https://www.vitaepro.com.au",
    siteName: "VitaePro",
    type: "website",
    images: [
      {
        url: "/og-logo.png",
        width: 1200,
        height: 630,
        alt: "VitaePro — Human First Cover Letter Creator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VitaePro | Human First Cover Letter Creator",
    description:
      "Human-first cover letter software with crowd examples and optional AI assist for job seekers and agencies.",
    images: ["/og-logo.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics 4 */}
        {GA_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        ) : null}

        {/* Google Tag Manager */}
        {GTM_ID ? (
          <Script id="gtm-init" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GTM_ID}');
            `}
          </Script>
        ) : null}

        {/* Meta Pixel */}
        {META_PIXEL_ID ? (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window,document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
        ) : null}

        {/* LinkedIn Insight Tag */}
        {LINKEDIN_PARTNER_ID ? (
          <Script id="linkedin-insight" strategy="afterInteractive">
            {`
              _linkedin_partner_id = "${LINKEDIN_PARTNER_ID}";
              window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
              window._linkedin_data_partner_ids.push(_linkedin_partner_id);
              (function(l) {
              if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
              window.lintrk.q=[]}
              var s = document.getElementsByTagName("script")[0];
              var b = document.createElement("script");
              b.type = "text/javascript";b.async = true;
              b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
              s.parentNode.insertBefore(b, s);})(window.lintrk);
            `}
          </Script>
        ) : null}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} theme-vitae bg-[#0f1033] text-slate-50 antialiased`}
      >
        {/* GTM noscript fallback */}
        {GTM_ID ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        ) : null}
        <NavBar />
        <main className="min-h-[80vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
