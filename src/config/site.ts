import { topology } from '@noduct/tool-runtime';

export const siteConfig = {
  name: 'Noduct',
  tagline: 'Free Online Tools',
  /** URL absoluta do hub, derivada da topologia (ADR 0005). */
  url: topology.hubUrl(),
  contactUrl: '',
  contactEmail: '',
  support: {
    enabled: true,
    provider: 'buy-me-a-coffee' as const,
    url: 'https://buymeacoffee.com/plajiw'
  },
  sponsor: {
    commercialMode: 'prelaunch' as const,
    monthlyPriceUsd: 10,
    paypalSubscriptionUrl: ''
  }
};
