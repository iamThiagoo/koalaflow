import type { SiteConfig } from '@/config';

/**
 * A link destination: an app or contact URL resolved from the build config, or an in-page anchor.
 */
export type LinkTarget = 'app' | 'sales' | 'support' | `#${string}`;

export interface LinkContext {
  config: Pick<SiteConfig, 'appUrl' | 'salesContactUrl'>;
  supportEmail: string;
}

/**
 * Rule: app and sales links come from the build config so every environment points to its own app.
 * Rule: support links open the support mailbox.
 * Rule: anchors stay relative so they work on any origin.
 */
export function resolveHref(target: LinkTarget, context: LinkContext): string {
  switch (target) {
    case 'app':
      return context.config.appUrl;
    case 'sales':
      return context.config.salesContactUrl;
    case 'support':
      return `mailto:${context.supportEmail}`;
    default:
      return target;
  }
}
