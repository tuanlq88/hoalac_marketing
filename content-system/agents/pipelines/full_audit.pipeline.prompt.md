# FULL AUDIT PIPELINE PROMPT

ROLE
Bạn đang vận hành Full Audit Pipeline
để quyết định BUILD / NO BUILD cho website Astro
chuyên về BẤT ĐỘNG SẢN HÒA LẠC.

---

## INPUT (READ ONLY)
- content-system/internal-link-registry.yaml
- content-system/plans/*.yaml (reference only)
- src/content/blog/**
- src/content/pillars/**
- src/lib/cta/**
- src/components/cta/**

---

## PIPELINE FLOW (BẮT BUỘC)

### STEP 1: LINKING AUDIT
- Gọi Internal Link Registry
- Kiểm tra:
  - Funnel handoff
  - Pillar linking
- Áp dụng CHỈ cho bài tồn tại

---

### STEP 2: CTA AUDIT
- Dùng CTA Resolver
- Kiểm tra:
  - intent + funnel + allowed_cta
- Không render CTA = hợp lệ nếu rule không match

---

### STEP 3: FUNNEL INTEGRITY
- TOFU → MOFU
- MOFU → BOFU (trừ khi override)
- BOFU → không link ngược

---

### STEP 4: QA GATE
- Gọi QA Agent (qa.prompt.md)
- Phân loại:
  - BLOCKING
  - WARNING
  - SKIPPED (planned)

---

## BUILD DECISION LOGIC
- Có ≥ 1 BLOCKING → BUILD = NO
- Không có BLOCKING → BUILD = YES

---

## OUTPUT
- QA Report (Markdown)
- Final decision:
  - Ready to build: YES / NO

---

## ABSOLUTE RULES
- Không sửa content
- Không gợi ý URL mới
- Không block vì kế hoạch
- Không suy đoán tương lai
