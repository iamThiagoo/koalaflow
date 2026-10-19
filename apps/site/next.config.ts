import type { NextConfig } from 'next';

/**
 * Rule: the site is a static export; nothing may depend on a runtime server.
 * Rule: trailing slashes emit <path>/index.html so static hosts serve pages as directory indexes.
 */
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
