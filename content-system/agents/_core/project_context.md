# Project Context

This repository contains an Astro-based content website focused on
Hoa Lac real estate (Vietnam).

## Primary Business Goals
- Build long-term organic traffic via structured content (SEO-first).
- Educate users at TOFU / MOFU stages before conversion.
- Capture qualified leads via form-based CTAs.
- Maintain funnel integrity through internal linking and CTA rules.

## Master Strategy Document
**READ FIRST**: `content-system/content_strategy.md` (v3.0)
- 3 target personas (Section 5)
- Quality standards (Section 6)
- Content pillars & unique angles (Section 7)

## Content Pipeline v2
Pipeline runs in 3 phases, fully automated:

1. **Strategist** — Chooses topic, angle, persona, outline
2. **Writer** — Writes article with documents + NotebookLM data + citations
3. **Reviewer** — Fact-checks, SEO optimizes, QA validates

Data sources: Official QD documents (read directly) + NotebookLM (cross-reference via skill).
All data must come from documents or NotebookLM responses — no hallucination.

## Data Strategy
- **Evergreen data only**: Quy hoach, phap ly, vi tri (from official QD documents)
- **NO price data** in articles — prices go to lead form / direct consultation
- **Documents direct read**: `content-refs/documents/*.md` loaded into context
- **NotebookLM**: Cross-reference + deep queries via browser automation skill (50 queries/day free)

## Key Systems
- **Strategist**: Creates plan with topic, angle, persona, outline
- **Writer**: Generates content from plan + documents + NotebookLM (100% data accuracy)
- **Reviewer**: SEO + QA + fact-check combined. Fixes issues inline, no BLOCK.
- **CTA Engine**: Dynamic CTA rendering based on intent + funnel (runtime)
- **Internal linking**: Governed by `content-system/internal-link-registry.yaml`

## Hard Constraints
- DO NOT invent slugs, URLs, pillars, or future content.
- DO NOT assume unpublished articles exist.
- Always inspect the repository before acting.
- **DO NOT hallucinate data** — 100% from documents or NotebookLM responses
- **DO NOT include specific price data** in articles
- **NO BLOCK rules** — Reviewer uses WARNING + fix, never blocks

## 3 Target Personas (detail in content_strategy.md Section 5)
1. **mua-de-o**: An cu lau dai, so mua nham / lo phap ly
2. **mua-dau-tu-dai-han**: ROI 2-5 nam, data-driven decisions
3. **kinh-doanh-dong-tien**: Farmstay/cho thue, cashflow focus

## 4 Content Pillars
1. Tong quan & Quy hoach (TOFU)
2. Phan tich khu vuc (MOFU)
3. Phap ly & Rui ro (MOFU-BOFU)
4. Tiem nang & Co hoi (BOFU) — drivers analysis, no specific prices
