import { type CSSProperties, Fragment } from 'react';

interface Entrance {
  duration?: number;
  x?: number;
  y?: number;
  scale?: number;
  pop?: boolean;
}

export function enter(
  delay: number,
  { duration = 600, x = 0, y = 0, scale = 1, pop = false }: Entrance = {},
): CSSProperties {
  return {
    '--enter-delay': `${delay}ms`,
    '--enter-duration': `${duration}ms`,
    '--enter-x': `${x}px`,
    '--enter-y': `${y}px`,
    '--enter-scale': scale,
    ...(pop && { '--enter-ease': 'var(--ease-pop)' }),
  } as CSSProperties;
}

export function Words({
  text,
  delay,
  step,
}: {
  text: string;
  delay: number;
  step: number;
}) {
  return text.split(' ').map((word, index) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: the words of a fixed text never reorder
    <Fragment key={index}>
      {index > 0 && ' '}
      <span
        className="inline-block animate-enter"
        style={enter(delay + index * step, { duration: 500, y: 12 })}
      >
        {word}
      </span>
    </Fragment>
  ));
}
