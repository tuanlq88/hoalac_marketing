import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { trackEvent, getGlobalProps, tagSession } from './track';
import { EVENTS } from './events';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

describe('trackEvent', () => {
  let gtagSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    gtagSpy = vi.fn();
    window.gtag = gtagSpy;
    window.dataLayer = [];
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    delete window.gtag;
    delete window.dataLayer;
  });

  it('calls gtag("event", name, props) with global props merged', () => {
    trackEvent(EVENTS.LEAD_FORM_OPEN, { trigger: 'intro_btn' });

    expect(gtagSpy).toHaveBeenCalledTimes(1);
    const [verb, name, payload] = gtagSpy.mock.calls[0];
    expect(verb).toBe('event');
    expect(name).toBe('lead_form_open');
    expect(payload).toMatchObject({
      trigger: 'intro_btn',
      device_type: expect.any(String),
      reader_history_count: 0,
      is_returning_visitor: false,
    });
  });

  it('does not throw if gtag is undefined', () => {
    delete window.gtag;
    expect(() => trackEvent(EVENTS.LEAD_FORM_VIEW, {})).not.toThrow();
  });

  it('does not throw if dataLayer is undefined', () => {
    delete window.gtag;
    delete window.dataLayer;
    expect(() => trackEvent(EVENTS.LEAD_FORM_VIEW, {})).not.toThrow();
  });
});

describe('getGlobalProps', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns 0 history count and not returning when localStorage empty', () => {
    const props = getGlobalProps();
    expect(props.reader_history_count).toBe(0);
    expect(props.is_returning_visitor).toBe(false);
    expect(props.top_pillar).toBe('');
  });

  it('reads reader_history count and is_returning_visitor', () => {
    localStorage.setItem('reader_history', JSON.stringify([
      { slug: 'a', pillar: 'phap-ly', title: 'A', ts: 1 },
      { slug: 'b', pillar: 'phap-ly', title: 'B', ts: 2 },
    ]));
    const props = getGlobalProps();
    expect(props.reader_history_count).toBe(2);
    expect(props.is_returning_visitor).toBe(true);
  });

  it('returns top_pillar from reader_interests', () => {
    localStorage.setItem('reader_interests', JSON.stringify({
      'phap-ly': 5,
      'quy-hoach': 2,
    }));
    const props = getGlobalProps();
    expect(props.top_pillar).toBe('phap-ly');
  });

  it('returns {} safely on JSON parse error', () => {
    localStorage.setItem('reader_history', '{not json');
    const props = getGlobalProps();
    expect(props.reader_history_count).toBe(0);
  });
});

describe('tagSession', () => {
  let claritySpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    claritySpy = vi.fn();
    vi.useFakeTimers();
    // Reset queue state by re-importing — vitest module cache makes this complex
    // Instead test via observable side effect on clarity
  });

  afterEach(() => {
    vi.useRealTimers();
    if (typeof window !== 'undefined') {
      // @ts-expect-error - cleanup
      delete window.clarity;
      // @ts-expect-error - cleanup
      delete window.__clarity_queue__;
    }
  });

  it('calls clarity("set", key, value) when clarity is ready', () => {
    // @ts-expect-error - test setup
    window.clarity = claritySpy;
    tagSession('form_outcome', 'opened');
    expect(claritySpy).toHaveBeenCalledWith('set', 'form_outcome', 'opened');
  });

  it('queues tag when clarity not ready, flushes when it becomes ready', () => {
    // @ts-expect-error - cleanup
    delete window.clarity;
    tagSession('form_outcome', 'opened');
    expect(claritySpy).not.toHaveBeenCalled();

    // @ts-expect-error - simulate clarity loading
    window.clarity = claritySpy;
    vi.advanceTimersByTime(600);
    expect(claritySpy).toHaveBeenCalledWith('set', 'form_outcome', 'opened');
  });

  it('does nothing on SSR', () => {
    // jsdom always has window; verify guard exists by stubbing
    const originalWindow = global.window;
    // @ts-expect-error - simulate SSR
    delete global.window;
    expect(() => tagSession('x', 'y')).not.toThrow();
    global.window = originalWindow;
  });
});

describe('kill switch', () => {
  let gtagSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    gtagSpy = vi.fn();
    window.gtag = gtagSpy;
    vi.stubEnv('PUBLIC_TRACKING_ENABLED', 'false');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete window.gtag;
  });

  it('trackEvent is a no-op when PUBLIC_TRACKING_ENABLED=false', () => {
    trackEvent(EVENTS.LEAD_FORM_VIEW, {});
    expect(gtagSpy).not.toHaveBeenCalled();
  });

  it('tagSession is a no-op when PUBLIC_TRACKING_ENABLED=false', () => {
    const claritySpy = vi.fn();
    // @ts-expect-error
    window.clarity = claritySpy;
    tagSession('form_outcome', 'opened');
    expect(claritySpy).not.toHaveBeenCalled();
    // @ts-expect-error
    delete window.clarity;
  });
});
