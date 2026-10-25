import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const brandFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-brand',
});

export const metadata: Metadata = {
  title: 'Koalaflow',
  description: 'Painel do Koalaflow',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={brandFont.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
