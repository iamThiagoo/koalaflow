export interface SiteConfig {
  siteUrl: string;
  appUrl: string;
  salesContactUrl: string;
}

type Env = Record<string, string | undefined>;

type VariableName = 'SITE_URL' | 'APP_URL' | 'SALES_CONTACT_URL';

/**
 * Rule: values come from the environment (`apps/site/.env` locally, repository variables in CI).
 * Rule: an unset or empty variable fails the build; there are no hardcoded defaults.
 * Rule: an invalid URL fails the build instead of publishing broken links.
 * Rule: URLs are stored without a trailing slash so paths can be appended safely.
 */
function readUrl(
  env: Env,
  name: VariableName,
  protocols: readonly string[],
): string {
  const raw = env[name]?.trim();
  if (!raw) {
    throw new Error(
      `${name} is not set; copy apps/site/.env.example to apps/site/.env`,
    );
  }
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
