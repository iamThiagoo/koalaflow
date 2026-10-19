import type { ReactNode } from 'react';
import { brandFont } from '@/fonts';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={brandFont.variable}>
      <body className="bg-white font-sans text-ink-900 antialiased">
        {children}
      </body>
    </html>
  );
}
