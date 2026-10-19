import type { HomeContent } from '@/content/home';

export function HowItWorks({
  content,
}: {
  content: HomeContent['howItWorks'];
}) {
  return (
    <section className="bg-ink-50">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-center font-bold text-3xl text-ink-950 tracking-tight">
          {content.title}
        </h2>
        <ol className="mt-14 grid gap-10 sm:grid-cols-3">
          {content.steps.map((step, index) => (
            <li key={step.title} className="text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-600 font-bold text-lg text-white">
                {index + 1}
              </span>
              <h3 className="mt-5 font-semibold text-ink-950 text-lg">
                {step.title}
              </h3>
              <p className="mt-2 text-ink-600">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
