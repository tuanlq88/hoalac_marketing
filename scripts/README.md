# Scripts Documentation

## NotebookLM Query Scripts

### query-notebooklm-auto.py (Recommended - V3)

**Tự động query NotebookLM từ content plan YAML**

```bash
# Run from repo root
python scripts/query-notebooklm-auto.py

# Or use bash wrapper
bash scripts/query-notebooklm-for-plan-v3.sh
```

**Features:**
- ✅ Tự động parse `content_plan_2026_02.yaml`
- ✅ Loop qua tất cả articles trong plan
- ✅ Query NotebookLM với `notebooklm_query` từ plan
- ✅ Format output theo Section 8.3 (Query Info, Response, Sources, Analysis Layer)
- ✅ Skip files đã tồn tại (delete để regenerate)
- ✅ Validate file size >1KB
- ✅ Summary report: success/skip/fail counts

**Output:**
- `content-system/content-refs/{slug}_insights.md`

**Structure của insights file:**
```markdown
# NotebookLM Insights: {slug}

## Query Info
- Notebook ID: ...
- Query Date: YYYY-MM-DD
- Persona: mua-de-o | mua-dau-tu-dai-han | ...
- Pillar: ...

## Raw Query
```text
{notebooklm_query from plan}
```

## NotebookLM Response
{Raw response with citations [1][2][3]...}

## Sources Referenced
(Citations from NotebookLM)

## Analysis Layer (Writer adds)
(Writer bổ sung góc nhìn phân tích)

## Fact Check Verified
- [ ] All numbers có citation
- [ ] Timeline chính xác
- [ ] Không có future facts
...
```

---

### query-notebooklm-for-plan-v2.sh (Deprecated)

**Script cũ với queries hardcoded**

⚠️ **KHÔNG khuyến khích sử dụng** - Queries không khớp với plan mới.

Use `query-notebooklm-auto.py` instead.

---

## Workflow

### 1. Planner tạo content plan

```bash
# Plan được tạo tại: content-system/plans/content_plan_2026_02.yaml
# Mỗi article có field `notebooklm_query`
```

### 2. Query NotebookLM tự động

```bash
# Run script
bash scripts/query-notebooklm-for-plan-v3.sh

# Output: 6 insights files tại content-system/content-refs/
```

### 3. Writer đọc insights và viết bài

```bash
# Writer PHẢI đọc insights file trước khi viết
# 100% data từ insights với citations [1][2][3]
```

### 4. QA spot-check citations

```bash
# QA verify citations match insights file
# Block nếu >50% citations sai
```

---

## Requirements

- Python 3.12+
- PyYAML (`pip install pyyaml`)
- NotebookLM skill installed tại `~/.claude/skills/notebooklm/`

---

## Troubleshooting

### "PyYAML not found"
```bash
pip install pyyaml
```

### "NotebookLM skill not found"
```bash
# Check path exists:
ls ~/.claude/skills/notebooklm/

# If not, install NotebookLM skill first
```

### "File size < 1KB warning"
- NotebookLM response might be incomplete
- Check network connection
- Retry query hoặc refine query wording

### "Query failed"
- Check NotebookLM skill setup
- Verify notebook URL accessible
- Check credentials

---

## Update History

- **V3 (2026-02-03)**: Python auto script - parse YAML, format Section 8.3
- **V2 (2026-01-21)**: Bash script - hardcoded queries (deprecated)
- **V1**: Initial version
