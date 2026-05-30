import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { trackEvent, getGlobalProps } from './track';
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
