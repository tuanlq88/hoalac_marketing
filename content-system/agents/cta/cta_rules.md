# CTA RULES

Tài liệu này định nghĩa **LUẬT CTA DUY NHẤT** cho website Astro
chuyên về bất động sản Hòa Lạc.

CTA được render **tự động ở runtime** dựa trên frontmatter.
Writer và SEO **KHÔNG chèn CTA bằng tay**.

---

## 1. INPUT CTA (READ ONLY)

CTA Engine chỉ đọc các field sau từ frontmatter:

intent: informational | commercial | transactional  
funnel: TOFU | MOFU | BOFU  
allowed_cta: tofu | mofu | bofu | none  

allowed_cta là **GIỚI HẠN CAO NHẤT**.

---

## 2. QUY TẮC THEO FUNNEL

### TOFU
Mục tiêu: giáo dục – cung cấp thông tin

- CTA được phép: tofu
- CTA bị cấm: mofu, bofu

Allowed:
- tofu
- none

---

### MOFU
Mục tiêu: phân tích – so sánh – đánh giá

- CTA được phép: tofu, mofu
- Có thể KHÔNG bán

Allowed:
- tofu
- mofu
- none

---

### BOFU
Mục tiêu: chuyển đổi – hành động

- CTA được phép: bofu
- Không kéo ngược funnel

Allowed:
- bofu

---

## 3. LOGIC RESOLVE CTA

CTA Engine resolve theo thứ tự:

1. allowed_cta  
2. funnel  
3. intent  

Nếu không có rule phù hợp → **KHÔNG render CTA**

Render sai CTA **tệ hơn** không render CTA.

---

## 4. MOFU KHÔNG BÁN (BẮT BUỘC KHAI BÁO)

Nếu MOFU chỉ dùng để educate, phải khai báo trong frontmatter:

allowed_cta: none  
strategy_override: educate_only  
review_after: YYYY-MM-DD  

QA sẽ đánh WARNING, không FAIL.

---

## 5. TUYỆT ĐỐI KHÔNG ĐƯỢC

- Không render CTA theo slug
- Không đọc nội dung markdown
- Không tự suy diễn chiến lược
- Không override allowed_cta
- Không thêm CTA ngoài rule

CTA Engine **chỉ thực thi luật**, không sáng tạo.
