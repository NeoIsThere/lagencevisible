export const SITE_CONFIG = {
  brand: 'L’agence visible',
  baseline: 'Le site qui fait exister votre entreprise en ligne.',
  siteUrl: 'https://lagencevisible.com',
  email: 'contact@mail.lagencevisible.com',
  legal: {
    tradeName: 'L’agence visible',
    legalForm: 'Entrepreneur individuel',
    ownerName: 'Samuel LAVALLEE',
    address: 'Nice 06000',
    siren: '918 537 481',
    siret: '918 537 481 00031',
    rcsCity: 'Nice',
    publishingDirector: 'Samuel LAVALLEE',
    hostName: 'GitHub, Inc.',
    hostAddress: '88 Colin P. Kelly Jr. St., San Francisco, CA 94107, United States',
    hostWebsite: 'https://pages.github.com/',
    hostSupport: 'https://support.github.com/',
    emailProcessorName: 'Resend (Plus Five Five, Inc.)',
    emailProcessorPrivacyUrl: 'https://resend.com/legal/privacy-policy',
    emailProcessorDpaUrl: 'https://resend.com/legal/dpa',
  },
} as const;

declare global {
  interface Window {
    __SITE_CONFIG__?: { CONTACT_FORM_ENDPOINT?: string; OPERATOR_API_ORIGIN?: string };
  }
}

export function contactEndpoint(): string {
  return window.__SITE_CONFIG__?.CONTACT_FORM_ENDPOINT?.trim() ?? '';
}

export function operatorApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (typeof window === 'undefined') return path;
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
  const configured = window.__SITE_CONFIG__?.OPERATOR_API_ORIGIN?.trim().replace(/\/$/, '') || 'https://api.lagencevisible.com';
  return `${local ? '' : configured}${path.startsWith('/') ? path : `/${path}`}`;
}
