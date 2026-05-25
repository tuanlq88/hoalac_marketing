const TELEGRAM_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';
const TELEGRAM_CHAT_ID = 'YOUR_CHAT_ID';
const SHEET_ID = 'YOUR_SHEET_ID';

// Column index (1-based). Adjust if sheet structure changes.
// A=SubmittedAt, B=Mục Đích, C=Budget, D=Ưu tiên, E=Xưng hô, F=SĐT, G=Phân Loại, H=Nguồn, I=Status, J=Cập nhật bởi, K=Cập nhật lúc
const COL_CONTACT = 6;     // F
const COL_NAME = 5;        // E
const COL_STATUS = 9;      // I
const COL_UPDATED_BY = 10; // J
const COL_UPDATED_AT = 11; // K

const STATUS_MAP = {
  '/called':  { label: 'Đã gọi',         icon: '📞' },
  '/nurture': { label: 'Đang chăm sóc',  icon: '🌱' },
  '/visit':   { label: 'Dẫn khách',      icon: '🚗' },
  '/deposit': { label: 'Đặt cọc',        icon: '💰' },
  '/cancel':  { label: 'Hủy cọc',        icon: '❌' },
  '/won':     { label: 'Thành công',      icon: '✅' },
  '/lost':    { label: 'Không thành',     icon: '💤' }
};

const LEAD_ICONS = {
  'lead_hot':  '🔥',
  'lead_warm': '🟡',
  'lead_cold': '🔵'
};

// ── MAIN: handles both form submissions and Telegram updates ──

function doPost(e) {
  const contentType = e.postData ? e.postData.type : '';

  // Telegram webhook sends JSON
  if (contentType === 'application/json') {
    return handleTelegramUpdate(e);
  }

  // Form submission sends URL-encoded
  return handleLeadSubmission(e);
}

// ── LEAD SUBMISSION (from website form) ──

function handleLeadSubmission(e) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Leads');
  const p = e.parameter || {};
  const submittedAt = p.submittedAt || '';
  const intent = p.intent || '';
  const budgetRange = p.budgetRange || '';
  const priority = p.priority || '';
  const name = p.name || '';
  const contact = p.contact ? "'" + p.contact : '';
  const leadTag = p.leadTag || 'lead_cold';
  const source = p.source || '';
  const contactSendTele = p.contact || '';

  sheet.appendRow([
    submittedAt,
    intent,
    budgetRange,
    priority,
    name,
    contact,
    leadTag,
    source,
    ''  // Status - empty initially
  ]);

  Logger.log('Lead appended: %s', JSON.stringify({ leadTag, intent, contact, submittedAt }));

  // Send Telegram notification for ALL leads
  var icon = LEAD_ICONS[leadTag] || '⚪';
  var text = icon + ' ' + leadTag + '\n'
    + 'Xưng hô: ' + name + '\n'
    + 'Mục tiêu: ' + intent + '\n'
    + 'Tài chính: ' + budgetRange + '\n'
    + 'Ưu tiên: ' + priority + '\n'
    + 'Liên hệ: ' + contactSendTele + '\n'
    + 'Nguồn: ' + source + '\n'
    + '\n↩️ Reply tin này với command:\n'
    + '/called · /nurture · /visit · /deposit\n'
    + '/cancel · /won · /lost · /help';
  doSendMessage(text);

  return ContentService
    .createTextOutput(JSON.stringify({ message: 'Đã ghi nhận thông tin, cảm ơn Anh/chị!' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── TELEGRAM WEBHOOK (reply commands) ──

function handleTelegramUpdate(e) {
  try {
    var update = JSON.parse(e.postData.contents);
    var message = update.message;
    if (!message || !message.text) return ok();

    var text = message.text.trim().toLowerCase();
    var chatId = message.chat.id;

    // /help command
    if (text === '/help' || text === '/start') {
      var helpText = '📋 Danh sách commands cập nhật trạng thái lead:\n\n'
        + '📞 /called — Đã gọi điện\n'
        + '🌱 /nurture — Đang chăm sóc, tư vấn\n'
        + '🚗 /visit — Đã/đang dẫn khách xem đất\n'
        + '💰 /deposit — Khách đặt cọc\n'
        + '❌ /cancel — Hủy cọc\n'
        + '✅ /won — Chốt giao dịch thành công\n'
        + '💤 /lost — Không thành / mất liên lạc\n'
        + '\nCách dùng: Reply vào tin nhắn lead → gõ command.';
      sendTelegramReply(chatId, helpText);
      return ok();
    }

    // Must be a reply to a lead notification
    if (!message.reply_to_message || !message.reply_to_message.text) {
      return ok();
    }

    var command = STATUS_MAP[text];
    if (!command) return ok();

    // Extract phone number from original lead message
    var originalText = message.reply_to_message.text;
    var phoneMatch = originalText.match(/Liên hệ:\s*(\d+)/);
    if (!phoneMatch) {
      sendTelegramReply(chatId, '⚠️ Không tìm thấy số điện thoại trong tin nhắn gốc.');
      return ok();
    }
    var phone = phoneMatch[1];

    // Who updated
    var from = message.from || {};
    var updatedBy = from.first_name || '';
    if (from.last_name) updatedBy += ' ' + from.last_name;
    if (from.username) updatedBy += ' (@' + from.username + ')';

    // Find and update in Sheet
    var result = updateLeadStatus(phone, command.label, updatedBy);
    if (result.found) {
      var reply = command.icon + ' Đã cập nhật: ' + result.name + ' (' + phone + ') → ' + command.label + '\nBởi: ' + updatedBy;
      sendTelegramReply(chatId, reply);
    } else {
      sendTelegramReply(chatId, '⚠️ Không tìm thấy lead với SĐT: ' + phone);
    }

  } catch (err) {
    Logger.log('Telegram handler error: %s', err);
  }

  return ok();
}

// ── UPDATE STATUS IN SHEET ──

function updateLeadStatus(phone, statusLabel, updatedBy) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Leads');
  var data = sheet.getDataRange().getValues();
  var now = new Date();
  var dd = String(now.getDate()).padStart(2, '0');
  var mm = String(now.getMonth() + 1).padStart(2, '0');
  var yyyy = now.getFullYear();
  var hh = String(now.getHours()).padStart(2, '0');
  var mi = String(now.getMinutes()).padStart(2, '0');
  var timestamp = dd + '/' + mm + '/' + yyyy + ' ' + hh + ':' + mi;

  // Search from bottom up (most recent lead first)
  for (var i = data.length - 1; i >= 1; i--) {
    var cellValue = String(data[i][COL_CONTACT - 1]).replace(/^'/, '');
    if (cellValue === phone) {
      var row = i + 1;
      sheet.getRange(row, COL_STATUS).setValue(statusLabel);
      sheet.getRange(row, COL_UPDATED_BY).setValue(updatedBy);
      sheet.getRange(row, COL_UPDATED_AT).setValue(timestamp);
      var name = data[i][COL_NAME - 1] || '';
      return { found: true, name: name };
    }
  }

  return { found: false, name: '' };
}

// ── TELEGRAM HELPERS ──

function doSendMessage(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
    Logger.log('Telegram not configured.');
    return;
  }
  try {
    UrlFetchApp.fetch('https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/sendMessage', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: text }),
      muteHttpExceptions: true
    });
  } catch (error) {
    Logger.log('Telegram send failed: %s', error);
  }
}

function sendTelegramReply(chatId, text) {
  try {
    UrlFetchApp.fetch('https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/sendMessage', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ chat_id: chatId, text: text }),
      muteHttpExceptions: true
    });
  } catch (error) {
    Logger.log('Telegram reply failed: %s', error);
  }
}

function ok() {
  return ContentService.createTextOutput('ok');
}

// ── SETUP: Run once to register Telegram webhook ──

function setWebhook() {
  var webAppUrl = ScriptApp.getService().getUrl();
  var response = UrlFetchApp.fetch(
    'https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/setWebhook?url=' + encodeURIComponent(webAppUrl)
  );
  Logger.log('setWebhook response: %s', response.getContentText());
}

function removeWebhook() {
  var response = UrlFetchApp.fetch(
    'https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/deleteWebhook'
  );
  Logger.log('deleteWebhook response: %s', response.getContentText());
}

// ── TEST ──

function testDoSendMessage() {
  doSendMessage('🔔 Test ping từ Apps Script.');
}
