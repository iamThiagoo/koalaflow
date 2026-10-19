import type { ReactNode } from 'react';
import { brandFont, handwritingFont } from '@/fonts';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${brandFont.variable} ${handwritingFont.variable} motion-safe:scroll-smooth`}
    >
      <body className="bg-surface font-sans text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
