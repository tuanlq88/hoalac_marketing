/**
 * Remark plugin to prefix absolute internal links (starting with "/")
 * with the configured GitHub Pages base path so they resolve correctly
 * when the site is deployed under a subdirectory.
 */
export const remarkPrefixBaseLinks = (basePath = '') => {
  const normalizedBase = basePath === '/' ? '' : basePath.replace(/\/$/, '');

  const shouldRewrite = (url) => typeof url === 'string' && url.startsWith('/') && !url.startsWith('//');

  const walk = (node, visitor) => {
    visitor(node);
    if (Array.isArray(node?.children)) {
      node.children.forEach((child) => walk(child, visitor));
    }
  };

  return () => (tree) => {
    walk(tree, (node) => {
      if ((node?.type === 'link' || node?.type === 'image') && shouldRewrite(node.url)) {
        node.url = `${normalizedBase}${node.url}`;
      }
    });
  };
};
