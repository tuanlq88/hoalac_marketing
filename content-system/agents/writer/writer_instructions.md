# WRITER – RUN INSTRUCTIONS

## NGUỒN DỮ LIỆU BẮT BUỘC
- Kế hoạch nội dung: `content-system/plans/content_plan_2026w04.yaml`
- Chiến lược tổng thể: `content-system/content_strategy.md`
- Tuân thủ tuyệt đối: `content-system/agents/rules/fact_boundary.md`

==================================================

## KIỂM SOÁT THUẬT NGỮ NỘI BỘ & NGOẠI NGỮ

Nội dung bài viết hướng tới **NGƯỜI ĐỌC CUỐI**, không phải đội nội bộ.

Pillar Writer Agent BẮT BUỘC tuân thủ:

### TUYỆT ĐỐI KHÔNG ĐƯỢC XUẤT HIỆN
Các thuật ngữ nội bộ hoặc mang tính hệ thống, bao gồm nhưng không giới hạn:

- hub, pillar, cluster
- BOFU / MOFU / TOFU
- funnel, intent
- CTA (với tư cách thuật ngữ)
- conversion, KPI, traffic, lead
- bất kỳ khái niệm nào chỉ có ý nghĩa trong SEO / marketing nội bộ

Những từ này **chỉ được phép tồn tại trong prompt, plan, metadata nội bộ**  
→ KHÔNG ĐƯỢC xuất hiện trong body, heading, hoặc nội dung cho người đọc.

### NẾU BẮT BUỘC DÙNG KHÁI NIỆM
Phải chuyển sang **tiếng Việt – ngôn ngữ người đọc**, ví dụ:

- “giai đoạn BOFU” → “giai đoạn ra quyết định”
- “funnel” → “hành trình tìm hiểu”
- “conversion” → “quyết định mua / hành động cuối”
- “CTA” → “lời kêu gọi hành động” (hoặc diễn đạt tự nhiên, không gọi tên)

### NGOẠI NGỮ CHUYÊN NGÀNH
- Chỉ dùng khi:
  - Không có từ tiếng Việt tương đương phổ biến
- Nếu dùng:
  - BẮT BUỘC giải thích ngắn gọn ngay lần xuất hiện đầu tiên
  - Sau đó ưu tiên dùng tiếng Việt

### NGUYÊN TẮC CUỐI
Nếu một thuật ngữ:
- Chỉ có ý nghĩa với đội SEO / marketing
- Không mang giá trị trực tiếp cho người đọc

→ KHÔNG ĐƯỢC PHÉP xuất hiện trong nội dung.

==================================================

## QUY TRÌNH THỰC THI
1. Đọc file kế hoạch nội dung
2. Chọn **01 article chưa có bài viết tương ứng trong repo**
3. Sử dụng các field:
   - slug
   - title_working
   - pillar
   - search_intent
   - funnel_stage
   - primary_goal
4. Viết bài đúng intent và vai trò funnel
5. Tạo file Markdown hoàn chỉnh

## CẤU TRÚC FRONTMATTER BẮT BUỘC
- title
- slug
- pillar
- search_intent
- funnel_stage
- primary_goal
- week_plan (ví dụ: 2026w04)
- draft: false

## OUTPUT BẮT BUỘC
- Tạo **01 file Markdown**
- Lưu tại: `src/content/posts/{slug}.md`
- Không tạo file ở vị trí khác
- Không in lại toàn bộ nội dung bài viết trong chat nếu file đã được tạo thành công

==================================================

## XỬ LÝ KHI QA / FACT CHECK BLOCK

Mục này quy định **quy trình bắt buộc** cho Writer Agent khi bài viết bị  
**FACT CHECK** hoặc **QA** đánh dấu **WARNING / BLOCKING**.

==================================================

### NGUỒN YÊU CẦU SỬA (SOURCE OF TRUTH)

Writer Agent **CHỈ được phép** dựa trên các nguồn sau:

- `fact_check/reports/{slug}.report.md`
- Các báo cáo có : `content_type: post`
- Báo cáo QA tổng hợp (nếu có)

Writer Agent **TUYỆT ĐỐI KHÔNG** được dựa vào:
- Nhận định chủ quan
- Kế hoạch nội dung (`plans/*.yaml`)
- Suy đoán hoặc tự “cải thiện” ngoài phạm vi report

==================================================

### PHẠM VI ĐƯỢC PHÉP SỬA

Writer Agent **CHỈ được sửa** các nội dung:

- Các bài post trong thư mục `src/content/posts/**`
- Đã bị đánh dấu trong report:
  - FACT
  - CLAIM
  - LOGIC inconsistency
  - Vi phạm Fact Boundary
- Đoạn gây **BLOCKING** hoặc **WARNING**

Writer Agent **TUYỆT ĐỐI KHÔNG**:
- Sửa các bài trong thư mục `src/content/pillars/**`
- Viết lại toàn bộ bài
- Thêm ý mới
- Mở rộng nội dung ngoài phần bị yêu cầu sửa
- Tối ưu SEO, CTA, internal link nếu **không được yêu cầu rõ ràng**

==================================================

### CÁCH THỨC XỬ LÝ FACT / CLAIM

Nếu report đánh dấu **FUTURE FACT (BLOCKING)**:

Writer Agent **BẮT BUỘC chọn một** trong các cách sau:
- ❌ Xoá hoàn toàn câu / đoạn
- 🔁 Chuyển sang dạng giả định:
  - “có thể”
  - “trong trường hợp”
  - “phụ thuộc vào”
- 🔽 Hạ cấp từ **FACT → CLAIM trung tính**

Nếu report đánh dấu **CLAIM quá khẳng định (WARNING)**:
- Làm mềm ngôn ngữ
- Thêm điều kiện / giới hạn
- Loại bỏ từ ngữ mang tính kết luận

==================================================

### LOGIC INCONSISTENCY

Nếu report chỉ ra lỗi logic:
- Mâu thuẫn nội dung
- Nhảy kết luận
- So sánh không cùng tiêu chí

Writer Agent **CHỈ sửa đoạn gây lỗi**,  
**KHÔNG** tái cấu trúc toàn bài.

==================================================

### NHỮNG ĐIỀU TUYỆT ĐỐI KHÔNG ĐƯỢC LÀM

Trong quá trình sửa, Writer Agent **TUYỆT ĐỐI KHÔNG**:
- Thêm số liệu mới
- Thêm mốc thời gian
- Thêm dự án / địa danh cụ thể
- Thêm dẫn chứng dạng “theo báo cáo…”
- Thay đổi vai trò funnel của bài viết

==================================================

### CẬP NHẬT FACT_DECLARATION

Sau khi sửa xong, Writer Agent **BẮT BUỘC**:
- Giữ nguyên block `FACT_DECLARATION`
- Chỉ cập nhật nội dung nếu:
  - Trước đó vi phạm Fact Boundary
  - Nay đã được loại bỏ hoặc chuyển về dạng hợp lệ

==================================================

### QUY TRÌNH HOÀN TẤT

Sau khi sửa:
- Lưu lại file markdown gốc
- **KHÔNG** tạo file mới
- **KHÔNG** xoá report cũ
- Đánh dấu sẵn sàng để:
  - Chạy lại Fact Check
  - Chạy lại QA

Writer Agent **KHÔNG** tự kết luận PASS / FAIL.

==================================================

### NGUYÊN TẮC CUỐI CỦA VIỆC SỬA

- Writer sửa theo **báo cáo**, không sửa theo cảm giác
- Report là **mệnh lệnh kỹ thuật**, không phải gợi ý
- Mục tiêu:
  - Gỡ BLOCK
  - Giữ an toàn sự thật
  - Không làm lệch chiến lược nội dung
