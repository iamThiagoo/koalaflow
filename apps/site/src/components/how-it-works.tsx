import type { HomeContent } from '@/content/home';
import { revealDelay } from '@/motion';

/**
 * "How it works" (Figma 17:2642 desktop, 17:2802 mobile): a horizontal track on desktop,
 * a vertical one on mobile.
 */
export function HowItWorks({
  content,
}: {
  content: HomeContent['howItWorks'];
}) {
  return (
    <section
      id="como-funciona"
      aria-labelledby="como-funciona-title"
      className="mx-auto max-w-324 px-5 pt-6 pb-16 md:px-10 md:pt-4 md:pb-24"
    >
      <h2
        data-reveal
        id="como-funciona-title"
        className="font-bold text-[32px] text-primary-foreground leading-12 tracking-[-0.32px] md:text-[40px] md:tracking-[-2px]"
      >
        {content.title}
      </h2>
      <ol className="mt-8 flex flex-col md:mt-12 md:flex-row md:gap-8">
        {content.steps.map((step, index) => (
          <li
            key={step.title}
            data-reveal
            style={revealDelay(index)}
            className="flex min-h-45 gap-5 first:min-h-33 md:min-h-0 md:flex-1 md:flex-col md:gap-6 md:first:min-h-0"
          >
            <div className="flex w-10 shrink-0 flex-col items-center md:w-auto md:flex-row md:gap-6">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface-subtle font-semibold text-primary-foreground text-sm leading-5 md:size-12">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span
                aria-hidden="true"
                className={`w-px flex-1 bg-border md:h-px md:w-auto ${index === content.steps.length - 1 ? 'hidden md:block' : ''}`}
              />
            </div>
            <div className="flex flex-1 flex-col gap-3 pt-1.5 pb-8 text-base leading-6 md:flex-none md:pt-0 md:pr-7 md:pb-0">
              <h3 className="font-semibold text-primary-foreground">
                {step.title}
              </h3>
              <p className="text-text-secondary tracking-[-0.32px]">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
