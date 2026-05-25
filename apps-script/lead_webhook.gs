const TELEGRAM_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';
const TELEGRAM_CHAT_ID = 'YOUR_CHAT_ID';
const SHEET_ID = 'YOUR_SHEET_ID';

// Admin Telegram user IDs — only these users can /reassign
const ADMIN_IDS = []; // e.g. [123456789, 987654321]

// Column index (1-based).
// A=Lead ID, B=SubmittedAt, C=Mục Đích, D=Budget, E=Ưu tiên, F=Xưng hô, G=SĐT,
// H=Phân Loại, I=Nguồn, J=Status, K=Cập nhật bởi, L=Cập nhật lúc, M=Owner ID, N=Owner Name
const COL_LEAD_ID = 1;
const COL_NAME = 6;
const COL_CONTACT = 7;
const COL_STATUS = 10;
const COL_UPDATED_BY = 11;
const COL_UPDATED_AT = 12;
const COL_OWNER_ID = 13;
const COL_OWNER_NAME = 14;

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

// ── MAIN ──

function doPost(e) {
  var contentType = e.postData ? e.postData.type : '';
  if (contentType === 'application/json') {
    return handleTelegramUpdate(e);
  }
  return handleLeadSubmission(e);
}

// ── LEAD SUBMISSION ──

function handleLeadSubmission(e) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Leads');
  var p = e.parameter || {};
  var submittedAt = p.submittedAt || '';
  var intent = p.intent || '';
  var budgetRange = p.budgetRange || '';
  var priority = p.priority || '';
  var name = p.name || '';
  var contact = p.contact ? "'" + p.contact : '';
  var leadTag = p.leadTag || 'lead_cold';
  var source = p.source || '';
  var contactSendTele = p.contact || '';

  var leadId = generateLeadId(sheet);

  sheet.appendRow([
    leadId, submittedAt, intent, budgetRange, priority, name, contact, leadTag, source,
    '', '', '', '', '' // Status, Cập nhật bởi, Cập nhật lúc, Owner ID, Owner Name
  ]);

  var icon = LEAD_ICONS[leadTag] || '⚪';
  var text = icon + ' ' + leadTag + ' [' + leadId + ']\n'
    + 'Xưng hô: ' + name + '\n'
    + 'Mục tiêu: ' + intent + '\n'
    + 'Tài chính: ' + budgetRange + '\n'
    + 'Ưu tiên: ' + priority + '\n'
    + 'Liên hệ: ' + contactSendTele + '\n'
    + 'Nguồn: ' + source + '\n'
    + '\n↩️ Reply /called để nhận lead này\n'
    + 'Gõ /help để xem tất cả commands';
  doSendMessage(text);

  return ContentService
    .createTextOutput(JSON.stringify({ message: 'Đã ghi nhận thông tin, cảm ơn Anh/chị!' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── TELEGRAM WEBHOOK ──

function handleTelegramUpdate(e) {
  try {
    var update = JSON.parse(e.postData.contents);
    var message = update.message;
    if (!message || !message.text) return ok();

    var text = message.text.trim().toLowerCase();
    var chatId = message.chat.id;
    var from = message.from || {};
    var userId = from.id;
    var userName = from.first_name || '';
    if (from.last_name) userName += ' ' + from.last_name;
    var userLabel = userName;
    if (from.username) userLabel += ' (@' + from.username + ')';

    // /help or /start
    if (text === '/help' || text === '/start') {
      var helpText = '📋 Commands cập nhật trạng thái lead:\n\n'
        + '📞 /called — Nhận lead + đánh dấu đã gọi\n'
        + '🌱 /nurture — Đang chăm sóc, tư vấn\n'
        + '🚗 /visit — Dẫn khách xem đất\n'
        + '💰 /deposit — Khách đặt cọc\n'
        + '❌ /cancel — Hủy cọc\n'
        + '✅ /won — Chốt giao dịch thành công\n'
        + '💤 /lost — Không thành / mất liên lạc\n'
        + '🔄 /reassign — Chuyển lead cho người khác (admin)\n'
        + '\n📌 Cách dùng:\n'
        + '1. Reply vào tin nhắn lead\n'
        + '2. Gõ command\n'
        + '\n⚠️ /called đầu tiên = nhận ownership\n'
        + 'Sau đó chỉ owner mới được cập nhật tiếp.';
      sendTelegramReply(chatId, helpText);
      return ok();
    }

    // Must reply to a lead message
    if (!message.reply_to_message || !message.reply_to_message.text) {
      return ok();
    }

    var originalText = message.reply_to_message.text;
    var phoneMatch = originalText.match(/Liên hệ:\s*(\d+)/);
    if (!phoneMatch) {
      sendTelegramReply(chatId, '⚠️ Không tìm thấy SĐT trong tin nhắn gốc.');
      return ok();
    }
    var phone = phoneMatch[1];

    // /reassign — admin only
    if (text.indexOf('/reassign') === 0) {
      if (ADMIN_IDS.indexOf(userId) === -1) {
        sendTelegramReply(chatId, '🚫 Chỉ admin mới được dùng /reassign.');
        return ok();
      }
      var result = clearOwner(phone);
      if (result.found) {
        sendTelegramReply(chatId, '🔄 Đã mở khóa lead ' + result.name + ' (' + phone + '). Ai reply /called tiếp sẽ nhận ownership.');
      } else {
        sendTelegramReply(chatId, '⚠️ Không tìm thấy lead với SĐT: ' + phone);
      }
      return ok();
    }

    // Status commands
    var command = STATUS_MAP[text];
    if (!command) return ok();

    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Leads');
    var rowInfo = findLeadRow(sheet, phone);

    if (!rowInfo.found) {
      sendTelegramReply(chatId, '⚠️ Không tìm thấy lead với SĐT: ' + phone);
      return ok();
    }

    var currentOwnerId = rowInfo.ownerId;

    // /called — assign ownership if no owner yet
    if (text === '/called') {
      if (currentOwnerId && currentOwnerId !== String(userId)) {
        sendTelegramReply(chatId, '🚫 Lead này đang do ' + rowInfo.ownerName + ' chăm sóc.\nLiên hệ admin để /reassign nếu cần.');
        return ok();
      }
      updateRow(sheet, rowInfo.row, command.label, userLabel, userId, userName);
      sendTelegramReply(chatId, command.icon + ' Đã nhận lead: ' + rowInfo.leadName + ' (' + phone + ') → ' + command.label + '\n👤 Owner: ' + userLabel);
      return ok();
    }

    // Other commands — only owner can update
    if (!currentOwnerId) {
      sendTelegramReply(chatId, '⚠️ Lead chưa có người nhận. Reply /called trước để nhận ownership.');
      return ok();
    }
    if (currentOwnerId !== String(userId)) {
      sendTelegramReply(chatId, '🚫 Lead này đang do ' + rowInfo.ownerName + ' chăm sóc.\nChỉ owner mới được cập nhật status.');
      return ok();
    }

    updateRow(sheet, rowInfo.row, command.label, userLabel, userId, userName);
    sendTelegramReply(chatId, command.icon + ' Đã cập nhật: ' + rowInfo.leadName + ' (' + phone + ') → ' + command.label + '\nBởi: ' + userLabel);

  } catch (err) {
    Logger.log('Telegram handler error: %s', err);
  }

  return ok();
}

// ── SHEET HELPERS ──

function generateLeadId(sheet) {
  var lastRow = sheet.getLastRow();
  var seq = 1;
  if (lastRow >= 2) {
    var lastId = String(sheet.getRange(lastRow, COL_LEAD_ID).getValue());
    var numMatch = lastId.match(/(\d+)$/);
    if (numMatch) seq = parseInt(numMatch[1], 10) + 1;
  }
  return 'HL-' + String(seq).padStart(4, '0');
}

function findLeadRow(sheet, phone) {
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    var cellValue = String(data[i][COL_CONTACT - 1]).replace(/^'/, '');
    if (cellValue === phone) {
      return {
        found: true,
        row: i + 1,
        leadName: data[i][COL_NAME - 1] || '',
        ownerId: String(data[i][COL_OWNER_ID - 1] || ''),
        ownerName: data[i][COL_OWNER_NAME - 1] || ''
      };
    }
  }
  return { found: false };
}

function updateRow(sheet, row, statusLabel, updatedByLabel, userId, userName) {
  var now = new Date();
  var dd = String(now.getDate()).padStart(2, '0');
  var mm = String(now.getMonth() + 1).padStart(2, '0');
  var yyyy = now.getFullYear();
  var hh = String(now.getHours()).padStart(2, '0');
  var mi = String(now.getMinutes()).padStart(2, '0');
  var timestamp = dd + '/' + mm + '/' + yyyy + ' ' + hh + ':' + mi;

  sheet.getRange(row, COL_STATUS).setValue(statusLabel);
  sheet.getRange(row, COL_UPDATED_BY).setValue(updatedByLabel);
  sheet.getRange(row, COL_UPDATED_AT).setValue(timestamp);
  sheet.getRange(row, COL_OWNER_ID).setValue(String(userId));
  sheet.getRange(row, COL_OWNER_NAME).setValue(userName);
}

function clearOwner(phone) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Leads');
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    var cellValue = String(data[i][COL_CONTACT - 1]).replace(/^'/, '');
    if (cellValue === phone) {
      var row = i + 1;
      sheet.getRange(row, COL_OWNER_ID).setValue('');
      sheet.getRange(row, COL_OWNER_NAME).setValue('');
      sheet.getRange(row, COL_STATUS).setValue('Chờ nhận');
      return { found: true, name: data[i][COL_NAME - 1] || '' };
    }
  }
  return { found: false };
}

// ── TELEGRAM HELPERS ──

function doSendMessage(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return;
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

// ── SETUP ──

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

function testDoSendMessage() {
  doSendMessage('🔔 Test ping từ Apps Script.');
}
