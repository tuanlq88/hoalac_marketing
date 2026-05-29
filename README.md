# Tầm Nhìn Hòa Lạc

Website phân tích chiến lược bất động sản Hòa Lạc, kết hợp CRM lead qua Telegram bot.

**Stack**: Astro (hybrid) + Vercel Functions + Google Sheets + Telegram Bot + Upstash Redis

**Live**: [tamnhinhoalac.vn](https://tamnhinhoalac.vn)

## Architecture

```
Website (Astro static)          API (Vercel serverless)
├── Landing page                ├── /api/lead        ← form submission
├── Blog articles               ├── /api/telegram    ← Telegram webhook
├── Pillar pages                └── /api/cron/stale-check ← daily cron
└── Lead form (LeadForm.astro)
         │                              │
         └──── POST /api/lead ──────────┘
                                        │
                                   waitUntil()
                                   ├── Google Sheets (write lead + timeline)
                                   ├── Telegram Bot (send notification)
                                   └── Upstash Redis (dedupe + cache)
```

## Quick start

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # build for production
```

## Environment variables

### Local development (`.env`)

```
PUBLIC_LEAD_ENDPOINT=/api/lead
PUBLIC_ADMIN_USER=insight
PUBLIC_ADMIN_PASS=hoa-lac-2025
PUBLIC_DEFAULT_LEAD_TAG=pending_classification
```

### Vercel (Dashboard → Settings → Environment Variables)

| Key | Description |
|-----|-------------|
| `TELEGRAM_TOKEN` | Telegram Bot API token |
| `TELEGRAM_CHAT_ID` | Group chat ID for lead notifications |
| `SHEET_ID` | Google Sheets spreadsheet ID |
| `ADMIN_IDS` | Telegram user IDs (comma-separated) |
| `GOOGLE_SERVICE_ACCOUNT` | Service Account JSON key (full content) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
| `PUBLIC_LEAD_ENDPOINT` | `/api/lead` |

## Lead CRM flow

1. Visitor submits form → `POST /api/lead` → Google Sheets + Telegram notification
2. Sales clicks inline button on Telegram → `POST /api/telegram` (webhook)
3. Webhook returns 200 immediately, background `waitUntil()` handles:
   - `answerCallbackQuery` (toast feedback)
   - `editMessageText` (update status + buttons)
   - Google Sheets update + Timeline log
4. Status transitions: Mới → Đã nhận → Đang liên hệ → Dẫn khách → Đặt cọc → Thành công
5. Stale check runs daily at 8:00 UTC — edits original message if lead inactive >48h

## Key files

| Path | Purpose |
|------|---------|
| `src/pages/api/telegram.ts` | Telegram webhook handler |
| `src/pages/api/lead.ts` | Lead form submission handler |
| `src/pages/api/cron/stale-check.ts` | Daily stale lead check |
| `src/lib/telegram/config.ts` | Status map, transitions, constants |
| `src/lib/telegram/sheets.ts` | Google Sheets API helpers |
| `src/lib/telegram/telegram.ts` | Telegram Bot API helpers |
| `src/lib/telegram/cache.ts` | Upstash Redis cache/dedupe |
| `src/components/LeadForm.astro` | Lead capture form component |
| `apps-script/lead_webhook.gs` | Legacy Apps Script (fallback) |
| `vercel.json` | Cron schedule config |

## Deployment

- **Auto**: `git push` to `main` → Vercel builds + deploys automatically
- **Domain**: `tamnhinhoalac.vn` → Cloudflare DNS → Vercel

### Rollback to Apps Script

If Vercel has issues, switch Telegram webhook back to Apps Script:
```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=<APPS_SCRIPT_URL>&drop_pending_updates=true
```

## Content

- Articles: `src/content/articles/*.md`
- Pillar pages: `src/content/pillars/*.md`
- Add new content by creating Markdown files with frontmatter tags.
