# Insight Hòa Lạc Landing

Landing page viết bằng [Astro](https://astro.build) để thử nghiệm GitHub Pages + funnel marketing cho thị trường đất Hòa Lạc.

## Tính năng chính
- Bài viết tĩnh lưu trong `src/content/articles` (Markdown + frontmatter tags lead).
- Form thu lead phân loại nóng/ấm/lạnh, gửi dữ liệu đến webhook (Google Apps Script) và ping Telegram khi lead nóng.
- Bộ component tái sử dụng (Hero, TagLegend, ArticleList, LeadForm) phục vụ landing và trang blog.
- Sẵn sàng SEO: metadata cơ bản, robots.txt, sitemap tự động do Astro generate.
- Route `/ops` dành cho admin với đăng nhập cố định (config qua biến môi trường), hiển thị TagLegend và checklist automation.

## Chạy cục bộ
```bash
npm install
npm run dev
```
Site mặc định chạy tại `http://localhost:4321`.

## Biến môi trường
1. Sao chép `.env.example` thành `.env` và cập nhật thông số thực tế:
```
PUBLIC_LEAD_ENDPOINT=https://script.google.com/macros/s/xxx/exec
PUBLIC_ADMIN_USER=insight
PUBLIC_ADMIN_PASS=hoa-lac-2025
PUBLIC_DEFAULT_LEAD_TAG=pending_classification
```
2. Khi deploy GitHub Pages: vào **Settings → Pages → Environment variables** và khai báo cùng các biến `PUBLIC_*` như trên để workflow build sử dụng.

`PUBLIC_LEAD_ENDPOINT` nên là Apps Script (hoặc Cloud Function) xử lý ghi Google Sheet + gọi Telegram/Zalo OA. Các biến `PUBLIC_ADMIN_*` dùng cho route `/ops`, có thể thay bằng giá trị riêng trước khi build.

## Apps Script mẫu
Tham khảo `apps-script/lead_webhook.gs`. Thay `SHEET_ID`, `TELEGRAM_TOKEN`, `TELEGRAM_CHAT_ID` rồi deploy dạng web app (cho phép anyone). Script:
- Parse payload JSON.
- Append hàng vào Sheet `Leads`.
- Nếu `leadTag === "lead_hot"` thì gọi Telegram Bot API thông báo.

## Triển khai GitHub Pages
1. Push toàn bộ thư mục này lên repo GitHub (có thể đặt tên `username.github.io`).
2. Bật Pages → nguồn `GitHub Actions`.
3. GitHub sẽ tự tạo workflow build Astro → publish.
4. Thêm custom domain nếu cần và cấu hình DNS (CNAME hoặc A record).

## Tiếp tục phát triển
- Thêm bài viết bằng cách tạo file Markdown mới trong `src/content/articles`.
- Mở rộng form (thêm trường, reCAPTCHA) tại `src/components/LeadForm.astro`.
- Nếu muốn trang dashboard, tạo route mới và fetch dữ liệu từ Google Sheets API.
