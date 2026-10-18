import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusFolio — Campus Social Media & Portfolio",
  description: "Platform sosial media & portofolio mahasiswa dengan rekomendasi kolaborator AI dan moderasi konten.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
