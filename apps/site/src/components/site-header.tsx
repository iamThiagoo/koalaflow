import { Logo } from '@/components/logo';
import type { HomeContent } from '@/content/home';

export function SiteHeader({
  content,
  appUrl,
}: {
  content: HomeContent['header'];
  appUrl: string;
}) {
  return (
    <header className="border-ink-100 border-b bg-white/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <a href="/" aria-label="Koalaflow">
          <Logo />
        </a>
        <a
          href={appUrl}
          className="font-semibold text-ink-700 text-sm hover:text-ink-950"
        >
          {content.signIn}
        </a>
      </div>
    </header>
  );
}
