import { topology } from '@noduct/tool-runtime';
import { publicSupport } from '@noduct/design-system/shell/support';

export const siteConfig = {
  name: 'Noduct',
  tagline: 'Free Online Tools',
  /** URL absoluta do hub, derivada da topologia (ADR 0005). */
  url: topology.hubUrl(),
  contactUrl: '',
  contactEmail: '',
  support: publicSupport,
  sponsor: {
    commercialMode: 'prelaunch' as const,
    monthlyPriceUsd: 10,
    paypalSubscriptionUrl: ''
  }
};
