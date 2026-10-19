import type { ReactNode } from 'react';
import type { HomeContent } from '@/content/home';

const iconPaths: ReactNode[] = [
  <path
    key="lock"
    d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z"
  />,
  <path
    key="globe"
    d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.5-2.5 3.5-5.5 3.5-9S14.5 5.5 12 3m0 18c-2.5-2.5-3.5-5.5-3.5-9S9.5 5.5 12 3M3.5 9h17M3.5 15h17"
  />,
  <path key="signal" d="M4 20v-4M9 20v-8M14 20V8M19 20V4" />,
  <path
    key="upload"
    d="M12 16V4m0 0-4 4m4-4 4 4M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"
  />,
];

export function Highlights({
  content,
}: {
  content: HomeContent['highlights'];
}) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="text-center font-bold text-3xl text-ink-950 tracking-tight">
        {content.title}
      </h2>
      <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {content.items.map((item, index) => (
          <li
            key={item.title}
            className="rounded-card border border-ink-100 bg-white p-6 shadow-sm"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-10 rounded-control bg-brand-50 p-2 text-brand-600"
            >
              {iconPaths[index % iconPaths.length]}
            </svg>
            <h3 className="mt-5 font-semibold text-ink-950">{item.title}</h3>
            <p className="mt-2 text-ink-600 text-sm leading-relaxed">
              {item.description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
