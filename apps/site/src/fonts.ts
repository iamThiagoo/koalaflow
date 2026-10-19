import { Caveat, Plus_Jakarta_Sans } from 'next/font/google';

export const brandFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-brand',
});

export const handwritingFont = Caveat({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-handwriting',
});
