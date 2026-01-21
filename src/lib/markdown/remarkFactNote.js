import { toString } from 'mdast-util-to-string';

function isFactHeading(node) {
  if (!node || node.type !== 'heading') {
    return false;
  }

  const value = toString(node).trim().toUpperCase();
  return value === 'FACT_DECLARATION' || value === 'GHI CHU' || value === 'GHI CHÚ';
}

function buildLabelNode() {
  return {
    type: 'paragraph',
    data: {
      hName: 'p',
      hProperties: {
        class: 'fact-note__label'
      }
    },
    children: [{ type: 'text', value: 'Ghi chú' }]
  };
}

function buildContainer(children) {
  return {
    type: 'fact-note',
    data: {
      hName: 'section',
      hProperties: {
        class: 'fact-note',
        role: 'note',
        'aria-label': 'Ghi chú'
      }
    },
    children
  };
}

export default function remarkFactNote() {
  return function transform(tree) {
    if (!tree || !Array.isArray(tree.children)) {
      return;
    }

    const nodes = tree.children;
    let index = 0;

    while (index < nodes.length) {
      const node = nodes[index];

      if (!isFactHeading(node)) {
        index += 1;
        continue;
      }

      const depth = node.depth || 6;
      const collected = [];
      let cursor = index + 1;

      while (cursor < nodes.length) {
        const sibling = nodes[cursor];
        if (sibling?.type === 'heading' && (sibling.depth || 6) <= depth) {
          break;
        }
        collected.push(sibling);
        cursor += 1;
      }

      if (collected.length === 0) {
        collected.push({ type: 'paragraph', children: [{ type: 'text', value: 'Thông tin đang được cập nhật.' }] });
      }

      const container = buildContainer([buildLabelNode(), ...collected]);
      nodes.splice(index, collected.length + 1, container);
      index += 1;
    }
  };
}
