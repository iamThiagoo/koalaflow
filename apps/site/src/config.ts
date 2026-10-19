export interface SiteConfig {
  siteUrl: string;
  appUrl: string;
  salesContactUrl: string;
}

type Env = Record<string, string | undefined>;

const defaults = {
  SITE_URL: 'https://koalaflow.com',
  APP_URL: 'https://app.koalaflow.com',
  SALES_CONTACT_URL: 'mailto:sales@koalaflow.com',
} as const;

/**
 * Rule: an unset or empty variable falls back to the production default.
 * Rule: an invalid URL fails the build instead of publishing broken links.
 * Rule: URLs are stored without a trailing slash so paths can be appended safely.
 */
function readUrl(
  env: Env,
  name: keyof typeof defaults,
  protocols: readonly string[],
): string {
  const raw = env[name]?.trim() || defaults[name];
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`${name} is not a valid URL: "${raw}"`);
  }
  if (!protocols.includes(url.protocol)) {
    throw new Error(
      `${name} must use ${protocols.join(' or ')}, got "${url.protocol}"`,
    );
  }
  return url.href.replace(/\/+$/, '');
}

export function parseSiteConfig(env: Env): SiteConfig {
  const web = ['https:', 'http:'];
  return {
    siteUrl: readUrl(env, 'SITE_URL', web),
    appUrl: readUrl(env, 'APP_URL', web),
    salesContactUrl: readUrl(env, 'SALES_CONTACT_URL', [...web, 'mailto:']),
  };
}

export const siteConfig: SiteConfig = parseSiteConfig(process.env);
