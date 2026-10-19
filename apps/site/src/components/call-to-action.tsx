import { ButtonLink } from '@/components/button-link';
import type { HomeContent } from '@/content/home';

export function CallToAction({
  content,
  appUrl,
  salesContactUrl,
}: {
  content: HomeContent['callToAction'];
  appUrl: string;
  salesContactUrl: string;
}) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="rounded-card bg-brand-950 px-6 py-16 text-center sm:px-16">
        <h2 className="text-balance font-bold text-3xl text-white tracking-tight">
          {content.title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-brand-100">
          {content.subtitle}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink href={appUrl}>{content.primaryCta}</ButtonLink>
          <ButtonLink href={salesContactUrl} variant="secondary">
            {content.secondaryCta}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
