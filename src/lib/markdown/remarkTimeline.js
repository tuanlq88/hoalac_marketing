import { toString } from 'mdast-util-to-string';

function isTimelineHeading(node) {
  if (!node || node.type !== 'heading') return false;
  const value = toString(node).trim().toUpperCase();
  return value === 'TIMELINE' || value.startsWith('TIMELINE:') || value.startsWith('TIMELINE ');
}

function extractTitle(node) {
  const raw = toString(node).trim();
  const after = raw.slice('TIMELINE'.length).replace(/^[:\s]+/, '');
  return after || 'Mốc thời gian';
}

function buildTimeline(title, listNode) {
  const items = (listNode.children || []).map(li => {
    const text = toString(li);
    return {
      type: 'listItem',
      data: { hName: 'li', hProperties: { class: 'timeline__item' } },
      children: li.children || [{ type: 'paragraph', children: [{ type: 'text', value: text }] }]
    };
  });

  return {
    type: 'timeline',
    data: {
      hName: 'section',
      hProperties: { class: 'timeline-block', 'aria-label': title }
    },
    children: [
      {
        type: 'paragraph',
        data: { hName: 'p', hProperties: { class: 'timeline-block__title' } },
        children: [{ type: 'text', value: title }]
      },
      {
        type: 'list',
        ordered: true,
        data: { hName: 'ol', hProperties: { class: 'timeline' } },
        children: items
      }
    ]
  };
}

export default function remarkTimeline() {
  return function transform(tree) {
    if (!tree || !Array.isArray(tree.children)) return;
    const nodes = tree.children;
    let i = 0;
    while (i < nodes.length) {
      if (!isTimelineHeading(nodes[i])) { i++; continue; }
      const title = extractTitle(nodes[i]);
      const next = nodes[i + 1];
      if (next && next.type === 'list') {
        const container = buildTimeline(title, next);
        nodes.splice(i, 2, container);
      }
      i++;
    }
  };
}
