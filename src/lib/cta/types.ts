export type CTAKey = 'tofu' | 'mofu' | 'bofu';

export type CTAIntent = 'informational' | 'commercial' | 'transactional';
export type CTAFunnelStage = 'TOFU' | 'MOFU' | 'BOFU';

export interface CTARule {
  intents: CTAIntent[];
  funnels: CTAFunnelStage[];
  variant: CTAKey;
}

export interface CTAResolveInput {
  intent?: string | null;
  funnel?: string | null;
  allowedCta?: string | null;
}
