# QA RULES

## 0. FACT CHECK HANDOFF (BẮT BUỘC)

- Với mỗi file markdown tồn tại:
  - QA PHẢI kiểm tra file:
    fact_check/reports/{slug}/latest.md

- Nếu KHÔNG tồn tại latest.md:
  - QA coi như CHƯA fact check
  - → BLOCKING (chưa đủ điều kiện QA)

- QA KHÔNG đọc file versioned
- QA KHÔNG so sánh nhiều report
- latest.md là nguồn sự thật DUY NHẤT

## 1. NGUYÊN TẮC NGUỒN SỰ THẬT
- CHỈ kiểm tra nội dung có file markdown thực sự tồn tại.
- File markdown hiện có là nguồn sự thật cao nhất về mặt cấu trúc & linking.
- plans/*.yaml chỉ là roadmap, KHÔNG dùng để block build.
- Không block build vì nội dung chưa viết.

## 2. PHẠM VI ÁP DỤNG
QA chỉ áp dụng cho:
- src/content/blog/** (file tồn tại)
- src/content/pillars/** (file tồn tại)

Các slug chỉ có trong:
- plans/*.yaml
- internal-link-registry.yaml  
→ được coi là PLANNED và BỎ QUA QA.

## 3. PHÂN LOẠI TRẠNG THÁI NỘI DUNG
- planned:
  - Có trong plan hoặc registry
  - KHÔNG có file markdown
  - → skip hoàn toàn

- drafted / published:
  - Có file markdown
  - → bắt buộc QA

## 4. RULE FUNNEL HANDOFF
Áp dụng CHỈ cho bài tồn tại:

- TOFU:
  - Phải link ≥ 1 MOFU
  - Không được link BOFU
  - Trừ khi có strategy_override hợp lệ

- MOFU:
  - Phải link ≥ 1 BOFU
  - HOẶC khai báo allow_no_bofu: true

- BOFU:
  - Không được link ngược TOFU / MOFU

## 5. RULE PILLAR LINKING
- Mỗi bài viết tồn tại:
  - BẮT BUỘC link về pillar hub của nó
- Thiếu pillar link:
  - → violation

## 6. RULE INTERNAL LINK
- Chỉ đánh violation khi:
  - Bài viết tồn tại
  - Link sai funnel hoặc thiếu link bắt buộc
- Violation trỏ tới slug không tồn tại:
  - → bỏ qua

## 7. RULE CTA
- CTA phải:
  - Phù hợp funnel
  - Nằm trong allowed_cta
- CTA bị suppress bởi strategy_override:
  - → WARNING, không block

## 8. STRATEGY OVERRIDE
Nếu frontmatter có:
- strategy_override.allow_no_bofu: true
- hoặc override hợp lệ khác

→ Violation liên quan funnel/link:
- HẠ CẤP thành WARNING
- KHÔNG block build

## 9. FACT CHECK INTEGRATION (BẮT BUỘC)
- Mỗi file markdown tồn tại PHẢI có FACT CHECK REPORT tương ứng.
- FACT CHECK REPORT là nguồn sự thật DUY NHẤT về:
  - tính xác thực
  - rủi ro logic
  - vi phạm fact boundary

QA Agent:
- KHÔNG tự đánh giá FACT / CLAIM
- KHÔNG tranh luận lại kết luận của Fact Check Agent

Nếu:
- Không có fact_check report
  → BLOCKING

## 10. PHÂN LOẠI MỨC ĐỘ
### BLOCKING
Chỉ khi TẤT CẢ đúng:
1. File markdown tồn tại
2. Vi phạm funnel / pillar / internal link
   HOẶC fact_check overall status = FAIL
3. KHÔNG có strategy_override hợp lệ

### WARNING
- Có strategy_override
- CTA bị suppress
- fact_check overall status = WARNING
- Không ảnh hưởng quyết định build

## 11. QUYẾT ĐỊNH BUILD
- Có ≥ 1 BLOCKING → Ready to build: NO
- Không có BLOCKING → Ready to build: YES
- Nếu latest.md.status = FAIL
  → Ready to build: NO (BLOCKING)

- Nếu latest.md.status = WARNING
  → Không block build
  → QA vẫn tiếp tục kiểm tra funnel / linking

- Nếu latest.md.status = PASS
  → QA tiếp tục quy trình bình thường

## 12. NGUYÊN TẮC CUỐI
- Nghiêm với nội dung đã tồn tại
- Khoan dung với kế hoạch
- Không suy đoán tương lai
- QA phản ánh THỰC TRẠNG, không áp đặt kỳ vọng
