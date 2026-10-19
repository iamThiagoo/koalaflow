import type { Metadata } from 'next';
import { CallToAction } from '@/components/call-to-action';
import { Hero } from '@/components/hero';
import { Highlights } from '@/components/highlights';
import { HowItWorks } from '@/components/how-it-works';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { siteConfig } from '@/config';
import { home } from '@/content/home';
import { buildHomeMetadata } from '@/seo';

export const metadata: Metadata = buildHomeMetadata(siteConfig.siteUrl);

export default function HomePage() {
  const { appUrl, salesContactUrl } = siteConfig;
  return (
    <>
      <SiteHeader content={home.header} appUrl={appUrl} />
      <main>
        <Hero
          content={home.hero}
          appUrl={appUrl}
          salesContactUrl={salesContactUrl}
        />
        <Highlights content={home.highlights} />
        <HowItWorks content={home.howItWorks} />
        <CallToAction
          content={home.callToAction}
          appUrl={appUrl}
          salesContactUrl={salesContactUrl}
        />
      </main>
      <SiteFooter content={home.footer} />
    </>
  );
}
