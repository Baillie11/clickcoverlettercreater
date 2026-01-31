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

export const metadata = {
  title: "VitaePro | Outcome-first hiring",
  description: "Outcome-first hiring with User, Crowd, and AI modes. Ready for Stripe checkout, analytics, and SEO.",
  metadataBase: new URL("https://example.com"),
  openGraph: {
    title: "VitaePro | Outcome-first hiring",
    description: "Outcome-first hiring with User, Crowd, and AI modes.",
    url: "https://example.com",
    siteName: "VitaePro",
  },
  twitter: {
    card: "summary_large_image",
    title: "VitaePro | Outcome-first hiring",
    description: "Outcome-first hiring with User, Crowd, and AI modes.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
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
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-slate-50 text-slate-900 antialiased`}
      >
        <NavBar />
        <main className="min-h-[80vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
