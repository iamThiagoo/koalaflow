import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const brandFont = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-brand',
});

export const metadata: Metadata = {
  title: 'Koalaflow',
  description: 'Video hosting platform',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={brandFont.variable}>
      <body>{children}</body>
    </html>
  );
}
