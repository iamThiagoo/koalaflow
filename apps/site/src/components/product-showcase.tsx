import Image from 'next/image';
import type { CSSProperties, ReactNode } from 'react';
import type { HomeContent } from '@/content/home';
import { enterDelay, heroEntrance } from '@/motion';

type Showcase = HomeContent['hero']['showcase'];

const u = (px: number) => `calc(${px} * var(--u))`;

function scale(designWidth: number): CSSProperties {
  return { '--u': `calc(100cqw / ${designWidth})` } as CSSProperties;
}

function Pill({
  left,
  top,
  delay,
  children,
}: {
  left: number;
  top: number;
  delay: number;
  children: ReactNode;
}) {
  return (
    <p
      className="absolute flex animate-enter items-center whitespace-nowrap rounded-full border border-border-card bg-surface text-text-secondary"
      style={{
        ...enterDelay(delay),
        left: u(left),
        top: u(top),
        height: u(40),
        paddingInline: u(20),
        fontSize: `max(11px, ${u(14)})`,
        lineHeight: u(20),
      }}
    >
      {children}
    </p>
  );
}

function Annotation({
  text,
  left,
  top,
  fontSize,
  lineHeight,
  rotate,
  arrowLeft,
  arrowTop,
}: {
  text: string;
  left: number;
  top: number;
  fontSize: number;
  lineHeight: number;
  rotate: number;
  arrowLeft: number;
  arrowTop: number;
}) {
  return (
    <>
      <p
        className="absolute origin-center animate-enter whitespace-nowrap font-hand text-primary-foreground"
        style={{
          ...enterDelay(heroEntrance.annotation),
          left: u(left),
          top: u(top),
          fontSize: u(fontSize),
          lineHeight: u(lineHeight),
          rotate: `${rotate}deg`,
        }}
      >
        {text}
      </p>
      <Image
        src="/landing/hand-arrow.svg"
        alt=""
        width={72}
        height={64}
        className="absolute max-w-none animate-enter"
        style={{
          ...enterDelay(heroEntrance.annotation),
          left: u(arrowLeft),
          top: u(arrowTop - 0.75),
          width: u(72.4779),
          height: u(63.731),
        }}
      />
    </>
  );
}

function Player({
  player,
  box,
  ratio,
  icons,
}: {
  player: Showcase['player'];
  box: { left: number; top: number; width: number; height: number };
  ratio: number;
  icons: { shield: string; play: string };
}) {
  const r = (px: number) => u(px * ratio);
  return (
    <div
      className="absolute flex animate-enter flex-col justify-between overflow-hidden border-dark-border border-solid bg-gradient-to-r from-primary-foreground to-dark-background"
      style={{
        ...enterDelay(heroEntrance.player),
        left: u(box.left),
        top: u(box.top),
        width: u(box.width),
        height: u(box.height),
        padding: r(28),
        borderRadius: r(24),
        borderWidth: r(1),
      }}
    >
      <div className="flex items-start justify-between text-dark-text-primary">
        <p style={{ fontSize: r(12), lineHeight: r(16) }}>{player.series}</p>
        <Image
          src={icons.shield}
          alt=""
          width={24}
          height={24}
          className="max-w-none"
          style={{ width: r(24), height: r(24) }}
        />
      </div>
      <div className="flex items-center" style={{ gap: r(20) }}>
        <p
          className="flex-1 font-bold text-dark-text-primary"
          style={{
            fontSize: r(32),
            lineHeight: r(48),
            letterSpacing: r(-0.32),
          }}
        >
          {player.title}
        </p>
        <span
          className="flex shrink-0 items-center justify-center rounded-full border-dark-border border-solid"
          style={{ width: r(48), height: r(48), borderWidth: r(1) }}
        >
          <Image
            src={icons.play}
            alt=""
            width={24}
            height={24}
            className="max-w-none"
            style={{ width: r(24), height: r(24) }}
          />
        </span>
      </div>
      <div className="flex flex-col" style={{ gap: r(8) }}>
        <div className="flex bg-dark-surface-muted" style={{ height: r(3) }}>
          <div className="bg-dark-text-primary" style={{ width: r(62) }} />
        </div>
        <div
          className="flex justify-between whitespace-nowrap text-dark-text-secondary"
          style={{ fontSize: r(12), lineHeight: r(16) }}
        >
          <span>{player.time}</span>
          <span>{player.quality}</span>
        </div>
      </div>
    </div>
  );
}

export function ProductShowcase({ content }: { content: Showcase }) {
  const { pills } = content;
  return (
    <>
      <div
        className="@container mx-auto mt-14 hidden w-[min(1040px,calc(100%-112px))] animate-enter md:block"
        style={enterDelay(heroEntrance.showcase)}
      >
        <div className="relative" style={{ ...scale(1040), height: u(567) }}>
          <div
            className="absolute inset-x-0 top-0 border border-white/80 bg-white/45"
            style={{ height: u(760), borderRadius: u(32) }}
          >
            <Image
              src="/landing/dashboard-desktop.png"
              alt={content.dashboardAlt}
              loading="eager"
              width={1440}
              height={1024}
              className="absolute max-w-none object-contain"
              style={{
                left: u(11),
                top: u(11),
                width: u(1016),
                height: u(736),
                borderRadius: u(24),
              }}
            />
            <Pill left={-41} top={-17} delay={heroEntrance.pills[0]}>
              {pills.format}
            </Pill>
            <Pill left={799} top={89} delay={heroEntrance.pills[1]}>
              {pills.domain}
            </Pill>
            <Pill left={-31} top={367} delay={heroEntrance.pills[2]}>
              {pills.expiry}
            </Pill>
            <Pill left={909} top={134} delay={heroEntrance.pills[3]}>
              {pills.processing}
            </Pill>
            <Annotation
              text={content.annotation}
              left={717.6}
              top={-48}
              fontSize={26}
              lineHeight={32}
              rotate={4}
              arrowLeft={994}
              arrowTop={-25}
            />
            <Player
              player={content.player}
              box={{ left: 519, top: 147, width: 560, height: 315 }}
              ratio={1}
              icons={{
                shield: '/landing/player-shield.svg',
                play: '/landing/player-play.svg',
              }}
            />
          </div>
        </div>
      </div>

      <div
        className="@container mx-auto mt-14 w-[calc(100%-16px)] animate-enter md:hidden"
        style={enterDelay(heroEntrance.showcase)}
      >
        <div className="relative" style={{ ...scale(358), height: u(571) }}>
          <div
            className="absolute inset-x-0 top-0 border border-white/80 bg-white/45"
            style={{ height: u(816), borderRadius: u(32) }}
          >
            <div
              className="absolute overflow-hidden"
              style={{
                left: u(11),
                top: u(11),
                width: u(334),
                height: u(792),
                borderRadius: u(24),
              }}
            >
              <Image
                src="/landing/dashboard-mobile.png"
                alt={content.dashboardAlt}
                loading="eager"
                width={390}
                height={844}
                className="absolute inset-0 size-full max-w-none object-contain"
              />
              <Player
                player={content.player}
                box={{ left: 16, top: 310, width: 302, height: 169.875 }}
                ratio={302 / 560}
                icons={{
                  shield: '/landing/player-shield-sm.svg',
                  play: '/landing/player-play-sm.svg',
                }}
              />
            </div>
            <Pill left={1} top={-19} delay={heroEntrance.pills[0]}>
              {pills.format}
            </Pill>
            <Pill left={172} top={99} delay={heroEntrance.pills[1]}>
              {pills.domain}
            </Pill>
            <Pill left={-5} top={419} delay={heroEntrance.pills[2]}>
              {pills.expiry}
            </Pill>
            <Pill left={189} top={474} delay={heroEntrance.pills[3]}>
              {pills.processing}
            </Pill>
            <Annotation
              text={content.annotation}
              left={34.2}
              top={-47.3}
              fontSize={22}
              lineHeight={26}
              rotate={3}
              arrowLeft={277}
              arrowTop={-19}
            />
          </div>
        </div>
      </div>
    </>
  );
}
