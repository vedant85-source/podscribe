import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PodScribe — Turn Any Podcast Into a Content Machine",
  description:
    "Upload your audio. Get transcript, show notes, blog post & social content in 60 seconds. Free forever.",
  keywords: ["podcast", "transcription", "show notes", "blog post", "social media", "AI"],
  openGraph: {
    title: "PodScribe — Turn Any Podcast Into a Content Machine",
    description:
      "Upload your audio. Get transcript, show notes, blog post & social content in 60 seconds.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
