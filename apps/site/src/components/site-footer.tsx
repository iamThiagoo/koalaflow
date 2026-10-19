import { Logo } from '@/components/logo';
import type { HomeContent } from '@/content/home';

export function SiteFooter({ content }: { content: HomeContent['footer'] }) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-ink-100 border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-ink-500 text-sm sm:flex-row">
        <div className="flex items-center gap-3">
          <Logo />
          <span>{content.tagline}</span>
        </div>
        <p>
          © {year} Koalaflow. {content.rights}
        </p>
      </div>
    </footer>
  );
}
