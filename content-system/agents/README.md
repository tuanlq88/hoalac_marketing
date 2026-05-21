# Agents Overview

This folder contains all system prompts used in the content pipeline v2.

Each prompt represents a single, well-scoped role.
Prompts must not overlap responsibilities.

## Pipeline v2 (3 phases):
1. strategist — choose topic, angle, outline
2. writer-v2 — write article with Gemini data
3. reviewer — fact-check + SEO + QA combined

## Supporting agents (used by Reviewer or runtime):
- seo/seo_content — SEO on-page rules
- seo/seo_tech — Technical SEO rules
- linking/internal_link_architect — Internal link management
- cta/cta_engine — CTA rendering (runtime)
- img_generator — Visual generation

## Core rules:
- _core/project_context.md — Project overview
- _core/content_rules.md — Writing rules
- _core/funnel_rules.md — Funnel rules
- rules/fact_boundary.md — Fact vs opinion boundaries
