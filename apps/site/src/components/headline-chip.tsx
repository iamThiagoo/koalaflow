'use client';

import Image from 'next/image';
import {
  type CSSProperties,
  useCallback,
  useId,
  useRef,
  useState,
} from 'react';
import { useDismiss } from '@/components/use-dismiss';

const tones = {
  brand: {
    text: 'text-text-kpi',
    chevron: '/landing/chevron-brand.svg',
    menuWidth: 'w-60',
  },
  domain: {
    text: 'text-primary-foreground',
    chevron: '/landing/chevron-info.svg',
    menuWidth: 'w-80',
  },
} as const;

function mobileFontSize(value: string): CSSProperties {
  return {
    '--chip-font': `clamp(16px, calc((100vw - 136px) / ${(value.length * 0.54).toFixed(2)}), 32px)`,
  } as CSSProperties;
}

export function HeadlineChip({
  label,
  options,
  tone,
  className = '',
}: {
  label: string;
  options: readonly string[];
  tone: keyof typeof tones;
  className?: string;
}) {
  const [value, setValue] = useState(options[0] ?? '');
  const [open, setOpen] = useState(false);
  const listId = useId();
  const rootRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const style = tones[tone];
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, rootRef, triggerRef);

  const select = (option: string) => {
    setValue(option);
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <span
      ref={rootRef}
      className={`relative inline-block max-w-full ${className}`}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${label}: ${value}`}
        onClick={() => setOpen((current) => !current)}
        style={mobileFontSize(value)}
        className={`inline-flex max-w-full items-center gap-2 whitespace-nowrap rounded-2xl bg-primary-soft px-4 text-left align-baseline font-bold text-(length:--chip-font) leading-10 tracking-[-2px] focus-visible:outline-2 focus-visible:outline-primary-strong focus-visible:outline-offset-2 md:text-[40px] md:leading-12 ${style.text}`}
      >
        <span aria-hidden="true">{value}</span>
        <Image
          src={style.chevron}
          alt=""
          width={20}
          height={20}
          className="size-5 shrink-0"
        />
      </button>
      <ul
        id={listId}
        aria-label={label}
        hidden={!open}
        className={`absolute top-12 left-0 z-30 rounded-2xl border border-border-card bg-surface py-2 text-left md:top-14 ${style.menuWidth}`}
      >
        {options.map((option) => (
          <li key={option}>
            <button
              type="button"
              aria-pressed={option === value}
              onClick={() => select(option)}
              className="flex h-10 w-full items-center whitespace-nowrap pl-4 font-normal text-base text-text-primary leading-6 tracking-normal transition-colors hover:bg-surface-subtle focus-visible:bg-surface-subtle focus-visible:outline-none"
            >
              {option}
            </button>
          </li>
        ))}
      </ul>
    </span>
  );
}
