import Image from 'next/image';
import type { CSSProperties } from 'react';
import { ButtonLink } from '@/components/button-link';
import type { HomeContent } from '@/content/home';
import { revealDelay } from '@/motion';

/**
 * Rule: on desktop the illustration keeps the 1440px Figma composition and only shrinks below it.
 */
const u = (px: number) => `calc(${px} * var(--u))`;
const desktopArt = { '--u': 'min(1px, 100cqw / 1440)' } as CSSProperties;

function ArtImage({
  src,
  width,
  height,
  style,
  className = '',
  reveal,
  delay,
}: {
  src: string;
  width: number;
  height: number;
  style?: CSSProperties;
  className?: string;
  reveal: 'left' | 'right' | 'scale';
  delay: number;
}) {
  return (
    <Image
      src={src}
      alt=""
      width={width}
      height={height}
      data-reveal={reveal}
      className={`absolute max-w-none object-contain ${className}`}
      style={{ ...style, ...revealDelay(delay, 1) }}
    />
  );
}

/**
 * "Final invitation" (Figma 19:506 desktop, 19:520 mobile).
 */
export function FinalInvitation({
  content,
  appUrl,
}: {
  content: HomeContent['finalInvitation'];
  appUrl: string;
}) {
  return (
    <section
      aria-labelledby="final-invitation-title"
      className="@container relative overflow-hidden bg-gradient-to-b from-surface to-primary-soft pt-14 md:pt-22"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(49%_60%_at_50%_70%,rgba(134,220,79,0.42),rgba(134,220,79,0))]"
      />
      <div className="relative mx-auto flex max-w-[calc(820px+48px)] flex-col items-center gap-6 px-6 text-center">
        <h2
          data-reveal
          id="final-invitation-title"
          className="font-bold text-[40px] text-text-primary leading-12 tracking-[-2px]"
        >
          <span className="md:block">{content.title}</span>{' '}
          <span className="text-primary-strong md:block">
            {content.titleAccent}
          </span>
        </h2>
        <p
          data-reveal
          style={revealDelay(1)}
          className="max-w-140 text-base text-text-body leading-6 tracking-[-0.32px]"
        >
          {content.subtitle}
        </p>
        <div
          data-reveal
          style={revealDelay(2)}
          className="flex w-full flex-col items-center gap-3"
        >
          <ButtonLink href={appUrl} className="w-full md:w-auto">
            {content.primaryCta}
          </ButtonLink>
          <p className="text-text-body text-xs leading-4">
            {content.reassurance}
          </p>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="relative mx-auto hidden md:block"
        style={{
          ...desktopArt,
          width: u(1440),
          height: u(535),
          marginTop: u(-120),
        }}
      >
        <ArtImage
          reveal="left"
          delay={0}
          src="/landing/koala.png"
          width={1264}
          height={848}
          style={{ left: u(-145), top: u(40), width: u(1050), height: u(700) }}
        />
        <ArtImage
          reveal="right"
          delay={0}
          src="/landing/creator.png"
          width={1264}
          height={848}
          style={{ left: u(660), top: 0, width: u(1050), height: u(700) }}
        />
        <ArtImage
          reveal="scale"
          delay={240}
          src="/landing/play-button.png"
          width={1024}
          height={1024}
          style={{ left: u(615), top: u(180), width: u(210), height: u(210) }}
        />
      </div>

      <div
        aria-hidden="true"
        className="relative mt-8 h-65 overflow-hidden md:hidden"
      >
        <ArtImage
          reveal="left"
          delay={0}
          src="/landing/koala.png"
          width={1264}
          height={848}
          className="top-[-116px] left-[calc(50%-895px)] h-[733.333px] w-[1100px]"
        />
        <ArtImage
          reveal="right"
          delay={0}
          src="/landing/creator.png"
          width={1264}
          height={848}
          className="top-[-158px] left-[calc(50%-75px)] h-[733.333px] w-[1100px]"
        />
        <ArtImage
          reveal="scale"
          delay={240}
          src="/landing/play-button.png"
          width={1024}
          height={1024}
          className="top-[45px] left-[calc(50%-95px)] size-[190px]"
        />
      </div>
    </section>
  );
}
