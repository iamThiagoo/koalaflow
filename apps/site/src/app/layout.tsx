import type { ReactNode } from 'react';
import { brandFont, handwritingFont } from '@/fonts';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${brandFont.variable} ${handwritingFont.variable} scroll-pt-24 motion-safe:scroll-smooth md:scroll-pt-28 lg:scroll-pt-32`}
    >
      <body className="bg-surface font-sans text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
