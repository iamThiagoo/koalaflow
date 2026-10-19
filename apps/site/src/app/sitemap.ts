import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config';
import { buildSitemap } from '@/seo';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap(siteConfig.siteUrl);
}
