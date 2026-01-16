import { CTA_RULES } from './ctaRules';
import type {
  CTAKey,
  CTAResolveInput,
  CTAIntent,
  CTAFunnelStage,
  CTARule
} from './types';

const CTA_ORDER: CTAKey[] = ['tofu', 'mofu', 'bofu'];
const CTA_WEIGHT = CTA_ORDER.reduce<Record<CTAKey, number>>((acc, key, index) => {
  acc[key] = index;
  return acc;
}, {} as Record<CTAKey, number>);

const INTENTS: CTAIntent[] = ['informational', 'commercial', 'transactional'];
const FUNNELS: CTAFunnelStage[] = ['TOFU', 'MOFU', 'BOFU'];

function normalizeCta(value?: string | null): CTAKey | null {
  if (!value) return null;
  const normalized = value.toLowerCase().trim();
  return CTA_ORDER.includes(normalized as CTAKey) ? (normalized as CTAKey) : null;
}

function normalizeIntent(value?: string | null): CTAIntent | null {
  if (!value) return null;
  const normalized = value.toLowerCase().trim();
  return INTENTS.includes(normalized as CTAIntent) ? (normalized as CTAIntent) : null;
}

function normalizeFunnel(value?: string | null): CTAFunnelStage | null {
  if (!value) return null;
  const normalized = value.toUpperCase().trim();
  return FUNNELS.includes(normalized as CTAFunnelStage) ? (normalized as CTAFunnelStage) : null;
}

function pickRule(intent: CTAIntent, funnel: CTAFunnelStage): CTARule | undefined {
  return CTA_RULES.find((rule) => rule.intents.includes(intent) && rule.funnels.includes(funnel));
}

function clampToAllowed(candidate: CTAKey, allowed: CTAKey): CTAKey {
  return CTA_WEIGHT[candidate] <= CTA_WEIGHT[allowed] ? candidate : allowed;
}

export function resolveCTA(input: CTAResolveInput): CTAKey | null {
  const allowed = normalizeCta(input.allowedCta);
  if (!allowed) {
    return null;
  }

  const intent = normalizeIntent(input.intent);
  const funnel = normalizeFunnel(input.funnel);
  if (!intent || !funnel) {
    return null;
  }

  const rule = pickRule(intent, funnel);
  if (!rule) {
    return null;
  }

  return clampToAllowed(rule.variant, allowed);
}
