# PIPELINE MAP – CONTENT SYSTEM HÒA LẠC

Tài liệu này mô tả TOÀN BỘ luồng vận hành nội dung,
không phải prompt chạy agent.

---

## 1. CÁC AGENT CỐT LÕI

### Writer Agent
- Nhiệm vụ: Viết bài mới
- Không:
  - Chèn CTA trong body
  - Quyết định chiến lược
- Output:
  - 1 file markdown hợp lệ

---

### SEO Agent
- Nhiệm vụ:
  - SEO on-page
  - SEO kỹ thuật
- Chỉ chỉnh:
  - title
  - description
  - heading
  - internal links
- Không viết lại nội dung

---

### Internal Link Architect
- Nhiệm vụ:
  - Tạo internal-link-registry.yaml
- Chỉ phản ánh:
  - Nội dung ĐÃ TỒN TẠI
- Không suy đoán tương lai

---

### CTA Engine
- Nhiệm vụ:
  - Render CTA dựa trên rule
- Input:
  - intent
  - funnel
  - allowed_cta
- Không quyết định chiến lược
- Không đọc markdown body

---

### QA Agent
- Nhiệm vụ:
  - Quyết định BUILD / NO BUILD
- Chỉ kiểm tra:
  - Nội dung ĐÃ TỒN TẠI
- Không block vì kế hoạch

---

## 2. PIPELINE VIẾT BÀI (WRITE PIPELINE)

Mục đích: Tạo **1 bài mới hoàn chỉnh**

Luồng:
1. Chọn bài từ content plan
2. Writer viết bài
3. SEO tối ưu
4. Gắn internal link hợp lệ
5. Output markdown

⚠️ Không:
- QA
- Build check
- CTA render

---

## 3. PIPELINE AUDIT (BUILD PIPELINE)

Mục đích: Quyết định **có được build hay không**

Luồng:
1. Linking audit
2. Funnel audit
3. CTA audit
4. QA gate
5. Kết luận BUILD / NO BUILD

---

## 4. NGUYÊN TẮC TỔNG

- Writer ≠ QA
- SEO ≠ chiến lược
- CTA Engine ≠ content
- Internal Link Registry = nguồn sự thật
- QA chỉ block khi:
  - File tồn tại
  - Vi phạm rule
  - Không có override hợp lệ
