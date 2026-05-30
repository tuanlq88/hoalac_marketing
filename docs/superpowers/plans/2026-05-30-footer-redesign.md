# Footer Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay 3-column footer hiện tại bằng editorial Variant 3 (Quote section + Dark CTA strip + Meta row), one-way lead capture.

**Architecture:** Pure markup + CSS change. Reuse existing `#lead-form` anchor mechanism trong Layout.astro để trigger LeadForm portal — không cần JS mới. Floating CTA `.site-footer__cta` rules giữ nguyên (out of scope).

**Tech Stack:** Astro components, vanilla CSS (no preprocessor), Be Vietnam Pro + Playfair Display (đã load sẵn trong Layout.astro head)

**Spec:** [docs/superpowers/specs/2026-05-30-footer-redesign-design.md](../specs/2026-05-30-footer-redesign-design.md)

**Prototype:** [prototype-footer.html](../../../prototype-footer.html) (Variant 3)

---

## File Structure

**Modify:**
- `src/components/Layout.astro` — replace block `<footer class="site-footer">` (lines 200-223)
- `src/styles/global.css` — replace `.site-footer*` rules (lines 278-404), preserve `.site-footer__cta*` rules

**Do NOT touch:**
- `.site-footer__cta`, `.site-footer__cta--hidden`, `.site-footer__cta:hover` (lines 373-394)
- Touch-target rules referencing `.site-footer__cta` (lines 1304-1321)
- `src/components/LeadForm.astro` — không thay đổi
- LeadForm trigger script trong Layout.astro (lines 282-306) — không thay đổi

---

## Task 1: Replace footer markup in Layout.astro

**Files:**
- Modify: `src/components/Layout.astro:200-223`

- [ ] **Step 1: Read the current footer block**

Read `src/components/Layout.astro` lines 200-223 to confirm exact current content before editing.

- [ ] **Step 2: Replace footer markup**

Use Edit tool. Replace the entire `<footer>` block (lines 200-223) with the new structure:

```astro
    <footer class="site-footer">
      <div class="site-footer__quote-section">
        <p class="site-footer__quote-mark" aria-hidden="true">"</p>
        <p class="site-footer__quote">Đầu tư bất động sản không phải cuộc đua tốc độ — mà là cuộc chơi của người đọc được Thời, Thế, và Chiêu Thức.</p>
        <p class="site-footer__quote-attr">— Triết lý Tầm Nhìn Hòa Lạc</p>
      </div>
      <div class="site-footer__cta-strip">
        <div class="site-footer__cta-text">
          <strong>Cần một góc nhìn độc lập cho quyết định của bạn?</strong>
          <span>Phản hồi trong 24h. Không môi giới. Không spam.</span>
        </div>
        <div class="site-footer__cta-actions">
          <a href="#lead-form" class="site-footer__cta-primary">Nhận phân tích →</a>
        </div>
      </div>
      <div class="site-footer__meta">
        <div class="site-footer__brand-mini">
          <strong>Tầm Nhìn Hòa Lạc</strong> · © {new Date().getFullYear()} · Nội dung mang tính tham khảo, không thay thế tư vấn pháp lý chuyên nghiệp.
        </div>
        <div class="site-footer__meta-nav">
          <a href={blogHref}>Phân tích</a>
        </div>
      </div>
    </footer>
```

**Note:**
- `href="#lead-form"` sẽ tự được Layout.astro line 282-306 bind để open LeadForm portal — không cần JS mới.
- `{blogHref}` đã defined ở line 27 (`${basePath}/blog`), reuse luôn.
- Dấu `"` trong quote-mark là entity-safe trong Astro (không cần escape).

- [ ] **Step 3: Verify markup change**

Run build to check no syntax errors:

```bash
npm run build
```

Expected: build succeeds (no Astro syntax errors). Warnings about CSS classes not yet defined are OK — fixed in Task 2.

- [ ] **Step 4: Commit markup**

```bash
git add src/components/Layout.astro
git commit -m "feat(footer): replace 3-column markup with editorial v3 structure"
```

---

## Task 2: Replace footer CSS rules

**Files:**
- Modify: `src/styles/global.css:278-404` (preserve `.site-footer__cta*` rules at 373-394)

- [ ] **Step 1: Read current CSS block to confirm boundaries**

Read `src/styles/global.css` lines 278-405 to confirm what gets replaced vs preserved.

- [ ] **Step 2: Replace old footer CSS, preserve floating CTA rules**

Use Edit tool. Replace lines 278-372 AND lines 396-404 (skip 373-394 which are `.site-footer__cta*` floating CTA — keep untouched). The cleanest way: do TWO edits.

**Edit A** — replace `.site-footer` through `.site-footer__bottom p` (lines 278-371):

`old_string`:
```css
.site-footer {
  background: #0f172a;
  color: #fff;
  padding: 2.5rem clamp(1rem, 4vw, 2.5rem) 3rem;
  font-size: var(--font-footer-body);
  line-height: 1.5;
  margin-top: auto;
}

.site-footer__inner {
```

Followed by all rules through `.site-footer__bottom p { ... }` ending at line 371.

`new_string`:
```css
.site-footer {
  background: #1b1b1b;
  color: #ede9e2;
  font-family: var(--body-font);
  margin-top: auto;
}

.site-footer__quote-section {
  padding: clamp(4rem, 6vw, 6rem) clamp(2rem, 4vw, 4rem) 4rem;
  text-align: center;
  max-width: 70rem;
  margin: 0 auto;
}

.site-footer__quote-mark {
  font-family: var(--display-font);
  font-size: 8rem;
  line-height: 1;
  color: var(--accent);
  margin: 0;
}

.site-footer__quote {
  font-family: var(--display-font);
  font-size: clamp(2rem, 2.4vw, 2.8rem);
  line-height: 1.4;
  color: #fff;
  margin: -2rem 0 1.5rem;
  font-style: italic;
  font-weight: 600;
}

.site-footer__quote-attr {
  font-size: 1.2rem;
  color: #8d8a84;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin: 0;
}

.site-footer__cta-strip {
  background: #2a2a2a;
  padding: 2.8rem clamp(2rem, 4vw, 4rem);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
  border-top: 1px solid #333;
  border-bottom: 1px solid #333;
}

.site-footer__cta-text {
  flex: 1;
  min-width: 28rem;
}

.site-footer__cta-text strong {
  display: block;
  font-size: 1.7rem;
  color: #fff;
  margin-bottom: 0.3rem;
  font-weight: 600;
}

.site-footer__cta-text span {
  font-size: 1.3rem;
  color: #a8a4a0;
}

.site-footer__cta-actions {
  display: flex;
  gap: 1rem;
}

.site-footer__cta-primary {
  background: var(--accent);
  color: #fff;
  padding: 1.3rem 2.4rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.4rem;
  transition: background 150ms ease;
}

.site-footer__cta-primary:hover {
  background: var(--accent-dark);
  color: #fff;
}

.site-footer__meta {
  padding: 2rem clamp(2rem, 4vw, 4rem);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 1.2rem;
  color: #8d8a84;
}

.site-footer__brand-mini strong {
  color: #ede9e2;
  font-weight: 600;
}

.site-footer__meta-nav a {
  margin-left: 1.6rem;
}

@media (max-width: 720px) {
  .site-footer__cta-strip {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
  .site-footer__cta-actions {
    justify-content: center;
  }
  .site-footer__meta {
    flex-direction: column;
    align-items: flex-start;
  }
  .site-footer__meta-nav a {
    margin-left: 0;
    margin-right: 1.6rem;
  }
}
```

**Edit B** — replace `.site-footer a` rules (currently at lines 396-404, will shift after Edit A):

`old_string`:
```css
.site-footer a {
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  transition: color 150ms ease;
}

.site-footer a:hover {
  color: #fff;
}
```

`new_string`:
```css
.site-footer a {
  color: #8d8a84;
  text-decoration: none;
  transition: color 150ms ease;
}

.site-footer a:hover {
  color: #fff;
}
```

**IMPORTANT:** Floating CTA block (`.site-footer__cta`, `.site-footer__cta--hidden`, `.site-footer__cta:hover` — currently lines 373-394) must remain unchanged between the two edits.

- [ ] **Step 3: Verify CSS edits preserved floating CTA**

Run:
```bash
grep -n "site-footer__cta" src/styles/global.css
```

Expected output should include (in addition to new `.site-footer__cta-strip`, `.site-footer__cta-text`, `.site-footer__cta-actions`, `.site-footer__cta-primary`):
- `.site-footer__cta {` (the floating one — display: inline-flex with border)
- `.site-footer__cta--hidden`
- `.site-footer__cta:hover`
- 2 references in touch-target rules near line 1308 and 1319

If `.site-footer__cta {` (the original floating CTA, NOT `__cta-strip` / `__cta-primary` / `__cta-actions` / `__cta-text`) is missing → STOP, revert, redo Edit A carefully.

- [ ] **Step 4: Build & verify**

```bash
npm run build
```

Expected: build succeeds, no CSS warnings about undefined classes.

- [ ] **Step 5: Commit CSS**

```bash
git add src/styles/global.css
git commit -m "feat(footer): editorial v3 styling with dark CTA strip"
```

---

## Task 3: Manual visual verification

**Files:** none (manual browser check)

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

Expected: server up at `http://localhost:4321` (or similar — check console).

- [ ] **Step 2: Verify footer on home page**

Open `http://localhost:4321/` in browser. Scroll to footer.

Verify checklist:
- [ ] Quote section: dark bg, large orange `"` mark, italic Playfair quote, attribution in small caps
- [ ] CTA strip: slightly lighter dark bg, heading + sub on left, single orange "Nhận phân tích →" button on right
- [ ] Meta row: brand name + © year + long disclaimer on left, "Phân tích" link on right
- [ ] No email link anywhere
- [ ] No Telegram link anywhere

- [ ] **Step 3: Verify footer on a blog post**

Navigate to any blog post (e.g., `http://localhost:4321/blog/`). Same checklist.

- [ ] **Step 4: Verify CTA opens LeadForm portal**

Click "Nhận phân tích →" button. Expected: LeadForm modal/portal opens (same behavior as clicking "Tìm góc nhìn" pill in header).

If form doesn't open: check browser console for errors, verify `href="#lead-form"` exactly matches what the Layout.astro script binds to (line 283).

- [ ] **Step 5: Verify mobile layout**

Open browser devtools, set viewport to 375px width (mobile).

Verify:
- [ ] CTA strip stacks vertically (text on top, button below, both centered)
- [ ] CTA button doesn't overflow horizontally
- [ ] Meta row stacks vertically
- [ ] Quote section padding reduced (no horizontal overflow)
- [ ] Quote text still readable (not too large)

- [ ] **Step 6: Verify no console errors**

Open browser devtools console. Reload page. Expected: no errors related to footer or `#lead-form`.

- [ ] **Step 7: Commit if any tweaks needed**

If Step 2-6 surfaced visual issues, fix in CSS and commit with message describing the fix. Otherwise no commit needed.

---

## Task 4: Final cleanup verification

**Files:** none (read-only checks)

- [ ] **Step 1: Verify no broken class references in templates**

```bash
grep -rn "site-footer__inner\|site-footer__col\|site-footer__brand\b\|site-footer__copy\|site-footer__trust\|site-footer__col-title\|site-footer__highlight\|site-footer__response\|site-footer__bottom" --include="*.astro" --include="*.ts" --include="*.js" src/
```

Expected: **no matches** (all old footer classes removed from templates and code).

If matches found → these are templates still using deleted classes. Either update them to new structure or restore the CSS rule for that specific class.

- [ ] **Step 2: Verify floating CTA still intact in CSS**

```bash
grep -n "^\.site-footer__cta\b\|\.site-footer__cta--hidden\|\.site-footer__cta:hover" src/styles/global.css
```

Expected: 3 matches (the 3 floating-CTA rules preserved).

- [ ] **Step 3: Final build**

```bash
npm run build
```

Expected: clean build, no warnings.

- [ ] **Step 4: Final commit (only if Step 1 surfaced & fixed orphaned references)**

```bash
git add -A
git commit -m "chore(footer): clean up orphaned references to old footer classes"
```

If Step 1 was clean (no matches), skip this step.

---

## Done criteria

- [ ] Markup replaced (Task 1)
- [ ] CSS replaced, floating CTA preserved (Task 2)
- [ ] Visual + interaction verified in browser (Task 3)
- [ ] No broken class references (Task 4)
- [ ] All commits pushed (if user wants to push)
