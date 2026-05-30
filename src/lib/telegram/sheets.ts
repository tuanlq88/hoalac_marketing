import { google, type sheets_v4 } from 'googleapis';
import { COL, vnDateTime, type LeadRow } from './config';

let _sheets: sheets_v4.Sheets | null = null;

function getSheets(): sheets_v4.Sheets {
  if (_sheets) return _sheets;
  const creds = JSON.parse(import.meta.env.GOOGLE_SERVICE_ACCOUNT || process.env.GOOGLE_SERVICE_ACCOUNT || '{}');
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  _sheets = google.sheets({ version: 'v4', auth });
  return _sheets;
}

function getSheetId(): string {
  return import.meta.env.SHEET_ID || process.env.SHEET_ID || '';
}

export async function getSheetData(sheetName: string): Promise<string[][]> {
  const resp = await getSheets().spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `${sheetName}!A:Q`,
  });
  return (resp.data.values || []) as string[][];
}

export async function findLeadById(leadId: string): Promise<LeadRow> {
  const data = await getSheetData('Leads');
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][COL.LEAD_ID]) === leadId) {
      return {
        found: true,
        row: i + 1,
        leadId,
        leadName: data[i][COL.NAME] || '',
        phone: String(data[i][COL.CONTACT] || '').replace(/^'/, ''),
        status: data[i][COL.STATUS] || '',
        ownerId: String(data[i][COL.OWNER_ID] || ''),
        ownerName: data[i][COL.OWNER_NAME] || '',
      };
    }
  }
  return { found: false, row: 0, leadId, leadName: '', phone: '', status: '', ownerId: '', ownerName: '' };
}

export async function findLeadByPhone(phone: string): Promise<LeadRow & { submitCount: number }> {
  const data = await getSheetData('Leads');
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][COL.CONTACT] || '').replace(/^'/, '') === phone) {
      return {
        found: true,
        row: i + 1,
        leadId: data[i][COL.LEAD_ID] || '',
        leadName: data[i][COL.NAME] || '',
        phone,
        status: data[i][COL.STATUS] || '',
        ownerId: String(data[i][COL.OWNER_ID] || ''),
        ownerName: data[i][COL.OWNER_NAME] || '',
        submitCount: parseInt(data[i][COL.SUBMIT_COUNT]) || 0,
      };
    }
  }
  return { found: false, row: 0, leadId: '', leadName: '', phone, status: '', ownerId: '', ownerName: '', submitCount: 0 };
}

export async function generateLeadId(): Promise<string> {
  const data = await getSheetData('Leads');
  let seq = 1;
  if (data.length >= 2) {
    const lastId = String(data[data.length - 1][COL.LEAD_ID]);
    const match = lastId.match(/(\d+)$/);
    if (match) seq = parseInt(match[1], 10) + 1;
  }
  return 'HL-' + String(seq).padStart(4, '0');
}

export async function updateLeadStatus(
  row: number, statusLabel: string, updatedBy: string, userId: string, userName: string,
): Promise<void> {
  const ts = vnDateTime();
  await getSheets().spreadsheets.values.update({
    spreadsheetId: getSheetId(),
    range: `Leads!K${row}:O${row}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[statusLabel, updatedBy, ts, userId, userName]] },
  });
}

export async function clearOwnerStatus(row: number): Promise<void> {
  await getSheets().spreadsheets.values.update({
    spreadsheetId: getSheetId(),
    range: `Leads!K${row}:O${row}`,
    valueInputOption: 'RAW',
    requestBody: { values: [['', '', vnDateTime(), '', '']] },
  });
}

export async function appendLead(values: string[]): Promise<void> {
  await getSheets().spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: 'Leads!A:Q',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [values] },
  });
}

export async function updateExistingLead(
  row: number,
  submittedAt: string, intentLabel: string, budgetLabel: string, priorityLabel: string,
  leadTag: string, source: string, newCount: number, readingContext: string,
): Promise<void> {
  const sheets = getSheets();
  const sheetId = getSheetId();
  await Promise.all([
    sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `Leads!C${row}:F${row}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[submittedAt, intentLabel, budgetLabel, priorityLabel]] },
    }),
    sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `Leads!I${row}:J${row}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[leadTag, source]] },
    }),
    sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `Leads!P${row}:Q${row}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[String(newCount), readingContext]] },
    }),
  ]);
}

export async function logTimeline(leadId: string, phone: string, event: string, actor: string): Promise<void> {
  const phoneCell = phone ? `'${phone}` : '';
  await getSheets().spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: 'Timeline!A:E',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [[leadId, phoneCell, vnDateTime(), event, actor]] },
  });
}
