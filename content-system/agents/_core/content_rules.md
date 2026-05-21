# Content Rules

**Master Reference**: `content-system/content_strategy.md` (Section 6: Quality Standards, Section 8: Structure Standards)

## General Writing Rules
- Content must be factual, neutral, and audit-friendly.
- Avoid hype, exaggerated promises, or sales language unless BOFU.
- **100% citations required** for all numbers/timelines/statistics [1][2][3]
- **Documents + NotebookLM**: All data from official documents or NotebookLM responses
- **No price data**: Articles must NOT include specific land prices
- Cite sources when mentioning:
  - regulations
  - infrastructure timelines
  - pricing ranges or statistics

## Structure Rules
- One H1 per article.
- Use clear H2 / H3 hierarchy.
- Open with data, regulation, or real-world context when possible.
- **Hook → Journey → Takeaway** structure (content_strategy.md Section 4)
- **Persona-driven**: Tone and focus match target_persona (Section 5)

## Frontmatter Rules (Mandatory)
Every blog post MUST include:
- slug
- pillar
- search_intent (informational | commercial | transactional)
- funnel_stage (TOFU | MOFU | BOFU)
- primary_goal (educate | compare | qualify | convert)
- **target_persona** (mua-de-o | mua-dau-tu-dai-han | kinh-doanh-dong-tien)
- audience_pain_point
- internal_links (at least pillar hub)
- allowed_cta

These fields are used by:
- CTA Engine
- Internal link validation
- QA checks

## Content Scope Rules
- Each article serves ONE primary goal:
  educate | compare | qualify | convert
- Do not mix funnel stages unless explicitly planned.
- **Content angles must be unique** (avoid generic, see content_strategy.md Section 3.2)
- **Actionable**: Provide checklist/tool/template người đọc có thể dùng ngay

## Data Quality Rules
- **100% citations** from documents or NotebookLM responses
- Format: `HL4 có diện tích 1.879,83 ha [Source: QD_5105]`
- NO hallucinated data
- NO future facts presented as certainty
- NO specific price data (land prices, market prices)
- Data freshness note (optional): "Dữ liệu cập nhật đến: [mốc thời điểm]"

## Storytelling Quality (content_strategy.md Section 6.3)
- **Personification**: "Metro số 5 là cột sống giao thông..."
- **Scenario Building**: "Ví dụ anh Minh mua để ở..."
- **Comparison Matrix**: So sánh rõ ràng với tiêu chí cụ thể
- **Timeline Narrative**: 2025 → 2026 → 2030 với catalysts

## Modification Rules
- Writer may create new markdown files based on documents + NotebookLM data.
- SEO agents may modify headings, metadata, schema hints.
- No agent may delete content unless explicitly instructed.
- **NO agent may modify data/citations from insights**
