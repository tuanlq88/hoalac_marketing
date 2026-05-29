import type { APIRoute } from 'astro';
import { INTENT_LABELS, BUDGET_LABELS, PRIORITY_LABELS, LEAD_ICONS, buildButtons, vnDateTime } from '../../lib/telegram/config';
import { findLeadByPhone, generateLeadId, appendLead, updateExistingLead, logTimeline } from '../../lib/telegram/sheets';
import { sendWithButtons } from '../../lib/telegram/telegram';
import { saveMessageId } from '../../lib/telegram/cache';

const TELEGRAM_CHAT_ID = import.meta.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID || '';

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    let p: Record<string, string> = {};

    if (contentType.includes('application/json')) {
      p = await request.json();
    } else {
      const formData = await request.formData().catch(() => null);
      if (formData) {
        formData.forEach((value, key) => { p[key] = String(value); });
      } else {
        const text = await request.text();
        const params = new URLSearchParams(text);
        params.forEach((value, key) => { p[key] = value; });
      }
    }

    if (p.company) {
      return json({ message: 'Đã chặn spam.' }, 400);
    }

    const submittedAt = p.submittedAt || vnDateTime();
    const rawContact = p.contact || '';
    const name = p.name || '';
    const intentLabel = INTENT_LABELS[p.intent] || p.intent || '';
    const budgetLabel = BUDGET_LABELS[p.budgetRange] || p.budgetRange || '';
    const priorityLabel = PRIORITY_LABELS[p.priority] || p.priority || '';
    const leadTag = p.leadTag || 'lead_cold';
    const source = p.source || '';
    const readingContext = p.readingContext || '';

    const existing = rawContact ? await findLeadByPhone(rawContact) : null;

    if (existing && existing.found) {
      const newCount = existing.submitCount + 1;
      await updateExistingLead(
        existing.row, submittedAt, intentLabel, budgetLabel, priorityLabel,
        leadTag, source, newCount, readingContext,
      );
      await logTimeline(existing.leadId, rawContact, 'Gửi lại form', `${intentLabel} | ${budgetLabel} | ${priorityLabel}`);

      const icon = LEAD_ICONS[leadTag] || '⚪';
      const text = `♻️ Người đọc quay lại [${existing.leadId}]\n`
        + `👤 ${name}\n`
        + `🎯 ${intentLabel} | 💰 ${budgetLabel}\n`
        + `⭐ ${priorityLabel}\n`
        + `📄 ${source}\n`
        + `🔢 Lần thứ: ${newCount}\n`
        + (readingContext ? `\n📖 Hành vi đọc:\n${readingContext}\n` : '')
        + `\n${icon} ${leadTag}`
        + `\n\n↓ Bấm nút bên dưới để cập nhật trạng thái`;

      const buttons = buildButtons(existing.leadId, existing.status);
      const msgId = await sendWithButtons(text, buttons, TELEGRAM_CHAT_ID);
      if (msgId) await saveMessageId(existing.leadId, msgId);

      return json({ message: 'Cảm ơn Anh/chị, thông tin đã được cập nhật!' });
    }

    const leadId = await generateLeadId();
    const contact = rawContact ? `'${rawContact}` : '';

    await appendLead([
      leadId, submittedAt, submittedAt, intentLabel, budgetLabel, priorityLabel,
      name, contact, leadTag, source,
      '', '', '', '', '',
      '1', readingContext,
    ]);
    await logTimeline(leadId, rawContact, 'Lead mới', `${intentLabel} | ${budgetLabel} | ${priorityLabel}`);

    const icon = LEAD_ICONS[leadTag] || '⚪';
    const text = `📥 Lead mới [${leadId}]\n`
      + `👤 ${name}\n`
      + `🎯 ${intentLabel} | 💰 ${budgetLabel}\n`
      + `⭐ ${priorityLabel}\n`
      + `📄 ${source}\n`
      + (readingContext ? `\n📖 Hành vi đọc:\n${readingContext}\n` : '')
      + `\n${icon} ${leadTag}`
      + `\n\n↓ Bấm nút bên dưới để cập nhật trạng thái`;

    const buttons = buildButtons(leadId, '');
    const msgId = await sendWithButtons(text, buttons, TELEGRAM_CHAT_ID);
    if (msgId) await saveMessageId(leadId, msgId);

    return json({ message: 'Đã ghi nhận thông tin, cảm ơn Anh/chị!' });
  } catch (err) {
    console.error('Lead submission error:', err);
    return json({ message: 'Lỗi hệ thống, vui lòng thử lại.' }, 500);
  }
};

function json(data: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
