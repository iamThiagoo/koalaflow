import { ButtonLink } from '@/components/button-link';
import type { HomeContent } from '@/content/home';

export function Hero({
  content,
  appUrl,
  salesContactUrl,
}: {
  content: HomeContent['hero'];
  appUrl: string;
  salesContactUrl: string;
}) {
  return (
    <section className="bg-gradient-to-b from-brand-50 to-white">
      <div className="mx-auto max-w-4xl px-6 py-24 text-center sm:py-32">
        <p className="font-semibold text-brand-600 text-sm uppercase tracking-wide">
          {content.eyebrow}
        </p>
        <h1 className="mt-4 text-balance font-bold text-4xl text-ink-950 tracking-tight sm:text-6xl">
          {content.title}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-ink-600 text-lg">
          {content.subtitle}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink href={appUrl}>{content.primaryCta}</ButtonLink>
          <ButtonLink href={salesContactUrl} variant="secondary">
            {content.secondaryCta}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
