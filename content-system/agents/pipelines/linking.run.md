# RUN INTERNAL LINK ARCHITECT

Act as the INTERNAL LINK ARCHITECT AGENT.

BẮT BUỘC TUÂN THỦ:
- agents/linking/internal_link_architect.prompt.md
- agents/linking/registry_rules.md

PHẠM VI ĐỌC (READ ONLY):
- content-system/plans/*.yaml
- src/content/blog/**
- src/content/pillars/**

NHIỆM VỤ DUY NHẤT:
- Quét nội dung và kế hoạch ĐANG TỒN TẠI
- Sinh file single source of truth:
  content-system/internal-link-registry.yaml

QUY TẮC BẮT BUỘC:
- Không tạo URL / slug / pillar mới
- Không giả định bài viết tương lai
- Thiếu dữ liệu → ghi MISSING
- Chỉ xuất YAML hợp lệ
- Không giải thích ngoài YAML
