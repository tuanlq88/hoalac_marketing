export const prerender = false;
import type { APIRoute } from 'astro';
import { waitUntil } from '@vercel/functions';
import { STATUS_MAP, ALLOWED_TRANSITIONS, STATUS_REASSIGN, ACTION_CHECK, buildButtons, checkOwnership, vnDateTime } from '../../lib/telegram/config';
import { answerCallback, editMessage, sendWithButtons, sendMessage } from '../../lib/telegram/telegram';
import { findLeadById, updateLeadStatus, clearOwnerStatus, logTimeline, getSheetData } from '../../lib/telegram/sheets';
import { isDuplicate, saveMessageId, getMessageId } from '../../lib/telegram/cache';

const ADMIN_IDS = (import.meta.env.ADMIN_IDS || process.env.ADMIN_IDS || '').split(',').map(Number).filter(Boolean);

export const POST: APIRoute = async ({ request }) => {
  try {
    const update = await request.json();
    const updateId = String(update.update_id || '');

    if (updateId && await isDuplicate(`upd:${updateId}`, 60)) {
      return new Response('ok');
    }

    if (update.callback_query) {
      waitUntil(handleCallback(update.callback_query));
    }
  } catch (err) {
    console.error('Telegram handler error:', err);
  }

  return new Response('ok');
};

async function handleCallback(query: any): Promise<void> {
  const callbackId = query.id;
  const from = query.from || {};
  const userId = String(from.id);
  let userName = from.first_name || '';
  if (from.last_name) userName += ' ' + from.last_name;
  let userLabel = userName;
  if (from.username) userLabel += ` (@${from.username})`;
  const messageId = query.message?.message_id ? String(query.message.message_id) : null;
  const chatId = query.message?.chat?.id ? String(query.message.chat.id) : null;

  const [action, leadId] = (query.data || '').split(':');

  if (action === ACTION_CHECK) {
    await answerCallback(callbackId, '🔍 Đang kiểm tra...');
    if (!ADMIN_IDS.includes(Number(userId))) return;
    if (await isDuplicate('check_running', 30)) return;
    await runStaleCheck();
    return;
  }

  if (action === STATUS_REASSIGN) {
    if (!ADMIN_IDS.includes(Number(userId))) {
      await answerCallback(callbackId, '🚫 Chỉ admin mới được mở khóa.');
      return;
    }
    await answerCallback(callbackId, '🔄 Đang mở khóa...');
    const info = await findLeadById(leadId);
    if (!info.found) return;
    await clearOwnerStatus(info.row);
    await logTimeline(leadId, info.phone, 'Mở khóa lead', 'Admin');
    if (chatId) {
      const text = `🔄 Đã mở khóa [${leadId}] — ${info.leadName}\n👤 ${userLabel} (${vnDateTime()})\n\n↓ Bấm nút bên dưới để nhận lead`;
      await sendWithButtons(text, buildButtons(leadId, ''), chatId);
    }
    return;
  }

  const command = STATUS_MAP[action];
  if (!command || !leadId) {
    await answerCallback(callbackId, '⚠️ Dữ liệu không hợp lệ');
    return;
  }

  const rowInfo = await findLeadById(leadId);
  if (!rowInfo.found) {
    await answerCallback(callbackId, '❌ Không tìm thấy lead.');
    return;
  }

  const allowed = ALLOWED_TRANSITIONS[rowInfo.status] || [];
  if (allowed.length > 0 && !allowed.includes(action)) {
    await answerCallback(
      callbackId,
      `⚠️ Lead đã ở trạng thái "${rowInfo.status}". Mở message mới nhất để cập nhật.`,
    );
    if (chatId && messageId) {
      const originalText = query.message.text || '';
      await editMessage(chatId, messageId, originalText, buildButtons(leadId, rowInfo.status));
    }
    return;
  }

  const ownerCheck = checkOwnership(rowInfo, userId, action);
  if (ownerCheck.blocked) {
    await answerCallback(callbackId, ownerCheck.message || '🚫 Không có quyền.');
    return;
  }

  if (await isDuplicate(`click:${leadId}:${action}`, 30)) {
    await answerCallback(callbackId, '⏳ Đang xử lý...');
    return;
  }

  await answerCallback(callbackId, `${command.icon} ${command.label} — đang cập nhật...`);

  if (messageId && chatId) {
    const originalText = query.message.text || '';
    const statusLine = `\n\n${command.icon} ${command.label} — ${userLabel} (${vnDateTime()})`;
    const cleanText = originalText.replace(/\n\n[👀📞🚗💰✅💤❌].+$/s, '').replace(/\n\n↓ Bấm nút bên dưới để cập nhật trạng thái/, '');
    const newButtons = buildButtons(leadId, command.label);
    await editMessage(chatId, messageId, cleanText + statusLine, newButtons);
    await saveMessageId(leadId, messageId);
  }

  await updateLeadStatus(rowInfo.row, command.label, userLabel, userId, userName);
  await logTimeline(leadId, rowInfo.phone, command.label, userLabel);
}

async function runStaleCheck(): Promise<void> {
  const data = await getSheetData('Leads');
  const now = Date.now();

  for (let i = 1; i < data.length; i++) {
    const status = data[i][10] || '';
    const ownerId = String(data[i][13] || '');
    const updatedAt = String(data[i][12] || '');
    if (!status || !ownerId || status === 'Thành công' || status === 'Không thành') continue;

    const parts = updatedAt.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
    if (!parts) continue;
    const lastUpdate = new Date(`${parts[3]}-${parts[2]}-${parts[1]}T${parts[4]}:${parts[5]}:00+07:00`);
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
      await editMessage(String(import.meta.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID), msgId, editText, keyboard);
    } else {
      const text = `⏰ Lead quá hạn [${leadId}]\n👤 ${name}\n📌 Trạng thái: ${status}\n👷 Owner: ${owner}\n🕐 Không cập nhật: ${hoursAgo} giờ`;
      await sendWithButtons(text, keyboard);
    }
  }
}
