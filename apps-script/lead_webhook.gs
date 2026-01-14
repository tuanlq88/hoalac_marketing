const TELEGRAM_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';
const TELEGRAM_CHAT_ID = 'YOUR_CHAT_ID';
const SHEET_ID = 'YOUR_SHEET_ID';

function doPost(e) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Leads');
  const p = e.parameter || {};
  const intent = p.intent || '';
  const budgetRange = p.budgetRange || '';
  const areas = p.areas || '';
  const legalRisk = p.legalRisk || '';
  const contact = p.contact ? `'${p.contact}` : '';
  const leadTag = p.leadTag || 'lead_cold';
  const source = p.source || '';
  const submittedAt = p.submittedAt || new Date().toISOString();

  sheet.appendRow([
    new Date(),
    intent,
    budgetRange,
    areas,
    legalRisk,
    contact,
    leadTag,
    source,
    submittedAt
  ]);

  Logger.log('Lead appended: %s', JSON.stringify({ leadTag, intent, contact, submittedAt }));
  Logger.log('Full payload: %s', JSON.stringify(p));

  if (leadTag === 'lead_hot') {
    const text = `🔥 Lead ${leadTag}:\nIntent: ${intent}\nTài chính: ${budgetRange}\nKhu vực: ${areas}\nPháp lý: ${legalRisk}\nLiên hệ: ${contact}`;
    doSendMessage(text);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ message: 'Đã ghi nhận thông tin, cảm ơn bạn!' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doSendMessage(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
    Logger.log('Telegram not configured.');
    return;
  }

  try {
    const response = UrlFetchApp.fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text }),
      muteHttpExceptions: true
    });
    Logger.log('Telegram response code: %s', response.getResponseCode());
    Logger.log('Telegram response body: %s', response.getContentText());
  } catch (error) {
    Logger.log('Telegram send failed: %s', error);
  }
}

function testDoSendMessage() {
  const text = '🔔 Test ping từ Apps Script (manual trigger).';
  doSendMessage(text);
}