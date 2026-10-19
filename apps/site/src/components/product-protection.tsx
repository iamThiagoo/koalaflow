import Image from 'next/image';
import type { HomeContent } from '@/content/home';
import { revealDelay } from '@/motion';

const icons: Record<string, string> = {
  shield: '/landing/icon-shield.svg',
  play: '/landing/icon-play.svg',
  upload: '/landing/icon-upload.svg',
};

/**
 * "Product protection" (Figma 17:2611 desktop, 17:2771 mobile).
 */
export function ProductProtection({
  content,
}: {
  content: HomeContent['protection'];
}) {
  return (
    <section
      id="produto"
      aria-labelledby="produto-title"
      className="mx-auto max-w-324 px-5 py-16 md:px-10 md:py-24"
    >
      <h2
        data-reveal
        id="produto-title"
        className="max-w-170 font-bold text-[32px] text-primary-foreground leading-12 tracking-[-0.32px] md:text-[40px] md:tracking-[-2px]"
      >
        {content.title}
      </h2>
      <ul className="mt-8 grid gap-4 md:mt-12 md:grid-cols-2 lg:grid-cols-4">
        {content.items.map((item, index) => (
          <li
            key={item.title}
            data-reveal
            style={revealDelay(index)}
            className="flex min-h-57 flex-col gap-6 rounded-3xl border border-border-card bg-surface p-[23px] md:min-h-70"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-surface-subtle">
              <Image
                src={icons[item.icon]}
                alt=""
                width={24}
                height={24}
                className="size-6"
              />
            </span>
            <div className="flex flex-col gap-3 text-base leading-6">
              <h3 className="font-normal text-primary-foreground">
                {item.title}
              </h3>
              <p className="text-text-secondary tracking-[-0.32px]">
                {item.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
