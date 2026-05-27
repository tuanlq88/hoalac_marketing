import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { remarkPrefixBaseLinks } from './src/lib/markdown/remarkPrefixBaseLinks.js';
import remarkFactNote from './src/lib/markdown/remarkFactNote.js';
import remarkInsightBox from './src/lib/markdown/remarkInsightBox.js';
import remarkTimeline from './src/lib/markdown/remarkTimeline.js';

const basePath = '/';

export default defineConfig({
  site: 'https://tamnhinhoalac.vn',
  base: basePath,
  output: 'static',
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkPrefixBaseLinks(basePath), remarkFactNote, remarkInsightBox, remarkTimeline]
  },
  server: {
    host: true
  }
});
