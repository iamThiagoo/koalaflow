import { ButtonLink } from '@/components/button-link';
import type { HomeContent } from '@/content/home';
import { revealDelay } from '@/motion';

/**
 * "FAQ" (Figma 31:172 desktop, 31:216 mobile) built on native <details>, so it works without JavaScript.
 * Rule: one answer is open at a time, starting with the one the design shows open.
 */
export function Faq({
  content,
  appUrl,
  supportUrl,
  defaultOpenIndex,
}: {
  content: HomeContent['faq'];
  appUrl: string;
  supportUrl: string;
  defaultOpenIndex: number;
}) {
  return (
    <section
      aria-labelledby="faq-title"
      className="mx-auto max-w-324 bg-surface px-5 py-20 md:px-10 md:pt-30 md:pb-6"
    >
      <div className="flex flex-col gap-10 lg:flex-row lg:gap-24">
        <div
          data-reveal
          className="flex w-full flex-col items-start gap-6 md:max-w-100 lg:shrink-0"
        >
          <h2
            id="faq-title"
            className="flex flex-col gap-2 font-bold text-[32px] leading-10 tracking-[-0.32px] md:text-[40px] md:leading-12 md:tracking-[-2px]"
          >
            <span className="text-primary-strong">{content.titleAccent}</span>
            <span className="text-text-primary">{content.title}</span>
          </h2>
          <p className="text-base text-text-secondary leading-6 tracking-[-0.32px]">
            {content.subtitle}
          </p>
          <ButtonLink href={appUrl} className="w-full md:w-80">
            {content.primaryCta}
          </ButtonLink>
          <p className="w-full text-center text-text-secondary text-xs leading-4 md:w-80">
            <strong className="font-bold">{content.microcopyStrong}</strong>
            {content.microcopy}
          </p>
          <a
            href={supportUrl}
            className="text-sm w-full text-center text-text-secondary text-xs leading-4 md:w-80 text-text-primary leading-5 underline transition-colors hover:text-primary-strong"
          >
            {content.supportLink}
          </a>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {content.items.map((item, index) => (
            <details
              key={item.question}
              data-reveal
              style={revealDelay(index + 1, 60)}
              name="faq"
              open={index === defaultOpenIndex}
              className="group rounded-2xl border border-border-card bg-surface p-[19px] transition-colors hover:border-border-active md:px-[31px] md:py-[23px]"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between rounded-sm focus-visible:outline-2 focus-visible:outline-primary-strong focus-visible:outline-offset-4 [&::-webkit-details-marker]:hidden">
                <span className="flex-1 font-medium text-base text-text-primary leading-6 md:text-lg md:leading-7">
                  {item.question}
                </span>
                <span
                  aria-hidden="true"
                  className="flex size-5 shrink-0 items-center justify-center text-[20px] text-text-secondary leading-5"
                >
                  <span className="group-open:hidden">+</span>
                  <span className="hidden group-open:inline">−</span>
                </span>
              </summary>
              <p className="mt-3 max-w-160 text-base text-text-secondary leading-6">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
