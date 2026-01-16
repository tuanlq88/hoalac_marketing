import type { CTAIntent, CTAFunnelStage, CTAKey, CTARule } from './types';

const INTENT = {
  INFORMATIONAL: 'informational' as CTAIntent,
  COMMERCIAL: 'commercial' as CTAIntent,
  TRANSACTIONAL: 'transactional' as CTAIntent
};

const FUNNEL = {
  TOFU: 'TOFU' as CTAFunnelStage,
  MOFU: 'MOFU' as CTAFunnelStage,
  BOFU: 'BOFU' as CTAFunnelStage
};

export const CTA_RULES: CTARule[] = [
  {
    intents: [INTENT.INFORMATIONAL],
    funnels: [FUNNEL.TOFU],
    variant: 'tofu'
  },
  {
    intents: [INTENT.INFORMATIONAL],
    funnels: [FUNNEL.MOFU],
    variant: 'mofu'
  },
  {
    intents: [INTENT.COMMERCIAL],
    funnels: [FUNNEL.MOFU],
    variant: 'mofu'
  },
  {
    intents: [INTENT.COMMERCIAL],
    funnels: [FUNNEL.BOFU],
    variant: 'bofu'
  },
  {
    intents: [INTENT.TRANSACTIONAL],
    funnels: [FUNNEL.MOFU, FUNNEL.BOFU],
    variant: 'bofu'
  }
];
