# Lead Form Instrumentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add observation infrastructure (8 events + Clarity session tags) so we can replay-driven decide in 4 weeks whether to redesign the lead form.

**Architecture:** Single `track.ts` helper wraps existing GA4 (`gtag`) and Clarity APIs already loaded in `Layout.astro`. No new third-party scripts. Instrumentation calls inserted at lifecycle points in `LeadForm.astro`, blog page, and CTA components. Kill switch via env flag.

**Tech Stack:** Astro 4 + TypeScript. Vitest for unit tests on `track.ts`. GA4 + Microsoft Clarity (both pre-installed). No new runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-05-30-lead-form-instrumentation-design.md` (commit `844b44e`)

---

## File Map

**Create:**
- `src/lib/analytics/events.ts` — event name + outcome tag constants
- `src/lib/analytics/track.ts` — trackEvent, getGlobalProps, tagSession helper
- `src/lib/analytics/track.test.ts` — vitest unit tests
- `vitest.config.ts` — minimal test runner config
- `docs/superpowers/notes/lead-form-instrumentation-log.md` — pattern log scaffold

**Modify:**
- `package.json` — add vitest devDep + `test` script
- `.env.example` — add `PUBLIC_TRACKING_ENABLED`
- `src/components/LeadForm.astro` — add `placement` prop + 7 instrumentation points
- `src/pages/blog/[slug].astro` — `reader_milestone` event after localStorage update (~ line 304-313)
- `src/components/Hero.astro` — `cta_click` on hero anchor (line 35)
- `src/components/AdvisorCTA.astro` — `cta_click` on advisor anchor (line 28)
- `src/components/cta/variants/TofuCTA.astro` — pass `placement="article_tofu"` to LeadForm
- `src/components/cta/variants/MofuCTA.astro` — pass `placement="article_mofu"` to LeadForm
- `src/components/cta/variants/BofuCTA.astro` — pass `placement="article_bofu"` to LeadForm

**Spec deviation noted:** TofuCTA/MofuCTA/BofuCTA embed `<LeadForm>` directly with `deferDisplay={false}` — they don't have click buttons. They fire `lead_form_view` (with `placement=article_tofu/mofu/bofu`), NOT `cta_click`. `cta_click` only fires on actual anchors/buttons in Hero, AdvisorCTA, and floating CTA.

---

## Task 1: Setup vitest + create event constants

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/analytics/events.ts`
- Modify: `package.json`

- [ ] **Step 1: Install vitest as devDep**

Run:
```bash
npm install --save-dev vitest@^2.1.0 jsdom@^25.0.0
```

Expected: package.json updated with `vitest` and `jsdom` under devDependencies.

- [ ] **Step 2: Add test script to package.json**

Edit `package.json` `scripts` section. Add line after `"check"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Create events.ts constants**

Create `src/lib/analytics/events.ts`:

```ts
export const EVENTS = {
  LEAD_FORM_VIEW: 'lead_form_view',
  LEAD_FORM_OPEN: 'lead_form_open',
  LEAD_STEP_COMPLETE: 'lead_step_complete',
  LEAD_FORM_SUBMIT: 'lead_form_submit',
  LEAD_FORM_ABANDON: 'lead_form_abandon',
  PHONE_FIELD_INTERACT: 'phone_field_interact',
  CTA_CLICK: 'cta_click',
  READER_MILESTONE: 'reader_milestone',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

export const FORM_OUTCOME = {
  OPENED: 'opened',
  ABANDONED_AT_NAME: 'abandoned_at_name',
  ABANDONED_AT_INTENT: 'abandoned_at_intent',
  ABANDONED_AT_BUDGET: 'abandoned_at_budget',
  ABANDONED_AT_PRIORITY: 'abandoned_at_priority',
  ABANDONED_AT_CONTACT: 'abandoned_at_contact',
  SUBMITTED: 'submitted',
} as const;

export type FormOutcome = (typeof FORM_OUTCOME)[keyof typeof FORM_OUTCOME];
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx astro check`
Expected: No errors related to new files.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts package.json package-lock.json src/lib/analytics/events.ts
git commit -m "chore(analytics): add vitest + event name constants"
```

---

## Task 2: TDD `trackEvent` + `getGlobalProps`

**Files:**
- Create: `src/lib/analytics/track.test.ts`
- Create: `src/lib/analytics/track.ts`

- [ ] **Step 1: Write failing tests for trackEvent + getGlobalProps**

Create `src/lib/analytics/track.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `./track` cannot be resolved.

- [ ] **Step 3: Implement minimal track.ts**

Create `src/lib/analytics/track.ts`:

```ts
import { EVENTS, type EventName } from './events';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all 7 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics/track.ts src/lib/analytics/track.test.ts
git commit -m "feat(analytics): trackEvent + getGlobalProps with DEV warning"
```

---

## Task 3: TDD `tagSession` with Clarity queue

**Files:**
- Modify: `src/lib/analytics/track.test.ts`
- Modify: `src/lib/analytics/track.ts`

- [ ] **Step 1: Add failing tests for tagSession**

Append to `src/lib/analytics/track.test.ts`:

```ts
import { tagSession } from './track';

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
    // @ts-expect-error - cleanup
    delete window.clarity;
    // @ts-expect-error - cleanup
    delete window.__clarity_queue__;
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
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `npm test`
Expected: FAIL — `tagSession` is not exported.

- [ ] **Step 3: Implement tagSession with queue**

Append to `src/lib/analytics/track.ts`:

```ts
declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
    __clarity_queue__?: Array<[string, string]>;
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all tests green (including new tagSession tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics/track.ts src/lib/analytics/track.test.ts
git commit -m "feat(analytics): tagSession with Clarity ready-queue"
```

---

## Task 4: Add kill switch env flag

**Files:**
- Modify: `.env.example`
- Modify: `src/lib/analytics/track.test.ts`

- [ ] **Step 1: Add env flag to .env.example**

Edit `.env.example`, append:

```
PUBLIC_TRACKING_ENABLED=true
```

- [ ] **Step 2: Add failing test for kill switch behavior**

Append to `src/lib/analytics/track.test.ts`:

```ts
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
```

- [ ] **Step 3: Run tests to verify pass (implementation already supports flag)**

Run: `npm test`
Expected: PASS — kill switch code from Task 2 + 3 already honors flag.

- [ ] **Step 4: Commit**

```bash
git add .env.example src/lib/analytics/track.test.ts
git commit -m "feat(analytics): document PUBLIC_TRACKING_ENABLED kill switch"
```

---

## Task 5: LeadForm — add `placement` prop + view event

**Files:**
- Modify: `src/components/LeadForm.astro`

- [ ] **Step 1: Add `placement` prop to interface**

Edit `src/components/LeadForm.astro` lines 1-20. Replace the `Props` interface and destructure:

```ts
interface Props {
  headline?: string;
  description?: string;
  deferDisplay?: boolean;
  eyebrow?: string;
  formId?: string;
  showFloatingCta?: boolean;
  isGlobalFallback?: boolean;
  placement?: string;
}

const {
  headline = "Tìm góc nhìn phù hợp cho quyết định của bạn",
  description = "5 câu ngắn — nhận góc nhìn chiến lược và gợi ý khu vực phù hợp trong 24 giờ.",
  deferDisplay = true,
  eyebrow = "Phân tích chiến lược",
  formId = "lead-form",
  showFloatingCta = true,
  isGlobalFallback = false,
  placement,
} = Astro.props;
```

- [ ] **Step 2: Pass placement via data attribute to client script**

Edit the `<section>` opening tag (line 47-56), add `data-placement` attribute:

```astro
<section
  id={formId}
  class:list={["section-shell", "section-shell--lead", isGlobalFallback && "lead-shell--portal"]}
  data-lead-shell
  data-defer={String(deferDisplay)}
  data-endpoint={leadEndpoint}
  data-global={String(isGlobalFallback)}
  data-force-modal={String(isGlobalFallback)}
  data-floating-enabled={String(showFloatingCta)}
  data-placement={placement ?? ''}
>
```

- [ ] **Step 3: Add imports for analytics helpers**

Edit `src/components/LeadForm.astro` line ~640. Change the script tag opener from `<script type="module">` to `<script>` (Astro `<script>` defaults to module + bundled, supports `import`). Add 3 imports at top of script block, before the IIFE `(() => {`:

```astro
<script>
  import { trackEvent, tagSession, getGlobalProps } from '../lib/analytics/track';
  import { EVENTS, FORM_OUTCOME } from '../lib/analytics/events';

  (() => {
```

(All 3 helpers needed: `trackEvent` and `tagSession` immediately; `getGlobalProps` used in Task 10's beforeunload handler and Task 11's boot.)

- [ ] **Step 4: Compute placement value inside initLeadShell**

In `initLeadShell(shell)` function, after the existing setup near where `sourceInput` is configured (~line 708-717), add:

```ts
const placement = (shell.dataset.placement || inferPlacementFromPath()) ?? 'unknown';

function inferPlacementFromPath() {
  const path = window.location.pathname;
  if (path === '/' || path === '') return 'home_hero';
  if (path.startsWith('/blog/')) return 'end_of_article';
  return 'other';
}
```

- [ ] **Step 5: Add IntersectionObserver for lead_form_view, fires once**

In `initLeadShell(shell)`, after the placement code from Step 4, add:

```ts
let viewFired = false;
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !viewFired) {
        viewFired = true;
        trackEvent(EVENTS.LEAD_FORM_VIEW, {
          placement,
          source_page: window.location.pathname,
        });
        observer.disconnect();
      }
    });
  }, { threshold: 0.5 });
  observer.observe(shell);
}
```

- [ ] **Step 6: Verify in dev**

Run: `npm run dev`
Then open http://localhost:4321 in browser with Chrome DevTools open.
1. Install GA Debugger extension OR add `?gtm_debug=true` to URL.
2. Open Console + Network tab filter `google-analytics`.
3. Scroll to lead form section.
4. Expected: One `lead_form_view` event fires with `placement=home_hero` (or `end_of_article` on blog).

Also run: `npx astro check` → no type errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/LeadForm.astro
git commit -m "feat(leadform): track lead_form_view with placement"
```

---

## Task 6: LeadForm — open event + form_outcome:opened tag

**Files:**
- Modify: `src/components/LeadForm.astro`

- [ ] **Step 1: Capture page load timestamp for time_to_open_ms**

In `initLeadShell(shell)`, near top of the function (after placement code), add:

```ts
const pageLoadAt = performance.now();
let formOpenedAt: number | null = null;
```

- [ ] **Step 2: Fire lead_form_open in revealLeadCapture**

Find `revealLeadCapture` function (~line 824). Add tracking at the start of the function:

```ts
const revealLeadCapture = () => {
  if (formOpenedAt === null) {
    formOpenedAt = performance.now();
    trackEvent(EVENTS.LEAD_FORM_OPEN, {
      trigger: 'intro_btn',
      placement,
      time_to_open_ms: Math.round(formOpenedAt - pageLoadAt),
    });
    tagSession('form_outcome', FORM_OUTCOME.OPENED);
  }
  // ... existing code unchanged below
```

- [ ] **Step 3: Differentiate trigger source (intro vs floating vs anchor)**

The existing code wires multiple paths to `revealLeadCapture`. Refactor to thread `trigger` through.

Replace this block (lines ~877, ~884, ~927) so that each caller passes a trigger. Change `revealLeadCapture` signature to accept it:

```ts
const revealLeadCapture = (trigger = 'unknown') => {
  if (formOpenedAt === null) {
    formOpenedAt = performance.now();
    trackEvent(EVENTS.LEAD_FORM_OPEN, {
      trigger,
      placement,
      time_to_open_ms: Math.round(formOpenedAt - pageLoadAt),
    });
    tagSession('form_outcome', FORM_OUTCOME.OPENED);
  }
  // ... rest unchanged
};
```

Update call sites:
- `floatingCta.addEventListener('click', revealLeadCapture);` → `floatingCta.addEventListener('click', () => revealLeadCapture('floating_cta'));`
- `introBtn.addEventListener('click', revealLeadCapture);` → `introBtn.addEventListener('click', () => revealLeadCapture('intro_btn'));`
- Inside `attachAnchorReveal` the listener calls `revealLeadCapture();` → change to `revealLeadCapture('anchor');`

- [ ] **Step 4: Verify in dev**

Run: `npm run dev`. Open browser:
1. Click "Tìm góc nhìn phù hợp" button → expect `lead_form_open` with `trigger=intro_btn`
2. Scroll past 65% (on a long page) until floating CTA appears, click it → expect `lead_form_open` with `trigger=floating_cta` (only fires once per page load)
3. Open Clarity dashboard → recordings should soon show new session tagged `form_outcome=opened`

- [ ] **Step 5: Commit**

```bash
git add src/components/LeadForm.astro
git commit -m "feat(leadform): track lead_form_open with trigger source"
```

---

## Task 7: LeadForm — step_complete + outcome tagging per step

**Files:**
- Modify: `src/components/LeadForm.astro`

- [ ] **Step 1: Track step_complete inside setupSectionFlow's handleProgress**

Find `setupSectionFlow(form, fieldErrors)` function (~line 1327). Inside the `handleProgress(key)` callback (~line 1331), after the existing `completedSections.add(key)` line, add:

```ts
completedSections.add(key);
fieldErrors?.clear(key);

const value = getStepValue(key, form);
trackEvent(EVENTS.LEAD_STEP_COMPLETE, {
  step: key,
  value,
  step_index: SECTION_FLOW.indexOf(key) + 1,
  placement,
});

// Update form_outcome tag to "abandoned_at_<next_step>" — assumes they may abandon here next
const nextKey = getNextSectionKey(key);
if (nextKey) {
  const outcomeTag = `abandoned_at_${nextKey}`;
  tagSession('form_outcome', outcomeTag);
}
```

- [ ] **Step 2: Add getStepValue helper**

Add helper function inside the IIFE (near other utility functions, e.g., after `validateSection`):

```ts
function getStepValue(key, form) {
  switch (key) {
    case 'name':
      return form.querySelector('input[name="name"]')?.value ? 'provided' : 'skipped';
    case 'intent':
    case 'budgetRange':
    case 'priority':
      return form.querySelector(`input[name="${key}"]:checked`)?.value ?? '';
    case 'contact':
      return form.querySelector('input[name="contact"]')?.value ? 'provided' : '';
    default:
      return '';
  }
}
```

- [ ] **Step 3: Verify the single-key form_outcome approach**

Clarity `set` overwrites by key — last value wins. We use one key `form_outcome` that updates as user progresses:
- On form open (Task 6): `form_outcome = 'opened'`
- On each step complete (this task): `form_outcome = 'abandoned_at_<next>'` — i.e., "where they'd be stuck if they left now"
- On submit (Task 9): `form_outcome = 'submitted'` (overrides)
- On explicit abandon (Task 10): `form_outcome = 'abandoned_at_<last_completed_step>'`

So when reviewing a replay, the FINAL value of `form_outcome` tells us the user's terminal state. The current task's `tagSession` call achieves the "live progress" effect correctly.

- [ ] **Step 4: Verify in dev**

Run: `npm run dev`. Browser:
1. Open form, select intent → expect `lead_step_complete` with `step=intent`, `value=o_thuc` (or whatever)
2. Continue picking budget → expect `step=budgetRange`, etc.
3. Each selection should update Clarity `form_state` tag

- [ ] **Step 5: Commit**

```bash
git add src/components/LeadForm.astro
git commit -m "feat(leadform): track lead_step_complete + live form_state tag"
```

---

## Task 8: LeadForm — phone_field_interact

**Files:**
- Modify: `src/components/LeadForm.astro`

- [ ] **Step 1: Add phone focus listener inside initLeadShell**

In `initLeadShell(shell)`, after the existing intent listener block (~line 748), add:

```ts
let phoneInteractFired = false;
const contactInput = form.querySelector('input[name="contact"]');
if (contactInput) {
  contactInput.addEventListener('focus', () => {
    if (phoneInteractFired) return;
    phoneInteractFired = true;
    const now = performance.now();
    trackEvent(EVENTS.PHONE_FIELD_INTERACT, {
      time_to_focus_ms: formOpenedAt ? Math.round(now - formOpenedAt) : null,
      prev_steps_completed: SECTION_FLOW.slice(0, -1).filter((k) => isSectionComplete(k, form)).length,
      placement,
    });
  }, { once: true });
}
```

- [ ] **Step 2: Verify in dev**

Run: `npm run dev`. Browser:
1. Open form, fill 3 steps, click into phone field → expect `phone_field_interact` event fires once
2. Click out and back into phone → expect NO second event (fires once per session)

- [ ] **Step 3: Commit**

```bash
git add src/components/LeadForm.astro
git commit -m "feat(leadform): track phone_field_interact once per session"
```

---

## Task 9: LeadForm — submit event + final outcome tag

**Files:**
- Modify: `src/components/LeadForm.astro`

- [ ] **Step 1: Track submit success in submitLead**

Find `submitLead({ ...})` function (~line 1072). Inside the `if (response.ok)` block (~line 1180), after `setStatus?.(payloadMessage, 'success');` line, before `saveLeadPreferences(...)`, add:

```ts
trackEvent(EVENTS.LEAD_FORM_SUBMIT, {
  lead_tag: computedTag,
  intent: data.intent,
  budget: data.budgetRange,
  priority: data.priority,
  submit_count: submitCount,
  placement,
});
tagSession('form_outcome', FORM_OUTCOME.SUBMITTED);
tagSession('lead_tag', computedTag);
```

Note: `submitLead` doesn't have `placement` in scope. Either pass it through or read from `form.closest('[data-lead-shell]')?.dataset.placement`. Use the latter:

```ts
const placement = form.closest('[data-lead-shell]')?.dataset?.placement
  ?? (window.location.pathname.startsWith('/blog/') ? 'end_of_article' : 'home_hero');
```

Place this `const placement` line right above the `trackEvent` call.

- [ ] **Step 2: Verify in dev**

Run: `npm run dev`. Open form, fill all 5 steps with a valid phone, submit. Expect:
- `lead_form_submit` event in GA4 DebugView with `lead_tag`, `intent`, etc.
- Clarity session tagged `form_outcome=submitted`, `lead_tag=hot|warm|cold`

- [ ] **Step 3: Commit**

```bash
git add src/components/LeadForm.astro
git commit -m "feat(leadform): track lead_form_submit + final outcome tag"
```

---

## Task 10: LeadForm — abandon (closeModal + beforeunload + sendBeacon)

**Files:**
- Modify: `src/components/LeadForm.astro`

- [ ] **Step 1: Track abandon in closeModal**

Find `closeModal` function (~line 767). At the very start of the function (before existing logic), add:

```ts
const closeModal = (reason = 'close_btn') => {
  fireAbandonIfApplicable(reason);
  // ... existing code unchanged below
};
```

Then update overlay click and ESC handlers (~line 841, 844-847) to pass reason:
```ts
overlay?.addEventListener('click', () => closeModal('overlay_click'));
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeModal('esc');
});
```

And the close button(s) (~line 838-840):
```ts
closeControls.forEach((control) => {
  control.addEventListener('click', () => closeModal('close_btn'));
});
```

- [ ] **Step 2: Add fireAbandonIfApplicable helper inside initLeadShell**

Above `closeModal`, add:

```ts
let abandonFired = false;
function fireAbandonIfApplicable(reason) {
  if (abandonFired || formOpenedAt === null) return;
  // Don't fire if user already submitted (success path resets form but we don't want abandon then)
  if (shell.dataset.submitted === 'true') return;
  // Find last completed step
  const lastStep = SECTION_FLOW
    .slice()
    .reverse()
    .find((k) => isSectionComplete(k, form)) ?? 'none';
  trackEvent(EVENTS.LEAD_FORM_ABANDON, {
    last_step: lastStep,
    time_in_form_ms: Math.round(performance.now() - formOpenedAt),
    reason,
    placement,
  });
  tagSession('form_outcome', `abandoned_at_${lastStep === 'none' ? 'open' : lastStep}`);
  abandonFired = true;
}
```

- [ ] **Step 3: Mark submitted=true on success so abandon doesn't fire**

In submit success block (Task 9), after the trackEvent call add:
```ts
shell.dataset.submitted = 'true';
```

- [ ] **Step 4: Add beforeunload handler with sendBeacon**

Inside `initLeadShell`, near other event listeners (~line 848 area), add:

```ts
window.addEventListener('beforeunload', () => {
  if (formOpenedAt === null || abandonFired) return;
  if (shell.dataset.submitted === 'true') return;
  const lastStep = SECTION_FLOW
    .slice()
    .reverse()
    .find((k) => isSectionComplete(k, form)) ?? 'none';
  // Use sendBeacon for reliability during unload
  if (typeof navigator.sendBeacon === 'function' && window.dataLayer) {
    // Push to dataLayer so GA4 picks it up; gtag may not flush in time
    window.dataLayer.push({
      event: EVENTS.LEAD_FORM_ABANDON,
      last_step: lastStep,
      time_in_form_ms: Math.round(performance.now() - formOpenedAt),
      reason: 'page_leave',
      placement,
      ...getGlobalProps(),
    });
  }
  abandonFired = true;
});
```

Note: `getGlobalProps` import needed at top of script (already added in Task 5 Step 3).

- [ ] **Step 5: Verify in dev**

Run: `npm run dev`. Browser:
1. Open form, fill 2 steps, click close button → expect `lead_form_abandon` with `reason=close_btn`, `last_step=intent`
2. Open form, fill 0 steps, press ESC → expect `reason=esc`, `last_step=none`
3. Open form, fill all 5 → submit success → close → expect NO abandon event (submitted check)

- [ ] **Step 6: Commit**

```bash
git add src/components/LeadForm.astro
git commit -m "feat(leadform): track lead_form_abandon + final outcome tag"
```

---

## Task 11: LeadForm — top_pillar Clarity tag on page load

**Files:**
- Modify: `src/components/LeadForm.astro`

- [ ] **Step 1: Add top_pillar tag once at boot**

In the `boot` function (~line 680), wrap the shells loop:

```ts
const boot = () => {
  const props = getGlobalProps();
  if (props.top_pillar) {
    tagSession('top_pillar', String(props.top_pillar));
  }
  const shells = Array.from(document.querySelectorAll('[data-lead-shell]'));
  shells.forEach((shell) => initLeadShell(shell));
};
```

- [ ] **Step 2: Verify in dev**

Run: `npm run dev`. Browser:
1. Read 3+ blog posts (triggers reader_interests update)
2. Reload home page
3. Open Clarity → recordings → expect `top_pillar` tag on this session

- [ ] **Step 3: Commit**

```bash
git add src/components/LeadForm.astro
git commit -m "feat(leadform): tag Clarity session with top_pillar at boot"
```

---

## Task 12: Blog page — reader_milestone event

**Files:**
- Modify: `src/pages/blog/[slug].astro`

- [ ] **Step 1: Import trackEvent in the blog page script**

Find the `<script>` block in `src/pages/blog/[slug].astro` containing the reader_history logic. At the top of that script block, add:

```ts
import { trackEvent } from '../../lib/analytics/track';
import { EVENTS } from '../../lib/analytics/events';
```

(track.ts chunk is already loaded on blog pages via embedded LeadForm in MofuCTA, so zero marginal cost.)

- [ ] **Step 2: Fire reader_milestone after localStorage update**

Replace the existing block at `src/pages/blog/[slug].astro:304-313` with:

```ts
try {
  const readings = JSON.parse(localStorage.getItem('reader_history') || '[]');
  if (readings.some(r => r.slug === slug)) return;
  readings.unshift({ slug, pillar, title, ts: Date.now() });
  if (readings.length > 50) readings.length = 50;
  localStorage.setItem('reader_history', JSON.stringify(readings));

  const interests = JSON.parse(localStorage.getItem('reader_interests') || '{}');
  interests[pillar] = (interests[pillar] || 0) + 1;
  localStorage.setItem('reader_interests', JSON.stringify(interests));

  const milestones = [3, 5, 10];
  if (milestones.includes(readings.length)) {
    const topPillar = Object.entries(interests)
      .filter(([k]) => !k.startsWith('_'))
      .sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] ?? '';
    trackEvent(EVENTS.READER_MILESTONE, {
      count: readings.length,
      top_pillar: topPillar,
    });
  }
} catch {}
```

Using `trackEvent` (not inline gtag) keeps kill switch + DEV warning consistent.

- [ ] **Step 3: Verify in dev**

Run: `npm run dev`. Browser:
1. Clear localStorage
2. Visit 3 different blog posts (each in its own tab works)
3. On the 3rd article, expect `reader_milestone` event in GA4 DebugView with `count=3`
4. Visit 2 more (5 total) → expect `count=5`

- [ ] **Step 4: Commit**

```bash
git add src/pages/blog/[slug].astro
git commit -m "feat(blog): fire reader_milestone at 3/5/10 articles read"
```

---

## Task 13: Hero + AdvisorCTA — cta_click on lead-form anchors

**Files:**
- Modify: `src/components/Hero.astro`
- Modify: `src/components/AdvisorCTA.astro`

- [ ] **Step 1: Add click tracking to Hero CTA**

Edit `src/components/Hero.astro`. The CTA is at line 35 (`<a href="#lead-form" class="hero__cta hero__cta--ghost">Tìm góc nhìn phù hợp</a>`). Add `data-cta-variant` attribute:

```astro
<a href="#lead-form" class="hero__cta hero__cta--ghost" data-cta-variant="hero">Tìm góc nhìn phù hợp</a>
```

At the bottom of Hero.astro, add a `<script>` block:

```astro
<script>
  import { trackEvent } from '../lib/analytics/track';
  import { EVENTS } from '../lib/analytics/events';

  document.querySelectorAll('[data-cta-variant]').forEach((el) => {
    el.addEventListener('click', () => {
      trackEvent(EVENTS.CTA_CLICK, {
        cta_variant: el.getAttribute('data-cta-variant') ?? 'unknown',
        source_page: window.location.pathname,
      });
    });
  });
</script>
```

If Hero already has other CTAs (check for other `hero__cta` instances), tag them too with `data-cta-variant="hero_primary"` etc.

- [ ] **Step 2: Add click tracking to AdvisorCTA**

Edit `src/components/AdvisorCTA.astro` line 28. Add `data-cta-variant="advisor"`:

```astro
<a class="service-cta__btn" href="#lead-form" data-cta-variant="advisor">
```

Append a `<script>` block at the bottom:

```astro
<script>
  import { trackEvent } from '../lib/analytics/track';
  import { EVENTS } from '../lib/analytics/events';

  document.querySelectorAll('.service-cta__btn[data-cta-variant]').forEach((el) => {
    el.addEventListener('click', () => {
      trackEvent(EVENTS.CTA_CLICK, {
        cta_variant: el.getAttribute('data-cta-variant') ?? 'unknown',
        source_page: window.location.pathname,
      });
    });
  });
</script>
```

- [ ] **Step 3: Verify in dev**

Run: `npm run dev`. Browser:
1. Click Hero CTA → expect `cta_click` with `cta_variant=hero` in GA4 DebugView
2. Navigate to a page with AdvisorCTA, click → expect `cta_variant=advisor`
3. Run `npx astro check` → no type errors

- [ ] **Step 4: Commit**

```bash
git add src/components/Hero.astro src/components/AdvisorCTA.astro
git commit -m "feat(cta): track cta_click on Hero and AdvisorCTA anchors"
```

---

## Task 14: CTA variants — pass placement prop to LeadForm

**Files:**
- Modify: `src/components/cta/variants/TofuCTA.astro`
- Modify: `src/components/cta/variants/MofuCTA.astro`
- Modify: `src/components/cta/variants/BofuCTA.astro`

- [ ] **Step 1: TofuCTA — add placement prop**

Edit `src/components/cta/variants/TofuCTA.astro` lines 16-22. Add `placement` prop:

```astro
<LeadForm
  eyebrow=""
  headline=""
  description=""
  deferDisplay={false}
  showFloatingCta={false}
  placement="article_tofu"
/>
```

- [ ] **Step 2: MofuCTA — same change**

Edit `src/components/cta/variants/MofuCTA.astro`. Locate the `<LeadForm` element and add `placement="article_mofu"`.

- [ ] **Step 3: BofuCTA — same change**

Edit `src/components/cta/variants/BofuCTA.astro`. Add `placement="article_bofu"`.

- [ ] **Step 4: Verify in dev**

Run: `npm run dev`. Browser:
1. Open a blog post that uses MofuCTA (most do) — scroll to inline form
2. Expect `lead_form_view` event with `placement=article_mofu`

- [ ] **Step 5: Commit**

```bash
git add src/components/cta/variants/TofuCTA.astro src/components/cta/variants/MofuCTA.astro src/components/cta/variants/BofuCTA.astro
git commit -m "feat(cta): pass placement prop to embedded LeadForm"
```

---

## Task 15: Pattern log scaffold + verification checklist

**Files:**
- Create: `docs/superpowers/notes/lead-form-instrumentation-log.md`

- [ ] **Step 1: Create pattern log file**

Create `docs/superpowers/notes/lead-form-instrumentation-log.md`:

```markdown
# Lead Form Instrumentation — Pattern Log

**Spec:** `docs/superpowers/specs/2026-05-30-lead-form-instrumentation-design.md`
**Plan:** `docs/superpowers/plans/2026-05-30-lead-form-instrumentation.md`
**Ship date:** [fill]

## Weekly check-in log

### Week 1
- Day 1: [confirm events firing in GA4 Realtime]
- Day 2:
- Day 7:

### Week 2
### Week 3
### Week 4

## Replay observations

Format: `[YYYY-MM-DD] [form_outcome tag] — what user did`

Example: `[2026-06-03] abandoned_at_contact — filled 3 steps in 45s, paused 8s on phone, scrolled up to re-read description, closed modal`

- 

## End-of-period review

**Date:** [fill when triggered: 10 replays OR end of week 4]
**Total replays reviewed:**
**Total form_form_view events:** (from GA4)

### Funnel snapshot (GA4 Explore)
- view → open: __%
- open → step intent: __%
- intent → budget: __%
- budget → priority: __%
- priority → submit: __%

### Decision outcome (A/B/C/D from spec)
- [ ] **A.** Phone gate problem → next spec: Quiz mode tách phone
- [ ] **B.** Discovery problem → next spec: CTA redesign
- [ ] **C.** Step-before-phone problem → next spec: Reframe câu hỏi
- [ ] **D.** Insufficient data → extend 2-4 weeks

**Rationale:**

**Next spec to write:**
```

- [ ] **Step 2: Setup checklist (manual, not in code)**

Document in this file or a follow-up issue:
1. Open Clarity dashboard → Setup saved filters: "Form abandons", "Phone gate drops", "Successful leads", "Legal persona"
2. Open GA4 → Admin → Data Settings → Data Retention → set to 14 months
3. Install Tag Assistant Chrome extension for ongoing event debugging

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/notes/lead-form-instrumentation-log.md
git commit -m "docs(analytics): add lead form instrumentation pattern log scaffold"
```

---

## Task 16: Final verification — Lighthouse + smoke test all events

**Files:** none (verification only)

- [ ] **Step 1: Run all unit tests**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 2: Run TypeScript check**

Run: `npx astro check`
Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Build production bundle**

Run: `npm run build`
Expected: Build succeeds. Note the bundle size for analytics chunk.

- [ ] **Step 4: Lighthouse before/after comparison**

If main branch is clean baseline:
1. Check out `main`: `git stash && git checkout main`
2. Run `npm run build && npm run preview`
3. Open http://localhost:4321 in Chrome incognito, run Lighthouse (Performance only, Mobile preset). Record LCP, TBT, CLS.
4. Stash, return to branch: `git checkout - && git stash pop`
5. Run `npm run build && npm run preview` again
6. Re-run Lighthouse, compare numbers.

Expected: TBT delta <50ms, LCP/CLS unchanged.

- [ ] **Step 5: Smoke test all 8 events on dev**

Run `npm run dev`. With GA Debugger extension or `?gtm_debug=true`, walk through:

| Event | How to trigger | Expected payload |
|---|---|---|
| `lead_form_view` | Scroll to form on home page | `placement=home_hero` |
| `lead_form_open` | Click intro CTA | `trigger=intro_btn` |
| `lead_step_complete` × 4 | Pick intent, budget, priority, type phone | one event per step |
| `phone_field_interact` | Focus contact input | `time_to_focus_ms` numeric |
| `lead_form_submit` | Submit with valid phone | `lead_tag=hot/warm/cold` |
| `lead_form_abandon` | Open form, close before submit | `last_step`, `reason` |
| `cta_click` | Click Hero CTA | `cta_variant=hero` |
| `reader_milestone` | Read 3 blog posts | `count=3` |

- [ ] **Step 6: Verify Clarity session tags**

After smoke test, wait ~2 minutes. Open Clarity dashboard → Recordings → find your test session. Verify tags present:
- `form_outcome` = either `submitted` or `abandoned_at_*` based on path taken
- `lead_tag` = present if submitted
- `top_pillar` = present if visited blog posts first

- [ ] **Step 7: Open PR / merge**

```bash
git push -u origin <branch-name>
gh pr create --title "feat(analytics): lead form instrumentation" --body "$(cat <<'EOF'
## Summary
- Add `src/lib/analytics/track.ts` + `events.ts` helper for GA4 + Clarity
- Wire 8 events into LeadForm, blog page, Hero, AdvisorCTA
- Tag Clarity sessions for replay filtering (form_outcome, lead_tag, top_pillar)
- Add kill switch via `PUBLIC_TRACKING_ENABLED` env flag
- Pattern log scaffold for 4-week review

## Test plan
- [x] Unit tests pass (`npm test`)
- [x] Type check passes (`npx astro check`)
- [x] Manual smoke test all 8 events in GA4 DebugView
- [x] Clarity session tags appear after ~2 min delay
- [x] Lighthouse TBT delta <50ms

Spec: `docs/superpowers/specs/2026-05-30-lead-form-instrumentation-design.md`
EOF
)"
```

---

## Notes for the implementer

1. **`LeadForm.astro` is large (~1500 lines).** Edits are insertions only — don't refactor existing logic. If you find yourself wanting to clean up, resist; this PR is instrumentation-only.

2. **Astro `<script>` tags.** Astro auto-bundles `<script>` blocks. Using `import` inside them works (Astro processes via Vite). The existing `<script type="module">` IIFE in LeadForm uses no imports — we're switching to imports in Task 5. If `import` syntax errors at runtime, fall back to inlining the trackEvent function as a helper at top of the IIFE.

3. **gtag DebugView access.** To see events in real-time in GA4, install the [Google Analytics Debugger Chrome extension](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) and turn it on. Then in GA4: Admin → DebugView. Events appear with ~3s delay.

4. **Clarity tags delay.** Tags don't appear immediately in Clarity dashboard — wait 2-5 min after session ends.

5. **TDD scope.** Only `track.ts` has vitest unit tests (it has branching logic worth testing). Astro components verified manually in browser via GA4 DebugView. This is intentional — DOM/integration tests for Astro are high-overhead with low marginal value here.

6. **Commit hygiene.** Each task = one commit. If verification fails mid-task, fix before committing — don't commit broken state.
