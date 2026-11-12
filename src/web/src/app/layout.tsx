import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CampusFolio — Campus Social Media & Portfolio",
  description:
    "Platform sosial media & portofolio mahasiswa dengan rekomendasi kolaborator AI dan moderasi konten.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} ${inter.variable}`}>
      <body className="antialiased bg-surface text-on-surface font-sans selection:bg-primary selection:text-white min-h-screen">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
