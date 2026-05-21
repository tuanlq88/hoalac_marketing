# ORCHESTRATOR — CONTENT PIPELINE v2

Ban dieu phoi 3 phases de tao 1 bai viet hoan chinh.

## WORKFLOW

### BUOC 0: KHOI TAO
- Doc `agents/_core/project_context.md`
- Doc `agents/_core/content_rules.md`
- Doc `content-system/content_strategy.md`
- Doc danh sach bai hien co: `src/content/posts/` va `src/content/pillars/`

### BUOC 1: STRATEGIST
- Thuc thi theo: `agents/strategist.prompt.md`
- Output: Plan entry (slug, pillar, persona, outline)
- Neu FAIL: DUNG, bao loi

### BUOC 2: WRITER
- Thuc thi theo: `agents/writer-v2.prompt.md`
- Input: Plan entry tu buoc 1
- Doc documents + query NotebookLM cho tung section trong outline
- Output: File .md tai src/content/posts/{slug}.md hoac pillars/
- Neu FAIL: DUNG, bao loi

### BUOC 2.5: VISUAL THINKING
- Doc lai bai viet vua tao
- Tu danh gia: bai nay CO CAN hinh minh hoa khong?
- Tieu chi:
  * Co so sanh nhieu khu vuc / phan khu? → Ban do dinh huong SVG
  * Co dong thoi gian / cac moc? → Timeline SVG
  * Co so lieu nhieu dong (bang dai)? → Bieu do so sanh SVG
  * Bai ngan, don gian, chi 1 khia canh? → KHONG CAN hinh
- Neu CAN:
  * Tao file SVG tai `public/images/maps/{slug}.svg`
  * SVG phai: tieng Viet, khong dung thu vien ngoai, responsive (viewBox)
  * Them dong `![mo ta](/images/maps/{slug}.svg)` vao bai viet (sau phan mo bai, truoc section 1)
  * Ghi chu: "So do minh hoa, khong theo ti le thuc"
- Neu KHONG CAN: bo qua, sang buoc 3

### BUOC 3: REVIEWER
- Thuc thi theo: `agents/reviewer.prompt.md`
- Input: File .md tu buoc 2
- Output: File .md final + QA summary
- KHONG BLOCK — luon output bai (co the co WARNING)

### BUOC 4: BAO CAO
In ra:

```
=== PIPELINE v2 COMPLETE ===
Article: {slug}
File: src/content/posts/{slug}.md
Pillar: {pillar}
Persona: {persona}
Word count: XXXX
QA: PASS / PASS WITH WARNINGS
Warnings: [list neu co]
===========================
```

## QUY TAC
- Chi viet 1 bai moi lan chay
- Khong bo buoc
- Neu buoc truoc FAIL (Strategist hoac Writer): DUNG
- Reviewer KHONG BAO GIO block — luon ra bai
- 1 lenh = 1 bai hoan chinh
