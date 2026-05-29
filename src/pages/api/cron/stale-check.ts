export const prerender = false;
import type { APIRoute } from 'astro';
import { STATUS_REASSIGN, vnDateTime } from '../../../lib/telegram/config';
import { editMessage, sendWithButtons } from '../../../lib/telegram/telegram';
import { getSheetData } from '../../../lib/telegram/sheets';
import { isDuplicate, getMessageId } from '../../../lib/telegram/cache';

const TELEGRAM_CHAT_ID = import.meta.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID || '';

export const GET: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('authorization');
  const cronSecret = import.meta.env.CRON_SECRET || process.env.CRON_SECRET || '';
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const data = await getSheetData('Leads');
    const now = Date.now();
    let notified = 0;

    for (let i = 1; i < data.length; i++) {
      const status = data[i][10] || '';
      const ownerId = String(data[i][13] || '');
      const updatedAt = String(data[i][12] || '');
      if (!status || !ownerId || status === 'Thành công' || status === 'Không thành') continue;

      const parts = updatedAt.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
      if (!parts) continue;
      const lastUpdate = new Date(Number(parts[3]), Number(parts[2]) - 1, Number(parts[1]), Number(parts[4]), Number(parts[5]));
      const hoursAgo = Math.floor((now - lastUpdate.getTime()) / (1000 * 60 * 60));
      if (hoursAgo < 48) continue;

      const leadId = data[i][0];
      if (await isDuplicate(`stale:${leadId}`, 86400)) continue;

      const name = data[i][6];
      const owner = data[i][14];
      const keyboard = [[{ text: '🔄 Mở khóa lead', callback_data: `${STATUS_REASSIGN}:${leadId}` }]];
      const msgId = await getMessageId(leadId);

      if (msgId) {
        const editText = `⏰ [${leadId}] Quá hạn ${hoursAgo} giờ\n👤 ${name}\n📌 ${status} — ${owner}\n🕐 Lần cuối: ${updatedAt}`;
        await editMessage(TELEGRAM_CHAT_ID, msgId, editText, keyboard);
      } else {
        const text = `⏰ Lead quá hạn [${leadId}]\n👤 ${name}\n📌 Trạng thái: ${status}\n👷 Owner: ${owner}\n🕐 Không cập nhật: ${hoursAgo} giờ`;
        await sendWithButtons(text, keyboard);
      }
      notified++;
    }

    return new Response(JSON.stringify({ checked: data.length - 1, notified }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Stale check error:', err);
    return new Response('Error', { status: 500 });
  }
};
