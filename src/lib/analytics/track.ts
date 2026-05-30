import { EVENTS, type EventName } from './events';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    clarity?: (...args: unknown[]) => void;
    __clarity_queue__?: Array<[string, string]>;
  }
}

type Props = Record<string, unknown>;

const KNOWN_EVENTS = new Set<string>(Object.values(EVENTS));

export function getGlobalProps(): Props {
  if (typeof window === 'undefined') return {};
  const props: Props = {
    device_type: getDeviceType(),
    reader_history_count: 0,
    top_pillar: '',
    is_returning_visitor: false,
    session_pageview_count: getSessionPageviewCount(),
  };
  try {
    const history = JSON.parse(localStorage.getItem('reader_history') || '[]');
    if (Array.isArray(history)) {
      props.reader_history_count = history.length;
      props.is_returning_visitor = history.length > 0;
    }
  } catch {}
  try {
    const interests = JSON.parse(localStorage.getItem('reader_interests') || '{}');
    const top = Object.entries(interests)
      .filter(([k]) => !k.startsWith('_'))
      .sort((a, b) => Number(b[1]) - Number(a[1]))[0];
    if (top) props.top_pillar = top[0];
  } catch {}
  return props;
}

export function trackEvent(name: EventName | string, props: Props = {}): void {
  if (typeof window === 'undefined') return;
  if (import.meta.env.PUBLIC_TRACKING_ENABLED === 'false') return;
  if (import.meta.env.DEV && !KNOWN_EVENTS.has(name)) {
    console.warn(`[analytics] Unknown event name: ${name}. Add to EVENTS in src/lib/analytics/events.ts`);
  }
  const payload = { ...getGlobalProps(), ...props };
  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, payload);
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: name, ...payload });
    }
  } catch (error) {
    if (import.meta.env.DEV) console.warn('[analytics] trackEvent error', error);
  }
}

function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown';
  const w = window.innerWidth;
  if (w < 640) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function getSessionPageviewCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const key = '__hl_session_pv__';
    const current = Number(sessionStorage.getItem(key) || '0');
    return current;
  } catch {
    return 0;
  }
}

const CLARITY_POLL_MAX = 5;
const CLARITY_POLL_INTERVAL_MS = 500;

export function tagSession(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  if (import.meta.env.PUBLIC_TRACKING_ENABLED === 'false') return;
  try {
    if (typeof window.clarity === 'function') {
      window.clarity('set', key, value);
      return;
    }
    window.__clarity_queue__ ??= [];
    window.__clarity_queue__.push([key, value]);
    pollClarityReady(0);
  } catch (error) {
    if (import.meta.env.DEV) console.warn('[analytics] tagSession error', error);
  }
}

function pollClarityReady(attempt: number): void {
  if (attempt >= CLARITY_POLL_MAX) return;
  setTimeout(() => {
    if (typeof window.clarity === 'function' && window.__clarity_queue__?.length) {
      const queue = window.__clarity_queue__.splice(0);
      queue.forEach(([k, v]) => {
        try { window.clarity!('set', k, v); } catch {}
      });
    } else if (window.__clarity_queue__?.length) {
      pollClarityReady(attempt + 1);
    }
  }, CLARITY_POLL_INTERVAL_MS);
}

export function bumpSessionPageview(): void {
  if (typeof window === 'undefined') return;
  try {
    const key = '__hl_session_pv__';
    const current = Number(sessionStorage.getItem(key) || '0');
    sessionStorage.setItem(key, String(current + 1));
  } catch {}
}
