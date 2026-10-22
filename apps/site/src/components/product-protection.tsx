import Image from 'next/image';
import type { CSSProperties } from 'react';
import { TheftDemo } from '@/components/theft-demo';
import type { HomeContent } from '@/content/home';
import { revealDelay } from '@/motion';

const icons: Record<string, string> = {
  lock: '/landing/icon-lock.webp',
  cloud: '/landing/icon-cloud.webp',
  code: '/landing/icon-code.webp',
  signal: '/landing/icon-signal.webp',
};

const u = (px: number) => `calc(${px} * var(--u))`;
const desktopArt = { '--u': 'min(1px, 100cqw / 1440)' } as CSSProperties;

export function ProductProtection({
  content,
  appUrl,
}: {
  content: HomeContent['protection'];
  appUrl: string;
}) {
  return (
    <section
      id="produto"
      aria-labelledby="produto-title"
      className="@container relative overflow-hidden bg-surface pt-75 pb-16 lg:pt-62.5 lg:pb-20"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 hidden lg:block"
        style={{ ...desktopArt, height: u(600) }}
      >
        <Image
          src="/landing/hand-reaching.webp"
          alt=""
          width={1536}
          height={1024}
          data-reveal="left"
          className="absolute max-w-none"
          style={{ left: u(-60), top: u(60), width: u(700), height: u(467) }}
        />
        <Image
          src="/landing/koala-branch.webp"
          alt=""
          width={1536}
          height={1024}
          data-reveal="right"
          className="absolute max-w-none"
          style={{ right: u(-160), top: u(-10), width: u(900), height: u(600) }}
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-80 lg:hidden"
      >
        <Image
          src="/landing/hand-reaching.webp"
          alt=""
          width={1536}
          height={1024}
          data-reveal="left"
          className="absolute top-10 left-[-110px] h-65 w-97.5 max-w-none"
        />
        <Image
          src="/landing/koala-branch.webp"
          alt=""
          width={1536}
          height={1024}
          data-reveal="right"
          className="absolute top-[-10px] right-[-120px] h-80 w-120 max-w-none"
        />
      </div>

      <div className="relative mx-auto flex max-w-324 flex-col items-center gap-8 px-6 text-center lg:gap-12 lg:px-10">
        <div data-reveal className="flex flex-col items-center gap-1">
          <h2
            id="produto-title"
            className="flex flex-col items-center font-bold"
          >
            <span className="text-[44px] text-primary-strong leading-12 tracking-[-1.8px] lg:text-[52px] lg:leading-14 xl:text-[64px] xl:leading-17 xl:tracking-[-2.6px]">
              {content.claim}
            </span>{' '}
            <span className="max-w-86 text-[26px] text-text-primary leading-8 tracking-[-1px] lg:max-w-none lg:text-4xl lg:leading-11 lg:tracking-[-1.6px] xl:text-[40px] xl:leading-12 xl:tracking-[-2px]">
              {content.claimTail}
            </span>
          </h2>
          <p className="mt-4 max-w-86 text-base text-text-secondary leading-6 lg:max-w-160 lg:text-xl lg:leading-8">
            {content.subtitle.map((line) => (
              <span key={line} className="lg:block">
                {line}{' '}
              </span>
            ))}
          </p>
        </div>

        <ul className="grid w-full max-w-264 gap-3 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {content.items.map((item, index) => (
            <li key={item.icon} data-reveal style={revealDelay(index)}>
              <div
                data-tilt
                className="flex h-full items-center gap-4 rounded-3xl border border-border-card bg-surface px-5 py-3 text-left lg:flex-col lg:justify-center lg:px-6 lg:py-8 lg:text-center"
              >
                <Image
                  src={icons[item.icon]}
                  alt=""
                  width={256}
                  height={256}
                  className="size-14 shrink-0 lg:size-20"
                />
                <p className="text-base text-primary-foreground leading-6 lg:font-medium lg:tracking-[-0.2px]">
                  {item.text}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div
          data-reveal
          style={revealDelay(content.items.length)}
          className="flex w-full flex-col items-center gap-3"
        >
          <TheftDemo cta={content.cta} content={content.demo} appUrl={appUrl} />
          <p className="text-sm text-text-secondary leading-5">
            <strong className="font-semibold text-text-body">
              {content.microcopyStrong}
            </strong>
            {content.microcopy}
          </p>
        </div>
      </div>
    </section>
  );
}
