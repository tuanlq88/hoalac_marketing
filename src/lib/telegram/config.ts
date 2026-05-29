// Leads sheet columns (1-based)
// A=Lead ID, B=Lần đầu, C=Lần cuối, D=Mục đích, E=Tài chính, F=Ưu tiên,
// G=Xưng hô, H=SĐT, I=Phân loại, J=Nguồn, K=Trạng thái, L=Cập nhật bởi,
// M=Cập nhật lúc, N=Owner ID, O=Owner Name, P=Lần submit, Q=Hành vi đọc
export const COL = {
  LEAD_ID: 0, FIRST_SUBMIT: 1, LAST_SUBMIT: 2, INTENT: 3, BUDGET: 4,
  PRIORITY: 5, NAME: 6, CONTACT: 7, TAG: 8, SOURCE: 9, STATUS: 10,
  UPDATED_BY: 11, UPDATED_AT: 12, OWNER_ID: 13, OWNER_NAME: 14,
  SUBMIT_COUNT: 15, READING_CONTEXT: 16
} as const;

export const STATUS_MAP: Record<string, { label: string; icon: string }> = {
  'status_called':  { label: 'Đã nhận',       icon: '👀' },
  'status_nurture': { label: 'Đang liên hệ',  icon: '📞' },
  'status_visit':   { label: 'Dẫn khách',     icon: '🚗' },
  'status_deposit': { label: 'Đặt cọc',       icon: '💰' },
  'status_won':     { label: 'Thành công',     icon: '✅' },
  'status_lost':    { label: 'Không thành',    icon: '💤' },
};

export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  '':              ['status_called'],
  'Đã nhận':       ['status_nurture', 'status_lost'],
  'Đang liên hệ':  ['status_visit', 'status_lost'],
  'Dẫn khách':     ['status_deposit', 'status_lost'],
  'Đặt cọc':       ['status_won', 'status_lost'],
  'Thành công':     [],
  'Không thành':    ['status_called'],
};

export const STATUS_REASSIGN = 'status_reassign';
export const ACTION_CHECK = 'action_check';

export const LEAD_ICONS: Record<string, string> = {
  'lead_hot':  '🔥',
  'lead_warm': '🟡',
  'lead_cold': '🔵',
};

export const INTENT_LABELS: Record<string, string> = {
  'o_thuc': 'Ở thực',
  'dong_tien': 'Tạo dòng tiền cho thuê',
  'dau_tu_trung_han': 'Đầu tư trung hạn',
  'tich_luy_dai_han': 'Tích lũy tài sản dài hạn',
};

export const BUDGET_LABELS: Record<string, string> = {
  '<1.5': 'Dưới 1,5 tỷ',
  '1.5-3': '1,5–3 tỷ',
  '3-5': '3–5 tỷ',
  '>5': 'Trên 5 tỷ',
};

export const PRIORITY_LABELS: Record<string, string> = {
  'phap_ly': 'Pháp lý an toàn',
  'tang_gia': 'Tăng giá dài hạn',
  'ha_tang': 'Gần hạ tầng / metro',
  'cho_thue': 'Cho thuê sớm',
  'quy_dat': 'Quỹ đất rộng, tiềm năng dài hạn',
};

export function vnDateTime(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

export function buildButtons(leadId: string, currentStatus: string): Array<Array<{ text: string; callback_data: string }>> {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || ALLOWED_TRANSITIONS[''] || [];
  const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];

  for (let i = 0; i < allowed.length; i += 2) {
    const row: Array<{ text: string; callback_data: string }> = [];
    const cmd1 = STATUS_MAP[allowed[i]];
    if (cmd1) row.push({ text: `${cmd1.icon} ${cmd1.label}`, callback_data: `${allowed[i]}:${leadId}` });
    if (allowed[i + 1]) {
      const cmd2 = STATUS_MAP[allowed[i + 1]];
      if (cmd2) row.push({ text: `${cmd2.icon} ${cmd2.label}`, callback_data: `${allowed[i + 1]}:${leadId}` });
    }
    if (row.length > 0) keyboard.push(row);
  }

  return keyboard;
}

export interface LeadRow {
  found: boolean;
  row: number;
  leadId: string;
  leadName: string;
  phone: string;
  status: string;
  ownerId: string;
  ownerName: string;
}

export function checkOwnership(rowInfo: LeadRow, userId: string, action: string): { blocked: boolean; message?: string } {
  const isFirstClaim = action === 'status_called';
  if (isFirstClaim) {
    if (rowInfo.ownerId && rowInfo.ownerId !== userId) {
      return { blocked: true, message: `🚫 Lead đang do ${rowInfo.ownerName} chăm sóc.` };
    }
    return { blocked: false };
  }
  if (!rowInfo.ownerId) {
    return { blocked: true, message: '⚠️ Chưa ai nhận lead này. Bấm "Nhận lead" trước.' };
  }
  if (rowInfo.ownerId !== userId) {
    return { blocked: true, message: `🚫 Lead đang do ${rowInfo.ownerName} chăm sóc.` };
  }
  return { blocked: false };
}
