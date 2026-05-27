const TELEGRAM_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';
const TELEGRAM_CHAT_ID = 'YOUR_CHAT_ID';
const SHEET_ID = 'YOUR_SHEET_ID';

const ADMIN_IDS = [609104230];

// Leads sheet columns (1-based)
// A=Lead ID, B=Lần đầu, C=Lần cuối, D=Mục đích, E=Tài chính, F=Ưu tiên,
// G=Xưng hô, H=SĐT, I=Phân loại, J=Nguồn, K=Trạng thái, L=Cập nhật bởi,
// M=Cập nhật lúc, N=Owner ID, O=Owner Name, P=Lần submit, Q=Hành vi đọc
const COL = {
  LEAD_ID: 1, FIRST_SUBMIT: 2, LAST_SUBMIT: 3, INTENT: 4, BUDGET: 5,
  PRIORITY: 6, NAME: 7, CONTACT: 8, TAG: 9, SOURCE: 10, STATUS: 11,
  UPDATED_BY: 12, UPDATED_AT: 13, OWNER_ID: 14, OWNER_NAME: 15,
  SUBMIT_COUNT: 16, READING_CONTEXT: 17
};

const STATUS_MAP = {
  'status_called':  { label: 'Đã nhận',          icon: '👀' },
  'status_nurture': { label: 'Đang liên hệ',     icon: '📞' },
  'status_visit':   { label: 'Dẫn khách',        icon: '🚗' },
  'status_deposit': { label: 'Đặt cọc',          icon: '💰' },
  'status_won':     { label: 'Thành công',        icon: '✅' },
  'status_lost':    { label: 'Không thành',       icon: '💤' },
  '/called':  { label: 'Đã nhận',          icon: '👀' },
  '/nurture': { label: 'Đang liên hệ',     icon: '📞' },
  '/visit':   { label: 'Dẫn khách',        icon: '🚗' },
  '/deposit': { label: 'Đặt cọc',          icon: '💰' },
  '/cancel':  { label: 'Hủy cọc',          icon: '❌' },
  '/won':     { label: 'Thành công',        icon: '✅' },
  '/lost':    { label: 'Không thành',       icon: '💤' }
};

const ALLOWED_TRANSITIONS = {
  '':              ['status_called'],
  'Đã nhận':       ['status_nurture', 'status_lost'],
  'Đang liên hệ':  ['status_visit', 'status_lost'],
  'Dẫn khách':     ['status_deposit', 'status_lost'],
  'Đặt cọc':       ['status_won', 'status_lost'],
  'Thành công':     [],
  'Không thành':    ['status_called']
};

const LEAD_ICONS = {
  'lead_hot':  '🔥',
  'lead_warm': '🟡',
  'lead_cold': '🔵'
};

const INTENT_LABELS = {
  'o-thuc': 'Ở thực',
  'cho-thue': 'Cho thuê',
  'dau-tu-trung-han': 'Đầu tư trung hạn',
  'tich-luy-dai-han': 'Tích lũy dài hạn'
};

const BUDGET_LABELS = {
  'duoi-1.5-ty': 'Dưới 1,5 tỷ',
  '1.5-3-ty': '1,5–3 tỷ',
  '3-5-ty': '3–5 tỷ',
  'tren-5-ty': 'Trên 5 tỷ'
};

const PRIORITY_LABELS = {
  'phap-ly': 'Pháp lý an toàn',
  'tang-gia': 'Tăng giá dài hạn',
  'gan-metro': 'Gần hạ tầng / metro',
  'cho-thue-som': 'Cho thuê sớm',
  'quy-dat-rong': 'Quỹ đất rộng'
};

// ── MAIN ──

function doPost(e) {
  var contentType = e.postData ? e.postData.type : '';
  if (contentType === 'application/json') {
    return handleTelegramUpdate(e);
  }
  return handleLeadSubmission(e);
}

// ── LEAD SUBMISSION (with dedupe) ──

function handleLeadSubmission(e) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName('Leads');
  var timeline = ss.getSheetByName('Timeline');
  var p = e.parameter || {};

  var submittedAt = p.submittedAt || vnDateTime();
  var intent = p.intent || '';
  var budgetRange = p.budgetRange || '';
  var priority = p.priority || '';
  var name = p.name || '';
  var rawContact = p.contact || '';
  var contact = rawContact ? "'" + rawContact : '';
  var leadTag = p.leadTag || 'lead_cold';
  var source = p.source || '';
  var submitCount = p.submitCount || '1';
  var readingContext = p.readingContext || '';

  var intentLabel = INTENT_LABELS[intent] || intent;
  var budgetLabel = BUDGET_LABELS[budgetRange] || budgetRange;
  var priorityLabel = PRIORITY_LABELS[priority] || priority;

  // Dedupe: check existing by phone
  var existing = rawContact ? findLeadByPhone(sheet, rawContact) : null;

  if (existing && existing.found) {
    var row = existing.row;
    sheet.getRange(row, COL.LAST_SUBMIT).setValue(submittedAt);
    sheet.getRange(row, COL.INTENT).setValue(intentLabel);
    sheet.getRange(row, COL.BUDGET).setValue(budgetLabel);
    sheet.getRange(row, COL.PRIORITY).setValue(priorityLabel);
    sheet.getRange(row, COL.TAG).setValue(leadTag);
    sheet.getRange(row, COL.SOURCE).setValue(source);
    var prevCount = parseInt(sheet.getRange(row, COL.SUBMIT_COUNT).getValue()) || 0;
    var newCount = prevCount + 1;
    sheet.getRange(row, COL.SUBMIT_COUNT).setValue(newCount);
    sheet.getRange(row, COL.READING_CONTEXT).setValue(readingContext);

    if (timeline) {
      timeline.appendRow([existing.leadId, rawContact, submittedAt, 'Gửi lại form', intentLabel + ' | ' + budgetLabel + ' | ' + priorityLabel, source, readingContext]);
    }

    var icon = LEAD_ICONS[leadTag] || '⚪';
    var currentStatus = sheet.getRange(row, COL.STATUS).getValue() || '';
    var text = '♻️ Người đọc quay lại [' + existing.leadId + ']\n'
      + '👤 ' + name + '\n'
      + '🎯 ' + intentLabel + ' | 💰 ' + budgetLabel + '\n'
      + '⭐ ' + priorityLabel + '\n'
      + '📄 ' + source + '\n'
      + '🔢 Lần thứ: ' + newCount + '\n'
      + (readingContext ? '\n📖 Hành vi đọc:\n' + readingContext + '\n' : '')
      + '\n' + icon + ' ' + leadTag;

    var buttons = buildButtons(existing.leadId, currentStatus);
    sendWithButtons(TELEGRAM_CHAT_ID, text, buttons);

    return ContentService
      .createTextOutput(JSON.stringify({ message: 'Cảm ơn Anh/chị, thông tin đã được cập nhật!' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // New lead
  var leadId = generateLeadId(sheet);

  sheet.appendRow([
    leadId, submittedAt, submittedAt, intentLabel, budgetLabel, priorityLabel,
    name, contact, leadTag, source,
    '', '', '', '', '',
    1, readingContext
  ]);

  if (timeline) {
    timeline.appendRow([leadId, rawContact, submittedAt, 'Lead mới', intentLabel + ' | ' + budgetLabel + ' | ' + priorityLabel, source, readingContext]);
  }

  var icon = LEAD_ICONS[leadTag] || '⚪';
  var text = '📥 Lead mới [' + leadId + ']\n'
    + '👤 ' + name + '\n'
    + '🎯 ' + intentLabel + ' | 💰 ' + budgetLabel + '\n'
    + '⭐ ' + priorityLabel + '\n'
    + '📄 ' + source + '\n'
    + (readingContext ? '\n📖 Hành vi đọc:\n' + readingContext + '\n' : '')
    + '\n' + icon + ' ' + leadTag;

  var buttons = buildButtons(leadId, '');
  sendWithButtons(TELEGRAM_CHAT_ID, text, buttons);

  return ContentService
    .createTextOutput(JSON.stringify({ message: 'Đã ghi nhận thông tin, cảm ơn Anh/chị!' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── TELEGRAM WEBHOOK ──

function handleTelegramUpdate(e) {
  try {
    var update = JSON.parse(e.postData.contents);

    if (update.callback_query) {
      return handleCallbackQuery(update.callback_query);
    }

    var message = update.message;
    if (!message || !message.text) return ok();
    if (message.from && message.from.is_bot) return ok();

    // Ignore messages older than 30 seconds (Telegram retries)
    var messageAge = Math.floor(Date.now() / 1000) - (message.date || 0);
    if (messageAge > 30) return ok();

    var text = message.text.trim().toLowerCase();
    var chatId = message.chat.id;
    var from = message.from || {};
    var userId = from.id;
    var userName = from.first_name || '';
    if (from.last_name) userName += ' ' + from.last_name;
    var userLabel = userName;
    if (from.username) userLabel += ' (@' + from.username + ')';

    if (text === '/help' || text === '/start') {
      var helpText = '📋 <b>Hướng dẫn:</b>\n\n'
        + 'Bấm nút bên dưới mỗi lead để cập nhật trạng thái.\n\n'
        + 'Hoặc reply vào lead + gõ command:\n'
        + '👀 <code>/called</code> — Nhận lead\n'
        + '📞 <code>/nurture</code> — Đang liên hệ\n'
        + '🚗 <code>/visit</code> — Dẫn khách\n'
        + '💰 <code>/deposit</code> — Đặt cọc\n'
        + '✅ <code>/won</code> — Thành công\n'
        + '💤 <code>/lost</code> — Không thành\n'
        + '🔄 <code>/reassign</code> — Chuyển lead (admin)';
      sendTelegramHTML(chatId, helpText);
      return ok();
    }

    // Reply-based commands (backward compatible)
    if (!message.reply_to_message || !message.reply_to_message.text) return ok();

    var originalText = message.reply_to_message.text;
    var leadIdMatch = originalText.match(/\[HL-\d+\]/);
    if (!leadIdMatch) {
      sendTelegramReply(chatId, '⚠️ Không tìm thấy mã lead trong tin nhắn gốc.');
      return ok();
    }
    var leadId = leadIdMatch[0].replace(/[\[\]]/g, '');

    if (text.indexOf('/reassign') === 0) {
      if (ADMIN_IDS.indexOf(userId) === -1) {
        sendTelegramReply(chatId, '🚫 Chỉ admin mới được dùng /reassign.');
        return ok();
      }
      var result = clearOwner(leadId);
      if (result.found) {
        sendTelegramReply(chatId, '🔄 Đã mở khóa lead ' + leadId + ' (' + result.name + ').');
      } else {
        sendTelegramReply(chatId, '⚠️ Không tìm thấy lead: ' + leadId);
      }
      return ok();
    }

    var command = STATUS_MAP[text];
    if (!command) return ok();

    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Leads');
    var rowInfo = findLeadById(sheet, leadId);
    if (!rowInfo.found) {
      sendTelegramReply(chatId, '⚠️ Không tìm thấy lead: ' + leadId);
      return ok();
    }

    var ownerCheck = checkOwnership(rowInfo, userId, userLabel, text);
    if (ownerCheck.blocked) {
      sendTelegramReply(chatId, ownerCheck.message);
      return ok();
    }

    updateLeadStatus(sheet, rowInfo.row, command.label, userLabel, userId, userName);
    logTimeline(leadId, rowInfo.phone, command.label, userLabel);
    sendTelegramReply(chatId, command.icon + ' ' + leadId + ' → ' + command.label + '\n👤 ' + userLabel);

  } catch (err) {
    Logger.log('Telegram handler error: %s', err);
  }
  return ok();
}

// ── CALLBACK QUERY (inline buttons) ──

function handleCallbackQuery(query) {
  // Answer immediately to stop spinner
  answerCallback(query.id, '⏳');

  var data = query.data || '';
  var from = query.from || {};
  var userId = from.id;
  var userName = from.first_name || '';
  if (from.last_name) userName += ' ' + from.last_name;
  var userLabel = userName;
  if (from.username) userLabel += ' (@' + from.username + ')';
  var messageId = query.message ? query.message.message_id : null;
  var chatId = query.message ? query.message.chat.id : null;

  // Parse callback data: status_xxx:HL-0001
  var parts = data.split(':');
  var action = parts[0];
  var leadId = parts[1] || '';

  var command = STATUS_MAP[action];
  if (!command || !leadId) {
    answerCallback(query.id, '⚠️ Dữ liệu không hợp lệ');
    return ok();
  }

  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Leads');
  var rowInfo = findLeadById(sheet, leadId);
  if (!rowInfo.found) {
    answerCallback(query.id, '⚠️ Không tìm thấy lead');
    return ok();
  }

  // Check state transition
  var currentStatus = rowInfo.status || '';
  var allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (allowed.length > 0 && allowed.indexOf(action) === -1) {
    answerCallback(query.id, '⚠️ Không thể chuyển từ "' + (currentStatus || 'Mới') + '" sang "' + command.label + '"');
    return ok();
  }

  var ownerCheck = checkOwnership(rowInfo, userId, userLabel, action);
  if (ownerCheck.blocked) {
    answerCallback(query.id, ownerCheck.message);
    return ok();
  }

  updateLeadStatus(sheet, rowInfo.row, command.label, userLabel, userId, userName);
  logTimeline(leadId, rowInfo.phone, command.label, userLabel);

  // Edit original message to show updated status + new buttons
  if (messageId && chatId) {
    var originalText = query.message.text || '';
    var statusLine = '\n\n' + command.icon + ' ' + command.label + ' — ' + userLabel + ' (' + vnDateTime() + ')';
    var statusIdx = originalText.lastIndexOf('\n\n👀');
    if (statusIdx === -1) statusIdx = originalText.lastIndexOf('\n\n📞');
    if (statusIdx === -1) statusIdx = originalText.lastIndexOf('\n\n🚗');
    if (statusIdx === -1) statusIdx = originalText.lastIndexOf('\n\n💰');
    if (statusIdx === -1) statusIdx = originalText.lastIndexOf('\n\n✅');
    if (statusIdx === -1) statusIdx = originalText.lastIndexOf('\n\n💤');
    if (statusIdx === -1) statusIdx = originalText.lastIndexOf('\n\n❌');
    var cleanText = statusIdx > -1 ? originalText.substring(0, statusIdx) : originalText;
    var newButtons = buildButtons(leadId, command.label);
    editMessage(chatId, messageId, cleanText + statusLine, newButtons);
  }

  return ok();
}

// ── BUTTON BUILDER (dynamic by state) ──

function buildButtons(leadId, currentStatus) {
  var allowed = ALLOWED_TRANSITIONS[currentStatus] || ALLOWED_TRANSITIONS[''] || [];
  if (allowed.length === 0) return [];

  var keyboard = [];
  for (var i = 0; i < allowed.length; i += 2) {
    var row = [];
    var action1 = allowed[i];
    var cmd1 = STATUS_MAP[action1];
    if (cmd1) row.push({ text: cmd1.icon + ' ' + cmd1.label, callback_data: action1 + ':' + leadId });
    if (allowed[i + 1]) {
      var action2 = allowed[i + 1];
      var cmd2 = STATUS_MAP[action2];
      if (cmd2) row.push({ text: cmd2.icon + ' ' + cmd2.label, callback_data: action2 + ':' + leadId });
    }
    if (row.length > 0) keyboard.push(row);
  }
  return keyboard;
}

// ── SHEET HELPERS ──

function generateLeadId(sheet) {
  var lastRow = sheet.getLastRow();
  var seq = 1;
  if (lastRow >= 2) {
    var lastId = String(sheet.getRange(lastRow, COL.LEAD_ID).getValue());
    var numMatch = lastId.match(/(\d+)$/);
    if (numMatch) seq = parseInt(numMatch[1], 10) + 1;
  }
  return 'HL-' + String(seq).padStart(4, '0');
}

function findLeadById(sheet, leadId) {
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][COL.LEAD_ID - 1]) === leadId) {
      return {
        found: true,
        row: i + 1,
        leadId: leadId,
        leadName: data[i][COL.NAME - 1] || '',
        phone: String(data[i][COL.CONTACT - 1]).replace(/^'/, ''),
        status: data[i][COL.STATUS - 1] || '',
        ownerId: String(data[i][COL.OWNER_ID - 1] || ''),
        ownerName: data[i][COL.OWNER_NAME - 1] || ''
      };
    }
  }
  return { found: false };
}

function findLeadByPhone(sheet, phone) {
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    var cellValue = String(data[i][COL.CONTACT - 1]).replace(/^'/, '');
    if (cellValue === phone) {
      return {
        found: true,
        row: i + 1,
        leadId: data[i][COL.LEAD_ID - 1] || '',
        leadName: data[i][COL.NAME - 1] || '',
        phone: cellValue,
        status: data[i][COL.STATUS - 1] || '',
        ownerId: String(data[i][COL.OWNER_ID - 1] || ''),
        ownerName: data[i][COL.OWNER_NAME - 1] || ''
      };
    }
  }
  return { found: false };
}

function checkOwnership(rowInfo, userId, userLabel, action) {
  var currentOwnerId = rowInfo.ownerId;
  var isFirstClaim = (action === 'status_called' || action === '/called');

  if (isFirstClaim) {
    if (currentOwnerId && currentOwnerId !== String(userId)) {
      return { blocked: true, message: '🚫 Lead đang do ' + rowInfo.ownerName + ' chăm sóc.' };
    }
    return { blocked: false };
  }

  if (!currentOwnerId) {
    return { blocked: true, message: '⚠️ Chưa ai nhận lead này. Bấm "Nhận lead" trước.' };
  }
  if (currentOwnerId !== String(userId)) {
    return { blocked: true, message: '🚫 Lead đang do ' + rowInfo.ownerName + ' chăm sóc.' };
  }
  return { blocked: false };
}

function updateLeadStatus(sheet, row, statusLabel, updatedByLabel, userId, userName) {
  var ts = vnDateTime();
  sheet.getRange(row, COL.STATUS).setValue(statusLabel);
  sheet.getRange(row, COL.UPDATED_BY).setValue(updatedByLabel);
  sheet.getRange(row, COL.UPDATED_AT).setValue(ts);
  sheet.getRange(row, COL.OWNER_ID).setValue(String(userId));
  sheet.getRange(row, COL.OWNER_NAME).setValue(userName);
}

function clearOwner(leadId) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Leads');
  var info = findLeadById(sheet, leadId);
  if (!info.found) return { found: false };
  sheet.getRange(info.row, COL.OWNER_ID).setValue('');
  sheet.getRange(info.row, COL.OWNER_NAME).setValue('');
  sheet.getRange(info.row, COL.STATUS).setValue('');
  logTimeline(leadId, info.phone, 'Mở khóa lead', 'Admin');
  return { found: true, name: info.leadName };
}

function logTimeline(leadId, phone, event, actor) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var timeline = ss.getSheetByName('Timeline');
    if (timeline) {
      timeline.appendRow([leadId, phone, vnDateTime(), event, actor]);
    }
  } catch (err) {
    Logger.log('Timeline log error: %s', err);
  }
}

// ── TELEGRAM HELPERS ──

function sendWithButtons(chatId, text, keyboard) {
  var payload = { chat_id: chatId, text: text };
  if (keyboard && keyboard.length > 0) {
    payload.reply_markup = JSON.stringify({ inline_keyboard: keyboard });
  }
  try {
    UrlFetchApp.fetch('https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/sendMessage', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (err) {
    Logger.log('sendWithButtons error: %s', err);
  }
}

function editMessage(chatId, messageId, text, keyboard) {
  var payload = { chat_id: chatId, message_id: messageId, text: text };
  if (keyboard && keyboard.length > 0) {
    payload.reply_markup = JSON.stringify({ inline_keyboard: keyboard });
  }
  try {
    UrlFetchApp.fetch('https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/editMessageText', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (err) {
    Logger.log('editMessage error: %s', err);
  }
}

function answerCallback(callbackQueryId, text) {
  try {
    UrlFetchApp.fetch('https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/answerCallbackQuery', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ callback_query_id: callbackQueryId, text: text, show_alert: false }),
      muteHttpExceptions: true
    });
  } catch (err) {
    Logger.log('answerCallback error: %s', err);
  }
}

function doSendMessage(text) {
  try {
    UrlFetchApp.fetch('https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/sendMessage', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: text }),
      muteHttpExceptions: true
    });
  } catch (err) {
    Logger.log('doSendMessage error: %s', err);
  }
}

function sendTelegramHTML(chatId, html) {
  try {
    UrlFetchApp.fetch('https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/sendMessage', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ chat_id: chatId, text: html, parse_mode: 'HTML' }),
      muteHttpExceptions: true
    });
  } catch (err) {
    Logger.log('sendTelegramHTML error: %s', err);
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
  } catch (err) {
    Logger.log('sendTelegramReply error: %s', err);
  }
}

function ok() {
  return ContentService.createTextOutput('ok');
}

function vnDateTime() {
  var now = new Date();
  var dd = String(now.getDate()).padStart(2, '0');
  var mm = String(now.getMonth() + 1).padStart(2, '0');
  var yyyy = now.getFullYear();
  var hh = String(now.getHours()).padStart(2, '0');
  var mi = String(now.getMinutes()).padStart(2, '0');
  return dd + '/' + mm + '/' + yyyy + ' ' + hh + ':' + mi;
}

// ── SETUP ──

function setWebhook() {
  var webAppUrl = ScriptApp.getService().getUrl();
  var response = UrlFetchApp.fetch(
    'https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/setWebhook?url=' + encodeURIComponent(webAppUrl)
  );
  Logger.log('setWebhook: %s', response.getContentText());
}

function removeWebhook() {
  var response = UrlFetchApp.fetch(
    'https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/deleteWebhook'
  );
  Logger.log('deleteWebhook: %s', response.getContentText());
}

function testDoSendMessage() {
  doSendMessage('🔔 Test ping từ Apps Script.');
}
