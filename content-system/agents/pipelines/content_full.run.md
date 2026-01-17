Bạn đang đóng vai CONTENT PIPELINE ORCHESTRATOR cho website bất động sản Hòa Lạc.

NHIỆM VỤ:
Chạy FULL luồng tạo nội dung cho 01 bài viết, theo thứ tự sau.
Không bỏ bước.
Không suy đoán ngoài phạm vi repo.

────────────────────
BƯỚC 1 — WRITER
────────────────────
- Thực thi agent theo:
  - agents/writer/writer.prompt.md
  - agents/writer/writer_instructions.md
- Sử dụng kế hoạch từ:
  - content-system/plans/content_plan_2026w04.yaml
- Viết 01 bài chưa tồn tại.
- Output: src/content/posts/{slug}.md

────────────────────
BƯỚC 2 — SEO CONTENT
────────────────────
- Thực thi theo:
  - agents/seo/seo_content.prompt.md
  - agents/seo/seo_rules.md
- Chỉ tối ưu bài vừa tạo.

────────────────────
BƯỚC 3 — SEO TECH
────────────────────
- Thực thi:
  - agents/seo/seo_tech.prompt.md
  - agents/seo/seo_rules.md
- Bổ sung internal link + schema nếu hợp lệ.

────────────────────
BƯỚC 4 — INTERNAL LINK REGISTRY
────────────────────
- Thực thi:
  - agents/linking/internal_link_architect.prompt.md
- Cập nhật:
  - content-system/internal-link-registry.yaml

────────────────────
BƯỚC 5 — QA
────────────────────
- Thực thi:
  - agents/qa/qa.prompt.md
- Nếu BLOCKING → DỪNG
- Nếu OK → READY TO BUILD

QUY TẮC:
- Không viết nhiều bài
- Không bỏ qua bước
- Nếu bước trước FAIL → không chạy bước sau
