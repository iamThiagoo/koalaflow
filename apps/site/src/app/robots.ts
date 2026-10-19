import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${siteConfig.siteUrl}/sitemap.xml`,
  };
}
