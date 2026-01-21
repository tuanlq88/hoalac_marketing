import { defineConfig } from 'astro/config';
import { remarkPrefixBaseLinks } from './src/lib/markdown/remarkPrefixBaseLinks.js';
import remarkFactNote from './src/lib/markdown/remarkFactNote.js';

const basePath = '/hoalac_marketing';

export default defineConfig({
  site: 'https://tuanlq88.github.io/hoalac_marketing',
  base: basePath,
  output: 'static',
  integrations: [],
  markdown: {
    remarkPlugins: [remarkPrefixBaseLinks(basePath), remarkFactNote]
  },
  server: {
    host: true
  }
});
