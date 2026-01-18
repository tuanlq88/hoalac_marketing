# PILLAR WRITER – INSTRUCTIONS

Tài liệu này hướng dẫn chi tiết cho **Pillar Writer Agent** khi viết
Pillar Hub Page cho website bất động sản (Astro-based).

==================================================

## 1. VAI TRÒ CỦA PILLAR PAGE

Pillar page là:
- Trang nội dung nền tảng
- Bao quát một **chủ đề lớn**
- Đóng vai trò **hub điều hướng** cho các bài blog chi tiết

Pillar page **KHÔNG**:
- Bán hàng
- Thu lead
- Gắn CTA
- Đóng vai landing page

==================================================

## 2. CẤU TRÚC BÀI VIẾT BẮT BUỘC

### 2.1 Mở đầu – Tổng quan chủ đề
- Giới thiệu bối cảnh chung
- Vì sao chủ đề này quan trọng với người tìm hiểu BĐS Hòa Lạc
- Định vị phạm vi nội dung của pillar

---

### 2.2 Các nhóm nội dung chính
- Chia theo **nhóm vấn đề**
- Mỗi nhóm:
  - Giải thích khái niệm
  - Làm rõ phạm vi – ranh giới
  - Dẫn link xuống các bài blog liên quan (nếu có)

---

### 2.3 Điều hướng học tập
- Hướng dẫn người đọc:
  - nên đọc bài nào trước
  - nên đọc tiếp nội dung nào
- Tất cả link:
  - CHỈ trỏ tới bài blog đã tồn tại

---

### 2.4 Tổng kết định hướng
- Tóm tắt bức tranh tổng thể
- Củng cố hiểu biết
- KHÔNG kêu gọi hành động
- KHÔNG CTA trá hình

==================================================

## 3. ĐỘ DÀI & VĂN PHONG

- Độ dài khuyến nghị:
  - 2.500 – 4.000 từ
- Văn phong:
  - Trung lập
  - Giải thích
  - Định hướng kiến thức
- Tránh:
  - Giật tít
  - Thúc ép hành động
  - Ngôn ngữ bán hàng

==================================================

## 4. INTERNAL LINKING RULES

- Chỉ link tới:
  - Các bài blog **ĐÃ TỒN TẠI** trong `src/content/blog/**`
- Không được:
  - Link tới slug chưa tồn tại
  - Link theo kế hoạch tương lai
- Anchor text:
  - Mang tính mô tả nội dung
  - Không mang tính chuyển đổi

==================================================

## 5. FRONTMATTER BẮT BUỘC

Mỗi pillar page phải có frontmatter như sau:

```yaml
title:
slug:
pillar: self
intent: informational
funnel: TOFU | MIXED
draft: false
```

Giải thích:
- pillar: self để hệ thống nhận diện đây là hub
- Không khai báo allowed_cta
- Không khai báo strategy_override

==================================================

## 6. CHECKLIST TRƯỚC KHI HOÀN THÀNH

- Nội dung đúng vai trò pillar (không bán hàng)
- Không có CTA dưới mọi hình thức
- Chỉ link tới bài blog đã tồn tại
- Đã link đầy đủ các bài support liên quan
- Văn phong trung lập – định hướng kiến thức
- Frontmatter đầy đủ & đúng chuẩn

==================================================

## 7. NGUYÊN TẮC CUỐI

- Pillar page tồn tại để:
  - Xây dựng authority
  - Hệ thống hoá kiến thức
  - Điều hướng nội dung
-KHÔNG tồn tại để:
  - Chốt sale
  - Thu lead
  - Thao túng funnel