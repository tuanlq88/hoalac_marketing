# Lead Form Instrumentation — Design Spec

**Date:** 2026-05-30
**Status:** Draft — pending implementation plan
**Owner:** Quoc Tuan Le

## Context & Problem

Site hiện có 1 lead form (`src/components/LeadForm.astro`) đặt ở cuối hero và cuối mỗi bài viết. Form đã có hạ tầng tốt: 5 step (name → intent → budget → priority → contact), tự compute lead score (hot/warm/cold), push qua Apps Script vào Google Sheet + Telegram, có floating CTA sau 65% scroll, có modal cho mobile.

Owner đánh giá UX "chưa được tự nhiên" và đang cân nhắc redesign theo hướng tách Quiz / lead magnet (theo gợi ý từ external review). Tuy nhiên **không có data thực tế** về:
- Bao nhiêu người thấy form, mở form, bỏ ở đâu
- Phone field có thật sự là pain point hay không
- CTA placement nào (hero / floating / cuối bài) convert tốt nhất
- Reader behavior trước khi engage với form

→ Mọi quyết định redesign hiện tại là **đoán**. Spec này build observation infrastructure để 4 tuần nữa có bằng chứng định tính ra quyết định.

## Goal & Non-Goals

### Goal
Trong 4 tuần, có đủ **bằng chứng định tính** (session replay) + **baseline event log** (GA4) để quyết định: (a) ship Quiz redesign tách phone, (b) ship CTA redesign, (c) ship copy redesign, hay (d) extend observation thêm 2-4 tuần.

### In scope
1. Định nghĩa event schema (8 events) cho funnel lead form
2. Thêm tracking code vào `LeadForm.astro`, blog page, CTA components
3. Tag Clarity sessions để filter replay nhanh
4. Document review process + decision framework cho 4 tuần
5. Build helper module để abstract sink (cho phép đổi tool sau)

### Out of scope
- Build Quiz tách phone (sẽ là spec sau, dựa trên insight)
- Heatmap page / Hồ sơ NĐT / Timeline (5 features GPT đề xuất)
- A/B testing framework (traffic chưa đủ)
- Custom dashboard (dùng GA4 + Clarity UI trực tiếp)
- Migrate `reader_history` / `reader_interests` localStorage sang sink ngoài
- Cookie consent banner (VN chưa enforce GDPR, accept risk)

## Key Decisions & Rationale

### Decision 1: Sink = GA4 + Clarity (KHÔNG thêm PostHog)
Site đã có Google Analytics 4 (`G-88662KFZ9N`) và Microsoft Clarity (`wxhnh70qb7`) cài sẵn trong `src/components/Layout.astro`. Clarity đã cung cấp session replay + heatmap unlimited free; GA4 đã cung cấp custom event + funnel report. PostHog không add giá trị đủ cho giai đoạn <50 visitor/tuần để justify script thứ 3 (~30KB) + account mới + consent complexity. Decision: dùng tool đã có.

### Decision 2: Replay-first, funnel-later
Traffic site ước chừng <50 visitor/tuần. Funnel chart cần ~100 sessions/tuần để có ý nghĩa thống kê → 2-3 tháng nữa mới trust được. Session replay chỉ cần 5-10 sessions là đủ qualitative pattern. Action sẽ dựa trên **xem replay** không phải **đọc funnel %**.

### Decision 3: Không cookie consent banner
VN chưa enforce GDPR/CCPA. Site BĐS VN gần như không có site nào có banner. Traffic quá thấp để chịu drop signal từ banner "Từ chối". Clarity mask input mặc định. Accept risk.

### Decision 4: Action threshold = 10 replays HOẶC 4 tuần, whichever first
10 replay là threshold tối thiểu để qualitative pattern lặp lại có ý nghĩa. 4 tuần là backstop để khỏi rơi vào "chờ mãi không hành động". Nếu traffic thấp đến mức 4 tuần chưa đạt 10 replay → có thể kéo thêm 2-4 tuần (outcome D trong decision framework).

## Event Schema

8 events total. Nguyên tắc: event ít, property nhiều.

### Funnel events (5)

| Event | Trigger | Properties |
|---|---|---|
| `lead_form_view` | Form section enter viewport (IntersectionObserver, threshold 0.5), fire 1 lần/session | `placement`, `source_page` |
| `lead_form_open` | User expand form / mở modal (intro CTA click, floating CTA click, anchor `#lead-form` click) | `trigger` (intro_btn / floating_cta / anchor), `placement`, `time_to_open_ms` |
| `lead_step_complete` | User hoàn thành 1 step trong sequential flow | `step` (name / intent / budget / priority / contact), `value` (enum value), `step_index` (1-5) |
| `lead_form_submit` | Server reply OK sau submit | `lead_tag` (hot/warm/cold), `intent`, `budget`, `priority`, `submit_count` |
| `lead_form_abandon` | Close modal / overlay click / ESC / page leave khi form đang mở mà chưa submit | `last_step`, `time_in_form_ms`, `reason` (close_btn / overlay_click / esc / page_leave) |

### Side events (3)

| Event | Trigger | Properties |
|---|---|---|
| `cta_click` | Click bất kỳ CTA nào dẫn về lead form | `cta_variant` (hero / floating / tofu / mofu / bofu / advisor / footer), `source_page`, `pillar` (nếu trên article) |
| `reader_milestone` | `reader_history` đạt 3, 5, hoặc 10 bài sau update | `count`, `top_pillar` |
| `phone_field_interact` | Focus đầu tiên vào field SĐT trong session | `time_to_focus_ms` (từ khi mở form), `prev_steps_completed` |

### Global properties (auto-attach mọi event)

- `device_type`: mobile / tablet / desktop
- `reader_history_count`: số bài đã đọc (từ localStorage)
- `top_pillar`: pillar đọc nhiều nhất
- `session_pageview_count`
- `is_returning_visitor`: có `reader_history` từ trước không

### Properties KHÔNG track (PII / noise)

- ❌ Value của field SĐT, name
- ❌ Mouse move / scroll position chi tiết (Clarity autocapture đã handle)
- ❌ Mọi click trên page (autocapture sẽ làm)
- ❌ Field-level validation errors (noise nhiều, chỉ care abandon point)

### Rationale 3 critical events

- **`phone_field_interact`** test trực tiếp hypothesis "phone gate là vấn đề". User hoàn thành 3 step trước nhưng `time_to_focus_ms` ngắn rồi abandon → đúng giả thuyết. Không bao giờ focus phone → giả thuyết sai.
- **`lead_form_abandon` + `last_step`** chỉ ra đoạn nào mất user — field quan trọng nhất để quyết redesign cái gì.
- **`time_to_open_ms` + `time_in_form_ms`** đo pace. Mở sau 5s, đóng sau 3s = impulsive click. Đọc 2 phút mới mở, điền 1 phút mới đóng = serious consideration thất bại.

## Architecture & Code Placement

### New files

**`src/lib/analytics/track.ts`** — Helper module, public API:

```ts
// Gửi event đến GA4, optionally tag Clarity session
trackEvent(name: string, props?: Record<string, unknown>): void

// Đọc localStorage để build global properties tự động kèm mọi event
getGlobalProps(): Record<string, unknown>

// Tag Clarity session để filter replay sau
tagSession(key: string, value: string): void
```

Behavior:
- SSR-safe (check `typeof window === 'undefined'` đầu mỗi hàm)
- Wrap try/catch, fail silently nếu gtag/clarity chưa load
- Auto-merge `getGlobalProps()` vào mọi event — caller không cần lo
- DEV mode: warn nếu event name không có trong `EVENTS` constant
- Honor `PUBLIC_TRACKING_ENABLED` env flag (kill switch)
- Clarity queue: nếu `window.clarity` chưa ready, push vào `__clarity_queue__`, flush khi ready (polling 500ms × 5 lần)

**`src/lib/analytics/events.ts`** — Event name constants để tránh typo:

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
```

### Files modified

| File | Sửa gì |
|---|---|
| `src/components/LeadForm.astro` | Thêm `trackEvent` calls vào 5 chỗ: IntersectionObserver mới cho view, `revealLeadCapture()` cho open, `handleProgress(key)` cho step_complete, success block trong `submitLead()` cho submit, `closeModal()` + `beforeunload` listener cho abandon. Thêm focus listener vào `input[name="contact"]` cho `phone_field_interact`. Thêm `tagSession('form_outcome', ...)` ở các điểm tương ứng. |
| `src/pages/blog/[slug].astro` (~ dòng 304-313) | Thêm `trackEvent('reader_milestone', ...)` sau khi update localStorage, check count === 3/5/10. Cùng try/catch block đã có. |
| `src/components/Hero.astro` | Thêm `trackEvent('cta_click', {cta_variant: 'hero'})` vào CTA chính (verify Hero có CTA dẫn về form trước). |
| `src/components/cta/variants/TofuCTA.astro`, `MofuCTA.astro`, `BofuCTA.astro` | Thêm `trackEvent('cta_click', {cta_variant: 'tofu' \| 'mofu' \| 'bofu'})` vào button click. |
| `src/components/AdvisorCTA.astro` | Tương tự, `cta_variant: 'advisor'`. |

### Files NOT touched

- `src/components/Layout.astro` — gtag + Clarity đã có sẵn, không đụng
- `src/lib/cta/ctaResolver.ts` — không đụng business logic CTA resolution
- `src/lib/telegram/*` — không đụng lead submission pipeline

### Clarity session tags

Set qua `tagSession()` tại các thời điểm tương ứng:

| Tag key | Khi set | Values |
|---|---|---|
| `form_outcome` | Khi user mở form / abandon từng step / submit | `opened`, `abandoned_at_intent`, `abandoned_at_budget`, `abandoned_at_priority`, `abandoned_at_contact`, `submitted` |
| `lead_tag` | Khi submit OK | `hot` / `warm` / `cold` |
| `top_pillar` | Set 1 lần/session khi page load | Pillar có engagement cao nhất trong `reader_interests` |

→ Đây là value-add quan trọng nhất: replay không có tag thì phải xem ngẫu nhiên 50 session để tìm 5 abandon. Tag rồi thì filter trong 5 giây.

### Order & timing

- gtag/Clarity load async từ Layout. Tracking call xảy ra sau hydration → 99% trường hợp tag đã sẵn. 1% còn lại: gtag tự queue qua dataLayer, Clarity miss 1-2 tag đầu — acceptable.
- LeadForm có `__hoaLacLeadFormInit__` flag chống init kép → tracking trong init function không fire double.
- IntersectionObserver cho `lead_form_view` phải unobserve sau lần fire đầu để tránh fire mỗi lần scroll qua scroll lại.
- `lead_form_abandon` trong `beforeunload` phải dùng `navigator.sendBeacon`, không dùng `fetch` (browser block sync request lúc unload).

## Review Process & Decision Framework

### Weekly check-in (5-10 phút/tuần)

1. Mở GA4 Realtime → confirm event vẫn fire
2. Mở Clarity Recordings → filter `form_outcome` xem có session mới
3. Ghi nhanh vào pattern log nếu thấy gì bất thường

→ Nếu tuần 1 không có event nào fire → broken, fix ngay (debug bằng GA4 DebugView extension)

### End-of-period review session (~60 phút)

Trigger: đạt 10 replays HOẶC hết tuần 4, whichever first.

Workflow:
1. Mở Clarity → Recordings → filter `form_outcome=abandoned_at_*` → xem từng replay 1-3 phút, mục tiêu 10 replays
2. Cho mỗi replay, ghi 1 dòng vào pattern log: `[date] [outcome tag] — quan sát chính`
3. Mở GA4 → Explore → Funnel exploration, build funnel: `view → open → intent → budget → priority → submit`. Xem % drop-off (nếu n đủ).
4. Đối chiếu định tính (replay) + định lượng (funnel) → ra 1 trong 4 outcomes:

### Decision tree

| Outcome | Tín hiệu | Action |
|---|---|---|
| **A. Vấn đề ở phone gate** | >50% abandon ở `contact` step + `time_to_focus_phone_ms` ngắn (<5s) + replay thấy user hover/dao động phone | Spec mới: **Quiz mode** — tách phone, kết quả phân loại ngay, phone là step optional thứ 2 |
| **B. Vấn đề ở discovery** | `lead_form_view` cao nhưng `lead_form_open` thấp (<10%) + ít `cta_click` | Spec mới: **CTA redesign** — đổi copy, đổi placement, ưu tiên placement convert tốt nhất |
| **C. Vấn đề ở step trước phone** | Abandon chủ yếu ở `intent` / `budget` (không phải contact) | Spec mới: **Reframe câu hỏi** — viết lại 3 câu để giống "công cụ chẩn đoán" hơn "form bán hàng" |
| **D. Không đủ data** | <5 replay + <20 form_view events | Không action. Kéo thêm 2-4 tuần. Có thể song song push traffic. |

Có thể rơi vào kết hợp (A + B), khi đó spec tiếp theo phải xử lý cái lớn trước.

### Pattern log artifact

**File:** `docs/superpowers/notes/lead-form-instrumentation-log.md` (tạo trong implementation phase)

Format:
```markdown
# Lead Form Instrumentation — Pattern Log

## Week 1 (ship date: YYYY-MM-DD)
- Day 2: confirmed events firing in GA4 Realtime
- Day 5: 3 replays collected

## Replay observations (running list)
- [YYYY-MM-DD] [outcome tag] — quan sát chính (1 dòng/replay)

## End-of-period review
[fill với decision từ framework trên]
```

Insight định tính dễ bị quên — viết ngay khi xem replay, không trông vào trí nhớ.

### Saved Clarity filters (setup 1 lần sau ship)

- Filter 1: `form_outcome contains "abandoned"` → tên **"Form abandons"**
- Filter 2: `form_outcome = "abandoned_at_contact"` → tên **"Phone gate drops"**
- Filter 3: `form_outcome = "submitted"` → tên **"Successful leads"**
- Filter 4: `top_pillar = "phap-ly"` (hoặc pillar care) → tên **"Legal persona"**

## Risks & Edge Cases

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Ad blocker chặn GA4 / Clarity (~20-30% visitor VN) | Cao | Mất signal | Accept. Replay-driven nên 5-10 replay thật vẫn đủ. Document baseline ~25% mất. |
| PII leak qua event property (vô tình gửi name/phone vào GA4) | Trung | Vi phạm policy | Code review checklist: không truyền raw value của field `name`/`contact`. Chỉ truyền boolean/enum/count. |
| gtag queue chưa init khi event đầu fire | Thấp | Mất 1-2 event đầu | gtag tự queue qua dataLayer. Defensive: `trackEvent` check `window.dataLayer` trước. |
| Clarity tag set quá sớm (trước `window.clarity` ready) | Trung | Tag mất, replay khó filter | `tagSession` wrap try/catch + queue: nếu `clarity` chưa có, push vào `__clarity_queue__`, flush polling 500ms × 5 lần |
| Spam / bot tăng event count giả | Trung | Funnel ratio méo | GA4 filter bot mặc định. Replay nào nghi bot → tag thủ công, exclude. |
| Traffic không đạt 10 replay trong 4 tuần | Cao (đã biết <50/tuần) | Decision delay | Đã handle: outcome D trong decision framework |
| Code refactor sau break event (rename `data-field-group` selector) | Trung | Silent failure | DEV mode warning trong `track.ts` nếu event name không có trong `EVENTS` const |
| GA4 default retention 14 tháng | Thấp | Mất data lịch sử sau 2 năm | Vào GA4 Admin → Data Settings → đổi max free tier (14 tháng) |

### Edge cases code phải handle

1. **localStorage disabled / quota full** — `getGlobalProps()` wrap try/catch, return `{}` thay vì throw
2. **User mở 2 tab cùng lúc** — Mỗi tab = 1 session độc lập, acceptable
3. **User submit lần 2 trong cùng session** — `submit_count` từ localStorage có rồi, event fire bình thường, không dedupe
4. **Page navigation giữa lúc form đang mở** — `beforeunload` fire `lead_form_abandon` với `reason: 'page_leave'`. Dùng `navigator.sendBeacon`, KHÔNG `fetch`
5. **Mobile Safari aggressive memory cleanup** — replay có thể bị cắt. Clarity tự handle.

## Performance Budget

- Helper module: ~500 bytes gzipped
- Mỗi event: ~1 KB payload (async, non-blocking)
- IntersectionObserver: native API, ~0ms overhead
- LCP/CLS impact: **0** (không thêm script, không thêm render path)

**Acceptance:** <50ms TBT increase, verify bằng Lighthouse trước/sau trong implementation.

## Rollback Strategy

**Soft kill switch (1 phút):** Env flag `PUBLIC_TRACKING_ENABLED`. Trong `track.ts`:
```ts
if (import.meta.env.PUBLIC_TRACKING_ENABLED === 'false') return;
```
Đổi env → deploy → mọi event ngừng. Code vẫn còn, không revert.

**Hard kill (revert PR):** Code chỉ ADD, không thay đổi behavior của LeadForm. Revert PR clean, không kéo regression.

## Success Criteria (của spec, KHÔNG phải của business)

1. GA4 dashboard hiển thị 8 events trong vòng 1 tuần sau ship
2. Có ít nhất 5 session replay với `form_outcome` tag trong tuần đầu (chấp nhận nếu traffic quá thấp thì kéo dài)
3. LCP/CLS không tăng đáng kể (Lighthouse diff <5%)
4. Pattern log file được tạo và có ít nhất 1 entry/tuần
5. Sau 4 tuần (hoặc 10 replays): có decision document rõ ràng — outcome A/B/C/D + rationale

## Out of Scope (defer)

- Server-side tracking (event từ Apps Script backend)
- Consent management platform
- Cross-domain tracking
- Custom report automation
- Alert / notification setup
- Statistical significance testing

## Related

- Current implementation: `src/components/LeadForm.astro`
- Reader tracking: `src/pages/blog/[slug].astro:304-313`
- CTA system: `src/lib/cta/`, `src/components/cta/variants/`
- Existing analytics: `src/components/Layout.astro:35-48`
