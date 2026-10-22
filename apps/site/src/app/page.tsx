import type { Metadata } from 'next';
import { CardTilt } from '@/components/card-tilt';
import { Faq } from '@/components/faq';
import { FinalInvitation } from '@/components/final-invitation';
import { Hero } from '@/components/hero';
import { HowItWorks } from '@/components/how-it-works';
import { Pricing } from '@/components/pricing';
import { ProductProtection } from '@/components/product-protection';
import { ScrollReveal } from '@/components/scroll-reveal';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { siteConfig } from '@/config';
import { home } from '@/content/home';
import { type LinkContext, resolveHref } from '@/links';
import { buildHomeMetadata } from '@/seo';

export const metadata: Metadata = buildHomeMetadata(siteConfig.siteUrl);

export default function HomePage() {
  const links: LinkContext = {
    config: siteConfig,
    supportEmail: home.contact.supportEmail,
  };
  const appUrl = resolveHref('app', links);
  return (
    <>
      <main>
        <Hero
          content={home.hero}
          header={<SiteHeader content={home.header} links={links} />}
          appUrl={appUrl}
        />
        <ProductProtection content={home.protection} appUrl={appUrl} />
        <HowItWorks content={home.howItWorks} />
        <Pricing
          content={home.pricing}
          appUrl={appUrl}
          salesUrl={resolveHref('sales', links)}
        />
        <Faq
          content={home.faq}
          appUrl={appUrl}
          supportUrl={resolveHref('support', links)}
          defaultOpenIndex={1}
        />
        <FinalInvitation content={home.finalInvitation} appUrl={appUrl} />
      </main>
      <SiteFooter content={home.footer} links={links} />
      <ScrollReveal />
      <CardTilt />
    </>
  );
}
