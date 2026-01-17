# Funnel Rules

## Funnel Definitions
- TOFU (Top of Funnel): Education, awareness, definitions.
- MOFU (Middle of Funnel): Comparison, analysis, evaluation.
- BOFU (Bottom of Funnel): Conversion, case studies, offers.

## Linking Rules
- TOFU may link to: TOFU, MOFU
- MOFU may link to: TOFU, MOFU, BOFU
- BOFU must NOT link upward.

## CTA Rules
- TOFU: soft CTA only (read more, subscribe, download guide).
- MOFU: mid-intent CTA (contact, consultation, comparison).
- BOFU: direct conversion CTA (form, call, deal).

## Overrides
- Strategic overrides (e.g. allow_no_bofu) MUST be explicit:
  - Declared in registry
  - Declared in post frontmatter
  - Include review_after date

## QA Authority
- Funnel violations are BLOCKING unless overridden.
- QA decisions determine build readiness.
