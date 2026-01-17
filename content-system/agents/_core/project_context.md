# Project Context

This repository contains an Astro-based content website focused on
Hòa Lạc real estate (Vietnam).

## Primary Business Goals
- Build long-term organic traffic via structured content (SEO-first).
- Educate users at TOFU / MOFU stages before conversion.
- Capture qualified leads via form-based CTAs.
- Maintain funnel integrity through internal linking and CTA rules.

## Content Strategy Overview
- Content is planned in advance using YAML files under:
  `content-system/plans/`
- Each article belongs to exactly one pillar.
- Funnel stages are explicit: TOFU, MOFU, BOFU.
- CTA rendering is dynamic and depends on intent + funnel.

## Key Systems
- Writer system: generates content strictly from plans.
- SEO system: optimizes content and technical metadata.
- Internal linking system:
  - Governed by `content-system/internal-link-registry.yaml`
  - Used for validation and QA.
- QA system:
  - May block build if violations exist.

## Hard Constraints
- DO NOT invent slugs, URLs, pillars, or future content.
- DO NOT assume unpublished articles exist.
- Always inspect the repository before acting.
- Treat YAML plans and registries as source-of-truth.

## Agent Architecture
This project uses role-based agent prompts stored under `/agents`.
Pipelines orchestrate multiple agents but do NOT override their rules.
