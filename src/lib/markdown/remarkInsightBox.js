import { toString } from 'mdast-util-to-string';

const LABELS = {
  'GÓC NHÌN': { label: 'Góc nhìn chiến lược', className: 'insight-box' },
  'GOC NHIN': { label: 'Góc nhìn chiến lược', className: 'insight-box' },
  'THỰC ĐỊA': { label: 'Ghi nhận thực địa', className: 'insight-box insight-box--field' },
  'THUC DIA': { label: 'Ghi nhận thực địa', className: 'insight-box insight-box--field' },
  'CẢNH BÁO': { label: 'Cảnh báo', className: 'insight-box insight-box--warning' },
  'CANH BAO': { label: 'Cảnh báo', className: 'insight-box insight-box--warning' },
};

function matchHeading(node) {
  if (!node || node.type !== 'heading') return null;
  const value = toString(node).trim().toUpperCase();
  for (const [key, config] of Object.entries(LABELS)) {
    if (value === key || value.startsWith(key + ':') || value.startsWith(key + ' ')) {
      const suffix = toString(node).trim().slice(key.length).replace(/^[:\s]+/, '');
      return { ...config, suffix };
    }
  }
  return null;
}

function buildLabel(text) {
  return {
    type: 'paragraph',
    data: { hName: 'p', hProperties: { class: 'insight-box__label' } },
    children: [{ type: 'text', value: text }]
  };
}

function buildContainer(className, ariaLabel, children) {
  return {
    type: 'insight-box',
    data: {
      hName: 'aside',
      hProperties: { class: className, role: 'note', 'aria-label': ariaLabel }
    },
    children
  };
}

export default function remarkInsightBox() {
  return function transform(tree) {
    if (!tree || !Array.isArray(tree.children)) return;
    const nodes = tree.children;
    let i = 0;
    while (i < nodes.length) {
      const match = matchHeading(nodes[i]);
      if (!match) { i++; continue; }
      const depth = nodes[i].depth || 6;
      const collected = [];
      let cursor = i + 1;
      while (cursor < nodes.length) {
        const s = nodes[cursor];
        if (s?.type === 'heading' && (s.depth || 6) <= depth) break;
        collected.push(s);
        cursor++;
      }
      if (collected.length === 0) {
        collected.push({ type: 'paragraph', children: [{ type: 'text', value: '' }] });
      }
      const labelText = match.suffix ? `${match.label} — ${match.suffix}` : match.label;
      const container = buildContainer(match.className, match.label, [buildLabel(labelText), ...collected]);
      nodes.splice(i, collected.length + 1, container);
      i++;
    }
  };
}
