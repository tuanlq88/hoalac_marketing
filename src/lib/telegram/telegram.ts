const TELEGRAM_API = 'https://api.telegram.org/bot';

function getToken(): string {
  return import.meta.env.TELEGRAM_TOKEN || process.env.TELEGRAM_TOKEN || '';
}

function getChatId(): string {
  return import.meta.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID || '';
}

async function telegramPost(method: string, body: Record<string, unknown>): Promise<any> {
  const resp = await fetch(`${TELEGRAM_API}${getToken()}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return resp.json();
}

export async function answerCallback(callbackQueryId: string, text: string): Promise<void> {
  await telegramPost('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text,
    show_alert: false,
  });
}

export async function sendWithButtons(
  text: string,
  keyboard: Array<Array<{ text: string; callback_data: string }>>,
  chatId?: string,
): Promise<string | null> {
  const payload: Record<string, unknown> = { chat_id: chatId || getChatId(), text };
  if (keyboard.length > 0) {
    payload.reply_markup = { inline_keyboard: keyboard };
  }
  const result = await telegramPost('sendMessage', payload);
  return result?.ok && result?.result ? String(result.result.message_id) : null;
}

export async function editMessage(
  chatId: string,
  messageId: string,
  text: string,
  keyboard: Array<Array<{ text: string; callback_data: string }>>,
): Promise<boolean> {
  const payload: Record<string, unknown> = { chat_id: chatId, message_id: messageId, text };
  if (keyboard.length > 0) {
    payload.reply_markup = { inline_keyboard: keyboard };
  }
  const result = await telegramPost('editMessageText', payload);
  return !!result?.ok;
}

export async function sendMessage(text: string): Promise<void> {
  await telegramPost('sendMessage', { chat_id: getChatId(), text });
}
