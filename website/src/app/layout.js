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
  title: "VitaePro | Free cover letter and selection criteria builder",
  description:
    "VitaePro helps job seekers write stronger cover letters and selection criteria responses with guided structure, reusable career evidence, and optional AI assistance.",
  metadataBase: new URL("https://www.vitaepro.com.au"),
  openGraph: {
    title: "VitaePro | Write better job applications",
    description:
      "Free for a limited time: a practical cover letter and selection criteria builder for job seekers.",
    url: "https://www.vitaepro.com.au",
    siteName: "VitaePro",
  },
  twitter: {
    card: "summary_large_image",
    title: "VitaePro | Write better job applications",
    description:
      "Create sharper cover letters and selection criteria responses without sounding generic.",
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
        className={`${geistSans.variable} ${geistMono.variable} bg-[#f7f5ef] text-slate-950 antialiased`}
      >
        <NavBar />
        <main className="min-h-[80vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

