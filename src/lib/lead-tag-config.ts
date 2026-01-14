export const LEAD_TAGS = [
  {
    value: 'lead_hot',
    label: 'Lead nóng',
    description: 'Đặt lịch xem trong 7 ngày',
    color: '#d44809'
  },
  {
    value: 'lead_warm',
    label: 'Lead ấm',
    description: 'Đang so sánh pháp lý & tài chính',
    color: '#e08a3c'
  },
  {
    value: 'lead_cold',
    label: 'Lead lạnh',
    description: 'Mới để lại nhu cầu sơ bộ',
    color: '#7c8a96'
  }
];

export function leadTagToEmoji(tag: string) {
  switch (tag) {
    case 'lead_hot':
      return '🔥';
    case 'lead_warm':
      return '⚡';
    case 'lead_cold':
    default:
      return '🧊';
  }
}
