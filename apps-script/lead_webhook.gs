const TELEGRAM_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';
const TELEGRAM_CHAT_ID = 'YOUR_CHAT_ID';
const SHEET_ID = 'YOUR_SHEET_ID';

function doPost(e) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Leads');
  const payload = e.parameter;

  if (payload.action === 'seedTestData') {
    const seeded = seedTestData_(sheet);
    return createCorsResponse_({ message: `Đã tạo ${seeded} mẫu test.`, seeded });
  }

  const {
    intent = '',
    budgetRange = '',
    areas = '',
    legalRisk = '',
    contact = '',
    leadTag = 'lead_cold',
    source = '',
    submittedAt = new Date().toISOString()
  } = payload;

  const row = [
    new Date(),
    intent,
    budgetRange,
    areas,
    legalRisk,
    contact,
    leadTag,
    source,
    submittedAt
  ];
  sheet.appendRow(row);

  if (leadTag === 'lead_hot') {
    notifyTelegram({ intent, budgetRange, areas, legalRisk, contact }, leadTag);
  }

  return createCorsResponse_({ message: 'Đã ghi nhận thông tin, cảm ơn bạn!' });
}

function doOptions() {
  return createCorsResponse_({ message: 'CORS preflight ok' });
}

function notifyTelegram(lead, tag) {
  const text = `🔥 Lead ${tag} mới:\nIntent: ${lead.intent}\nTài chính: ${lead.budgetRange}\nKhu vực: ${lead.areas}\nPháp lý: ${lead.legalRisk}\nLiên hệ: ${lead.contact}`;
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

function createCorsResponse_(body) {
  const output = ContentService.createTextOutput(JSON.stringify(body));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function seedTestData_(sheet) {
  const now = new Date();
  const samples = [
    {
      intent: 'o_thuc',
      budgetRange: '2.5-3.5',
      areas: 'gan_dhqg, gan_cnc',
      legalRisk: 'so_do_san',
      contact: '0987' + Math.floor(Math.random() * 100000),
      leadTag: 'lead_hot',
      source: 'seed_test'
    },
    {
      intent: 'dau_tu_trung_han',
      budgetRange: '1.5-2.5',
      areas: 'binh_yen_thach_hoa',
      legalRisk: 'cho_len_tho_cu',
      contact: '0901' + Math.floor(Math.random() * 100000),
      leadTag: 'lead_warm',
      source: 'seed_test'
    },
    {
      intent: 'luot_song',
      budgetRange: '<1.5',
      areas: 'tien_xuan_yen_binh',
      legalRisk: 'co_the_rui_ro',
      contact: '0938' + Math.floor(Math.random() * 100000),
      leadTag: 'lead_cold',
      source: 'seed_test'
    }
  ];

  samples.forEach((lead, index) => {
    const submittedAt = new Date(now.getTime() + index * 60000).toISOString();
    sheet.appendRow([
      new Date(),
      lead.intent,
      lead.budgetRange,
      lead.areas,
      lead.legalRisk,
      lead.contact,
      lead.leadTag,
      lead.source,
      submittedAt
    ]);
  });

  return samples.length;
}
