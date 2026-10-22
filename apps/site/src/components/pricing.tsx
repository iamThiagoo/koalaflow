'use client';

import { useEffect, useId, useState } from 'react';
import { ButtonLink } from '@/components/button-link';
import { UsageSlider } from '@/components/usage-slider';
import type { HomeContent } from '@/content/home';
import {
  estimate,
  fill,
  fillCount,
  formatBrl,
  formatCompact,
  formatInteger,
  hoursRange,
  minutesRange,
  pricing,
  ticks,
} from '@/pricing';

function Check() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      className="size-4 shrink-0 text-primary"
    >
      <path
        d="M3.5 8.5l3 3 6-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Line({
  label,
  detail,
  amount,
  accent = false,
}: {
  label: string;
  detail: string;
  amount: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="flex flex-col">
        <span className="font-semibold text-dark-text-primary text-sm leading-5">
          {label}
        </span>
        <span className="text-dark-text-secondary text-xs leading-4">
          {detail}
        </span>
      </dt>
      <dd
        className={`font-semibold text-sm leading-5 ${accent ? 'text-primary' : 'text-dark-text-primary'}`}
      >
        {amount}
      </dd>
    </div>
  );
}

/**
 * "Quanto custa?" (Figma 116:1099 desktop, 116:1191 mobile): the interactive pricing calculator.
 * Rule: every number comes from the pricing module; this component only renders it.
 * Rule: the static HTML shows the default estimate; the sliders are enabled once the page hydrates.
 */
export function Pricing({
  content,
  appUrl,
  salesUrl,
}: {
  content: HomeContent['pricing'];
  appUrl: string;
  salesUrl: string;
}) {
  const [minutes, setMinutes] = useState(minutesRange.initial);
  const [hours, setHours] = useState(hoursRange.initial);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const titleId = useId();
  const result = estimate(minutes, hours);
  const { estimate: copy } = content;

  return (
    <section
      id={content.anchor}
      aria-labelledby={titleId}
      className="mx-auto max-w-324 px-6 py-16 md:px-10 md:py-30"
    >
      <div
        data-reveal
        className="flex flex-col gap-4 md:mx-auto md:max-w-140 md:items-center md:text-center"
      >
        <h2
          id={titleId}
          className="flex flex-col font-bold text-[32px] leading-10 tracking-[-0.32px] md:text-[40px] md:leading-12 md:tracking-[-2px]"
        >
          <span className="text-primary-strong">{content.titleAccent}</span>
          <span className="text-text-primary">{content.title}</span>
        </h2>
        <p className="text-base text-text-secondary leading-6 tracking-[-0.32px]">
          {content.subtitle}
        </p>
      </div>

      <div
        data-reveal
        className="mt-12 flex flex-col overflow-hidden rounded-[20px] border border-border-card bg-surface md:mt-14 lg:flex-row lg:rounded-[32px]"
      >
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-12 p-6 md:p-16">
          <UsageSlider
            label={content.minutes.label}
            value={minutes}
            range={minutesRange}
            onChange={setMinutes}
            display={fill(content.minutes.value, {
              value: formatCompact(minutes),
            })}
            tooltip={fill(content.minutes.tooltip, {
              value: formatInteger(minutes),
            })}
            valueText={fill(content.minutes.valueText, {
              value: formatCompact(minutes),
            })}
            ticks={ticks(minutesRange).map((tick) =>
              fill(content.minutes.tick, { value: formatCompact(tick) }),
            )}
            hint={fillCount(content.minutes.hint, result.students, {
              hours: pricing.minutesPerStudent / 60,
            })}
            thumb="koala"
            disabled={!ready}
          />
          <UsageSlider
            label={content.hours.label}
            value={hours}
            range={hoursRange}
            onChange={setHours}
            display={fill(content.hours.value, { value: formatCompact(hours) })}
            tooltip={fill(content.hours.tooltip, {
              value: formatInteger(hours),
            })}
            valueText={fill(content.hours.valueText, {
              value: formatInteger(hours),
            })}
            ticks={ticks(hoursRange).map((tick) =>
              fill(content.hours.tick, { value: formatCompact(tick) }),
            )}
            hint={fillCount(content.hours.hint, result.courses, {
              hours: pricing.hoursPerCourse,
            })}
            thumb="play"
            disabled={!ready}
          />
        </div>

        <div className="flex flex-col gap-6 bg-gradient-to-br from-primary-foreground to-dark-background p-8 md:p-12 lg:w-112 lg:shrink-0">
          <div className="flex flex-col gap-3">
            <p className="font-semibold text-dark-text-secondary text-sm leading-5">
              {copy.label}
            </p>
            <output
              aria-live="polite"
              className="flex items-baseline gap-2 text-white"
            >
              <span className="font-bold text-[56px] leading-14 tracking-[-2.8px]">
                {formatBrl(result.total)}
              </span>
              <span className="text-base text-dark-text-secondary leading-6">
                {copy.perMonth}
              </span>
            </output>
            <p className="self-start rounded-full bg-primary px-3 py-1.5 font-semibold text-primary-foreground text-sm leading-5">
              {fill(copy.perStudent, {
                value: formatBrl(result.perStudent, 2),
              })}
            </p>
          </div>

          <dl className="flex flex-col gap-3 border-dark-border border-y py-6">
            <Line
              label={copy.delivery}
              detail={fill(copy.deliveryDetail, {
                minutes: formatCompact(result.billableMinutes),
                price: formatBrl(pricing.pricePerMinute, 3),
              })}
              amount={formatBrl(result.delivery)}
            />
            <Line
              label={copy.storage}
              detail={fill(copy.storageDetail, {
                hours: formatInteger(hours),
                price: formatBrl(pricing.pricePerStoredHour, 2),
              })}
              amount={formatBrl(result.storage)}
            />
            <Line
              label={copy.allowance}
              detail={fill(copy.allowanceDetail, {
                minutes: formatInteger(pricing.freeMinutes),
              })}
              amount={formatBrl(0)}
              accent
            />
          </dl>

          <ul className="flex flex-col gap-2.5">
            {copy.included.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-dark-text-primary text-sm leading-5"
              >
                <Check />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-auto flex flex-col gap-4">
            <ButtonLink href={appUrl} className="w-full">
              {copy.primaryCta}
            </ButtonLink>
            <a
              href={salesUrl}
              className="text-center font-semibold text-dark-text-primary text-sm leading-5 transition-colors hover:text-primary"
            >
              {copy.salesCta} <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-text-secondary text-xs leading-4">
        {content.finePrint}
      </p>
    </section>
  );
}
