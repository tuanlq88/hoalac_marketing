# SEO RULES — SINGLE SOURCE OF TRUTH

File này định nghĩa PHẠM VI, GIỚI HẠN và NGUYÊN TẮC bắt buộc
cho toàn bộ các SEO Agent trong hệ thống.

Áp dụng cho:

- SEO Content Agent
- SEO Tech Agent
- QA Agent (đối chiếu)

────────────────────────────────
🎯 MỤC TIÊU
────────────────────────────────

- Tối ưu SEO cho NỘI DUNG ĐÃ TỒN TẠI
- Giữ nguyên chiến lược nội dung & funnel
- Không làm biến dạng ý đồ ban đầu của bài viết

SEO trong hệ thống này là:
→ TỐI ƯU HÓA
→ KHÔNG PHẢI SÁNG TẠO NỘI DUNG

────────────────────────────────
📌 NGUYÊN TẮC CỐT LÕI
────────────────────────────────

1. SEO KHÔNG quyết định chiến lược
2. SEO KHÔNG thay đổi intent, funnel, goal
3. SEO KHÔNG thêm CTA
4. SEO KHÔNG viết thêm nội dung mới
5. SEO CHỈ làm việc trên bài đã tồn tại

────────────────────────────────
📐 PHẠM VI ĐƯỢC PHÉP (THEO LOẠI AGENT)
────────────────────────────────

## 1️⃣ SEO CONTENT AGENT

ĐƯỢC PHÉP:

- Chỉnh nhẹ:
  - title (giữ nguyên ý nghĩa)
  - description (tạo mới nếu thiếu)
- Tối ưu H2 / H3 cho rõ nghĩa
- Thêm internal link:
  - về pillar
  - sang bài liên quan (nếu đã tồn tại)
  - link phải đặt trước section `FACT_DECLARATION`

KHÔNG ĐƯỢC:

- Viết thêm đoạn mới
- Thêm keyword không có trong bài
- Nhồi keyword
- Đổi cấu trúc lập luận
- Đổi slug, pillar, funnel, intent, primary_goal

---

### 2️⃣ SEO TECH AGENT

ĐƯỢC PHÉP:

- Bổ sung / chuẩn hoá internal link theo funnel rules
- Thêm schema:
  - Article / BlogPosting
  - FAQPage / HowTo (nếu phù hợp)
- Chuẩn hoá markdown kỹ thuật:
  - list
  - table
  - alt text hình ảnh

KHÔNG ĐƯỢC:

- Sửa heading (H1–H3)
- Sửa title / meta
- Thêm CTA
- Thêm link ngoài
- Thay đổi intent / funnel / allowed_cta

---

### NGOẠI NGỮ CHUYÊN NGÀNH

- Chỉ dùng khi:
  - Không có từ tiếng Việt tương đương phổ biến
- Nếu dùng:
  - BẮT BUỘC giải thích ngắn gọn ngay lần xuất hiện đầu tiên
  - Sau đó ưu tiên dùng tiếng Việt

---

────────────────────────────────
🔗 INTERNAL LINK & FUNNEL
────────────────────────────────
SEO Agent PHẢI tuân thủ:

- internal-link-registry.yaml
- funnel handoff rules

SEO Agent KHÔNG được:

- Tạo link trái funnel
- Link tới bài chưa tồn tại
- Tự ý “gợi ý” BOFU khi chưa được phép

────────────────────────────────
⚠️ XỬ LÝ NGOẠI LỆ
────────────────────────────────
Nếu phát hiện:

- Sai intent
- Sai funnel
- Sai pillar
- Cấu trúc bài không khớp kế hoạch

→ SEO Agent CHỈ ĐƯỢC:

- Ghi chú cảnh báo
- Để QA xử lý

→ TUYỆT ĐỐI KHÔNG tự sửa nội dung.

────────────────────────────────
📎 QUY TẮC PHỐI HỢP
────────────────────────────────

- Writer chịu trách nhiệm nội dung
- SEO chịu trách nhiệm tối ưu
- QA có quyền BLOCK nếu SEO vượt phạm vi
- SEO rules này là nguồn đối chiếu cuối cùng

Ưu tiên:
ĐÚNG → CHẶT → LẶP LẠI ĐƯỢC  
hơn là:
ĐẸP → ĐỦ → CỐ LÀM
