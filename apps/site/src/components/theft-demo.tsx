'use client';

import Image from 'next/image';
import { useEffect, useId, useReducer, useState } from 'react';
import { ButtonLink } from '@/components/button-link';
import type { HomeContent } from '@/content/home';
import {
  copiedLinkOutcome,
  type DemoState,
  demoReducer,
  formatCountdown,
  initialDemoState,
  linkRemainingMs,
  type PlaybackOutcome,
  signedLinkUrl,
} from '@/theft-demo';

type DemoContent = HomeContent['protection']['demo'];

const actionButton =
  'inline-flex min-h-10 items-center justify-center rounded-full border border-border px-4 py-2 font-semibold text-primary-foreground text-sm leading-5 transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-primary-strong focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export function TheftDemo({
  cta,
  content,
  appUrl,
}: {
  cta: string;
  content: DemoContent;
  appUrl: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <details
      className="group flex w-full flex-col items-center"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="mx-auto flex h-12 w-full cursor-pointer list-none items-center justify-center gap-2 rounded-full bg-primary px-6 font-semibold text-base text-primary-foreground leading-6 transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-primary-strong focus-visible:outline-offset-2 md:w-fit [&::-webkit-details-marker]:hidden">
        {cta}
        <Image
          src="/landing/arrow-right.svg"
          alt=""
          width={20}
          height={20}
          className="size-5 transition-transform group-open:rotate-90 motion-reduce:transition-none"
        />
      </summary>
      <section
        aria-label={content.label}
        className="mx-auto mt-6 w-full max-w-170 rounded-3xl border border-border-card bg-surface p-4 text-left md:p-6"
      >
        {mounted && open ? (
          <InteractiveDemo content={content} appUrl={appUrl} />
        ) : (
          <StaticDemo content={content} appUrl={appUrl} />
        )}
      </section>
    </details>
  );
}

function StaticDemo({
  content,
  appUrl,
}: {
  content: DemoContent;
  appUrl: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-base text-text-body leading-6">
        {content.fallback.intro}
      </p>
      <ul className="flex flex-col gap-2">
        {content.fallback.outcomes.map((outcome) => (
          <li
            key={outcome}
            className="rounded-2xl bg-surface-subtle px-4 py-3 text-sm text-text-body leading-5"
          >
            {outcome}
          </li>
        ))}
      </ul>
      <ButtonLink href={appUrl} className="w-full md:w-auto md:self-start">
        {content.primaryCta}
      </ButtonLink>
    </div>
  );
}

function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

function InteractiveDemo({
  content,
  appUrl,
}: {
  content: DemoContent;
  appUrl: string;
}) {
  const now = useNow();
  const [state, dispatch] = useReducer(
    demoReducer,
    undefined,
    (): DemoState => initialDemoState(Date.now()),
  );
  const hosts = {
    authorizedHost: content.authorizedHost,
    otherHost: content.otherHost,
  };
  const remaining = linkRemainingMs(state, now);
  const expired = remaining === 0;
  const outcome = copiedLinkOutcome(state, now, hosts);
  const refused = outcome === 'blocked-domain' || outcome === 'expired';
  const host =
    state.scene === 'elsewhere' ? hosts.otherHost : hosts.authorizedHost;
  const linkId = useId();

  return (
    <div className="flex flex-col gap-4">
      <p className="text-base text-text-body leading-6">{content.intro}</p>

      <div className="overflow-hidden rounded-2xl border border-border-card">
        <div className="flex items-center gap-2 border-border-card border-b bg-surface-subtle px-3 py-2">
          <span aria-hidden="true" className="flex gap-1">
            <span className="size-2 rounded-full bg-border" />
            <span className="size-2 rounded-full bg-border" />
            <span className="size-2 rounded-full bg-border" />
          </span>
          <span className="flex-1 truncate rounded-full bg-surface px-3 py-1 text-text-secondary text-xs leading-4">
            {host}
          </span>
        </div>
        <Player
          key={`${state.scene}-${state.linkId}-${outcome ?? 'original'}`}
          outcome={outcome}
          content={content}
        />
      </div>

      <div className="flex flex-col gap-1 rounded-2xl bg-surface-subtle px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor={linkId}
            className="font-semibold text-primary-foreground text-xs leading-4"
          >
            {content.linkLabel}
          </label>
          <span className="flex items-center gap-2 text-text-secondary text-xs leading-4">
            {content.expiresIn}
            <span className="font-mono font-semibold text-primary-foreground tabular-nums">
              {formatCountdown(remaining)}
            </span>
            {expired ? (
              <span className="rounded-full bg-danger/10 px-2 py-0.5 font-semibold text-danger text-[11px]">
                {content.expiredBadge}
              </span>
            ) : null}
          </span>
        </div>
        <input
          id={linkId}
          readOnly
          value={signedLinkUrl(state)}
          className="w-full truncate bg-transparent font-mono text-text-secondary text-xs leading-5 outline-none"
        />
      </div>

      <div aria-live="polite" className="empty:hidden">
        {refused ? <Refusal outcome={outcome} content={content} /> : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {refused ? (
          <>
            <ButtonLink href={appUrl} size="sm">
              {content.primaryCta}
            </ButtonLink>
            <button
              type="button"
              className={actionButton}
              onClick={() => dispatch({ type: 'restart', now: Date.now() })}
            >
              {content.actions.restart}
            </button>
          </>
        ) : null}
        <button
          type="button"
          className={actionButton}
          disabled={state.scene === 'elsewhere'}
          onClick={() => dispatch({ type: 'paste-elsewhere' })}
        >
          {content.actions.pasteElsewhere}
        </button>
        <button
          type="button"
          className={actionButton}
          disabled={state.scene === 'reopened'}
          onClick={() => dispatch({ type: 'open-authorized' })}
        >
          {content.actions.openAuthorized}
        </button>
        <button
          type="button"
          className={actionButton}
          disabled={expired}
          onClick={() => dispatch({ type: 'skip-to-expiry' })}
        >
          {content.actions.skip}
        </button>
      </div>

      <p className="text-text-secondary text-xs leading-4">
        {content.simulationNote}
      </p>
    </div>
  );
}

function Player({
  outcome,
  content,
}: {
  outcome: PlaybackOutcome | null;
  content: DemoContent;
}) {
  const refused = outcome === 'blocked-domain' || outcome === 'expired';
  return (
    <div className="relative flex aspect-video animate-enter flex-col justify-between bg-dark-background p-4 text-dark-text-primary">
      {refused ? (
        <div className="m-auto flex max-w-80 flex-col items-center gap-3 text-center">
          <Image
            src="/landing/player-shield.svg"
            alt=""
            width={24}
            height={24}
            className="size-10 rounded-full bg-dark-surface-muted p-2"
          />
          <p className="font-semibold text-base leading-6">
            {outcome === 'blocked-domain'
              ? content.outcomes.blockedDomain.title
              : content.outcomes.expired.title}
          </p>
        </div>
      ) : (
        <>
          <span className="self-start rounded-full bg-primary px-2 py-0.5 font-semibold text-[11px] text-primary-foreground">
            {content.playing}
          </span>
          <Image
            src="/landing/player-play.svg"
            alt=""
            width={24}
            height={24}
            className="m-auto size-12"
          />
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-sm leading-5">
              {content.videoTitle}
            </p>
            <div className="h-1 overflow-hidden rounded-full bg-dark-surface-muted">
              <div className="h-full w-1/3 rounded-full bg-primary" />
            </div>
            {outcome === 'plays' ? (
              <p className="text-dark-text-secondary text-xs leading-4">
                {content.outcomes.plays.title} {content.outcomes.plays.body}
              </p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

function Refusal({
  outcome,
  content,
}: {
  outcome: PlaybackOutcome;
  content: DemoContent;
}) {
  const text =
    outcome === 'blocked-domain'
      ? content.outcomes.blockedDomain
      : content.outcomes.expired;
  return (
    <div className="rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3">
      <p className="font-semibold text-primary-foreground text-sm leading-5">
        {text.title}
      </p>
      <p className="text-sm text-text-secondary leading-5">{text.body}</p>
    </div>
  );
}
