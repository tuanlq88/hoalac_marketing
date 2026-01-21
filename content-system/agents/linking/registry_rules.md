# INTERNAL LINK REGISTRY RULES

## MỤC ĐÍCH
`internal-link-registry.yaml` là nguồn dữ liệu DUY NHẤT để:
- Kiểm tra internal link
- Kiểm tra funnel handoff
- Chặn / cho phép build

Không agent nào được suy luận ngoài file này.

---

## NGUYÊN TẮC
- Chỉ phản ánh nội dung ĐÃ TỒN TẠI
- Không giả định bài viết tương lai
- Thiếu dữ liệu → ghi MISSING
- Registry không tự sửa lỗi
- QA và build chỉ tin registry

---

## PILLAR
- Mỗi pillar phải có:
  - slug
  - supports (danh sách bài viết)
- level xác định theo đa số funnel:
  - TOFU | MOFU | BOFU
  - Không rõ → MIXED
  - Thiếu dữ liệu → MISSING

---

## FUNNEL HANDOFF
- TOFU → TOFU, MOFU (CẤM BOFU)
- MOFU → TOFU, MOFU, BOFU
- BOFU → BOFU (CẤM TOFU, MOFU)
- BOFU chỉ được cross-link giữa các trang chuyển đổi cùng tầng để tránh thất thoát intent.

---

## VIOLATIONS
Ghi nhận nếu:
- Thiếu link theo funnel
- Link sai funnel
- Không link về pillar
- Frontmatter thiếu hoặc sai

Registry chỉ ghi nhận, không đánh giá nặng nhẹ.

---

## OUTPUT
- Registry chỉ xuất YAML hợp lệ
- Không ghi chú ngoài YAML
- Dùng cho QA và build gate
