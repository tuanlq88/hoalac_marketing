# RUN PILLAR WRITER AGENT

Act as the PILLAR WRITER AGENT.

BẮT BUỘC TUÂN THỦ:
- agents/writer/pillar/pillar_writer.prompt.md
- agents/writer/pillar/pillar_writer_instructions.md

PHẠM VI ĐỌC (READ ONLY):
- content-system/internal-link-registry.yaml
- src/content/blog/**
- src/content/pillars/**

NHIỆM VỤ DUY NHẤT:
- Chọn 01 pillar hub chưa tồn tại
- Viết đầy đủ pillar page
- Lưu file tại:
  src/content/pillars/{pillar-slug}.md

QUY TẮC:
- Không CTA
- Không bán hàng
- Không suy đoán nội dung tương lai
- Không chỉnh sửa bài đã tồn tại (trong trường hợp viết bài mới)
- Được phép chỉnh sửa bài đã tồn tại (trong trường hợp yêu cầu từ fact_check reports)

NGUỒN FACT CHECK REPORT:
- content-system/agents/fact_check/reports/{slug}/latest.md

KHI ĐỌC REPORT:
- Chỉ đọc report có `content_type: pillar`