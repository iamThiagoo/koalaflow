'use client';

import Image from 'next/image';
import { type CSSProperties, useId } from 'react';
import {
  positionOf,
  type SliderRange,
  sliderSteps,
  stepOf,
  stepTo,
} from '@/pricing';

const thumbs = {
  koala: '/landing/thumb-koala.png',
  play: '/landing/thumb-play.png',
} as const;

export function UsageSlider({
  label,
  value,
  range,
  onChange,
  display,
  tooltip,
  valueText,
  ticks,
  hint,
  thumb,
  disabled,
}: {
  label: string;
  value: number;
  range: SliderRange;
  onChange: (value: number) => void;
  display: string;
  tooltip: string;
  valueText: string;
  ticks: string[];
  hint: string;
  thumb: keyof typeof thumbs;
  disabled: boolean;
}) {
  const inputId = useId();
  const position = positionOf(value, range);
  const style = { '--p': position / sliderSteps } as CSSProperties;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <label
          htmlFor={inputId}
          className="font-semibold text-sm text-text-secondary leading-5"
        >
          {label}
        </label>
        <span className="font-bold text-[28px] text-text-primary leading-9 tracking-[-0.28px]">
          {display}
        </span>
      </div>
      <div className="relative h-23" style={style}>
        <div className="absolute inset-x-0 top-14.5 h-3 rounded-full bg-surface-muted" />
        <div className="absolute top-14.5 left-0 h-3 w-[calc(28px+(100%-56px)*var(--p))] rounded-full bg-primary" />
        <input
          id={inputId}
          type="range"
          min={0}
          max={sliderSteps}
          step={1}
          value={stepOf(value, range)}
          disabled={disabled}
          aria-valuetext={valueText}
          onChange={(event) =>
            onChange(stepTo(event.currentTarget.valueAsNumber, value, range))
          }
          className="usage-range peer absolute inset-x-0 top-9 z-10 h-14 w-full cursor-grab opacity-0 active:cursor-grabbing disabled:cursor-default"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-9 left-[calc(28px+(100%-56px)*var(--p))] size-14 -translate-x-1/2 rounded-full peer-focus-visible:outline-2 peer-focus-visible:outline-primary-strong peer-focus-visible:outline-offset-2"
        >
          <span className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary-foreground px-2.5 py-1 font-semibold text-white text-xs leading-4">
            {tooltip}
          </span>
          <Image
            src={thumbs[thumb]}
            alt=""
            width={56}
            height={56}
            className="size-14 rounded-full border-4 border-surface bg-surface shadow-[0_6px_16px_-4px_rgba(30,42,58,0.18)]"
          />
        </div>
      </div>
      <div
        aria-hidden="true"
        className="flex justify-between text-text-secondary text-xs leading-4"
      >
        {ticks.map((tick) => (
          <span key={tick}>{tick}</span>
        ))}
      </div>
      <p className="flex items-center gap-2 self-start rounded-full bg-primary-soft py-1.5 pr-3.5 pl-3 font-semibold text-[13px] text-primary-strong leading-5">
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          fill="none"
          className="size-4 shrink-0"
        >
          <path
            d="M1.5 6L8 3l6.5 3L8 9 1.5 6z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path
            d="M4 7.3V10.5c0 .9 1.8 2 4 2s4-1.1 4-2V7.3"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
        {hint}
      </p>
    </div>
  );
}
