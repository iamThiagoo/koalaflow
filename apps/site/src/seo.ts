import type { Metadata, MetadataRoute } from 'next';
import { home } from '@/content/home';

/**
 * Rule: only public, indexable pages are listed; the not-found page never is.
 */
export const publicPaths = ['/'] as const;

export function buildHomeMetadata(siteUrl: string): Metadata {
  const { title, description } = home.metadata;
  const url = `${siteUrl}/`;
  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      siteName: 'Koalaflow',
      title,
      description,
      url,
      locale: 'pt_BR',
    },
  };
}

export function buildSitemap(siteUrl: string): MetadataRoute.Sitemap {
  return publicPaths.map((path) => ({ url: `${siteUrl}${path}` }));
}
