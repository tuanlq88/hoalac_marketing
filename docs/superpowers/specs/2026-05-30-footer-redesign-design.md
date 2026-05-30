# Footer Redesign — Editorial Quote + Dark CTA Strip

**Date:** 2026-05-30
**Status:** Design approved, pending implementation plan
**Prototype:** `prototype-footer.html` (Variant 3)

## Goal

Thay footer hiện tại (3-column sitemap đơn giản) bằng một footer mới có 2 vai trò:

1. **Branded/editorial** — đóng dấu triết lý Tầm Nhìn Hòa Lạc (Thời-Thế-Chiêu Thức) ở vị trí cuối mỗi bài đọc, khi reader đã hấp thụ nội dung.
2. **One-way lead capture** — chuyển reader thành lead qua **một đường ra duy nhất**: form "Nhận phân tích". Không Telegram, không email, không social — bên mình chủ động liên hệ ngược lại.

## Non-goals

- Không phải knowledge platform footer (không sitemap chi tiết, không link tới từng pillar).
- Không có Telegram/email link để khách chủ động liên hệ — quyết định business: kiểm soát kênh liên hệ.
- Không thay đổi `LeadForm.astro` component, chỉ thay nút trigger.

## Structure

Footer chia làm 3 dải xếp dọc, toàn bộ nền dark (`#1b1b1b`):

```
┌───────────────────────────────────────────────────────┐
│  [QUOTE SECTION — dark bg]                            │
│                                                       │
│                       "                               │
│   "Đầu tư bất động sản không phải cuộc đua tốc độ   │
│    — mà là cuộc chơi của người đọc được Thời, Thế,   │
│    và Chiêu Thức."                                    │
│                                                       │
│            — TRIẾT LÝ TẦM NHÌN HÒA LẠC                │
├───────────────────────────────────────────────────────┤
│  [CTA STRIP — slightly lighter dark #2a2a2a]          │
│                                                       │
│  Cần một góc nhìn độc lập...     [ Nhận phân tích → ] │
│  Phản hồi trong 24h. Không...                         │
├───────────────────────────────────────────────────────┤
│  [META ROW — dark bg]                                 │
│                                                       │
│  Tầm Nhìn Hòa Lạc · © 2026 · ...           Phân tích │
└───────────────────────────────────────────────────────┘
```

### Section 1: Quote (editorial)

- Background: `#1b1b1b`
- Padding: `6rem 4rem 4rem`
- Max-width: 70rem, căn giữa
- Trang trí: dấu nháy lớn `"` bằng Playfair Display, size 8rem, màu `--accent` (#d44809), `line-height: 1`
- Quote text: Playfair Display italic, weight 600, size `clamp(2rem, 2.4vw, 2.8rem)`, màu `#fff`
- Quote nội dung: *"Đầu tư bất động sản không phải cuộc đua tốc độ — mà là cuộc chơi của người đọc được Thời, Thế, và Chiêu Thức."*
- Attribution: `— TRIẾT LÝ TẦM NHÌN HÒA LẠC`, uppercase, letter-spacing 0.15em, màu `#8d8a84`, size 1.2rem

### Section 2: CTA Strip (conversion)

- Background: `#2a2a2a` (hơi sáng hơn quote section để tách biệt)
- Padding: `2.8rem 4rem`
- Border top/bottom: `1px solid #333`
- Layout: flexbox, `justify-content: space-between`, `flex-wrap: wrap`
- **Left** (`flex: 1`, min-width 28rem):
  - Heading: `Cần một góc nhìn độc lập cho quyết định của bạn?` — màu `#fff`, weight 600, size 1.7rem
  - Sub: `Phản hồi trong 24h. Không môi giới. Không spam.` — màu `#a8a4a0`, size 1.3rem
- **Right** (single button — không còn Telegram):
  - `Nhận phân tích →` — bg `--accent`, color `#fff`, padding `1.3rem 2.4rem`, border-radius 4px, weight 600
  - Hover: bg `--accent-dark`
  - **Behavior**: nút này phải trigger LeadForm portal (như nút `#lead-form` trong header hiện tại — dispatch `lead-form:request-open` event hoặc scroll tới inline form nếu có)

### Section 3: Meta Row (utility)

- Background: `#1b1b1b`
- Padding: `2rem 4rem`
- Layout: flexbox, `justify-content: space-between`, `flex-wrap: wrap`
- Font size 1.2rem, màu `#8d8a84`
- **Left**: `Tầm Nhìn Hòa Lạc · © {currentYear} · Nội dung mang tính tham khảo, không thay thế tư vấn pháp lý chuyên nghiệp.`
  - Brand name `<strong>` màu `#ede9e2`, weight 600
- **Right**: 1 link duy nhất — `Phân tích` → `/blog`
  - Màu `#8d8a84`, hover `#fff`, không underline

## Responsive (mobile, max-width: 720px)

- CTA strip: `flex-direction: column`, `align-items: stretch`, `text-align: center`
- CTA button: full-width hoặc căn giữa
- Quote section: padding giảm xuống `4rem 2rem 3rem`
- Meta row: stack dọc, căn trái

## Tokens (reuse existing)

Tất cả màu/font dùng existing tokens từ `global.css`:
- `--bg: #f6f5f2` (không dùng — footer là dark)
- `--accent: #d44809`, `--accent-dark: #a43706`
- `--body-font: "Be Vietnam Pro"`, `--display-font: "Playfair Display"`

Hard-coded mới (dark palette — chỉ dùng trong footer):
- `#1b1b1b` (quote + meta bg) — đã trùng với `--text`
- `#2a2a2a` (CTA strip bg)
- `#333` (CTA strip borders)
- `#ede9e2` (brand emphasis text)
- `#8d8a84`, `#a8a4a0` (muted text trong dark)
- `#fff` (white headings)

→ Có thể optionally add vào `:root` nếu muốn reuse, nhưng vì chỉ footer dùng nên hard-code inline trong scope `.site-footer` là chấp nhận được.

## Files to change

- **`src/components/Layout.astro`** — thay toàn bộ block `<footer class="site-footer">` (lines 200-223) bằng markup mới
- **`src/styles/global.css`** — replace toàn bộ `.site-footer*` rules (từ line 278 đến ~410) bằng styles mới
  - Cần delete: `.site-footer__inner`, `.site-footer__col`, `.site-footer__col-title`, `.site-footer__brand`, `.site-footer__copy`, `.site-footer__trust`, `.site-footer__response`, `.site-footer__highlight`
  - Có thể giữ/xoá: `.site-footer__cta` (floating CTA — không liên quan footer mới, cần check usage)
- **`src/scripts/`** — không cần JS mới; nút "Nhận phân tích" reuse logic `#lead-form` anchor handling hiện có ở Layout.astro lines 282-306

## Open question (implementation phase)

- **Floating CTA `.site-footer__cta`**: hiện tại có 1 floating CTA gắn vào footer (line 373-404 trong global.css). Cần check còn dùng không — nếu còn thì giữ; nếu không thì xoá luôn cho sạch.

## Verification (manual)

Sau khi implement:
1. Mở homepage, blog index, một bài blog — xem footer hiện đúng ở cả 3
2. Click "Nhận phân tích →" — phải open LeadForm portal/scroll tới inline form
3. Resize browser xuống mobile (< 720px) — CTA strip stack dọc, không overflow
4. Check dark mode preference (nếu user OS dark) — footer vẫn dark, không bị invert
5. Lighthouse contrast check — text trên dark bg phải đạt AA
