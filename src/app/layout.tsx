import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Afridi Inn - Restaurant Management & Tracking',
  description: 'Restaurant management and online order tracking system for Afridi Inn',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#FAF7F2] text-[#1C1917]">
        {children}
      </body>
    </html>
  );
}
