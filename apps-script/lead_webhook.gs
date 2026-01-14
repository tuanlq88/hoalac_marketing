const TELEGRAM_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';
const TELEGRAM_CHAT_ID = 'YOUR_CHAT_ID';
const SHEET_ID = 'YOUR_SHEET_ID';

function doPost(e) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Leads');
  const payload = JSON.parse(e.postData.contents);
  const { leadTag = 'lead_cold', ...rest } = payload;

  const row = [
    new Date(),
    rest.fullName || '',
    rest.phone || '',
    rest.email || '',
    rest.budget || '',
    rest.note || '',
    leadTag,
    rest.source || '',
    rest.submittedAt || new Date().toISOString()
  ];
  sheet.appendRow(row);

  if (leadTag === 'lead_hot') {
    notifyTelegram(rest, leadTag);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ message: 'Đã ghi nhận thông tin, cảm ơn bạn!' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function notifyTelegram(lead, tag) {
  const text = `🔥 Lead ${tag} mới:\nTên: ${lead.fullName}\nPhone: ${lead.phone}\nNgân sách: ${lead.budget}\nNhu cầu: ${lead.note}`;
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const payload = {
    chat_id: TELEGRAM_CHAT_ID,
    text,
    parse_mode: 'Markdown'
  };
  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  });
}
