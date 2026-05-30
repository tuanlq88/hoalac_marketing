import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';
import sitemap from '@astrojs/sitemap';
import { remarkPrefixBaseLinks } from './src/lib/markdown/remarkPrefixBaseLinks.js';
import remarkFactNote from './src/lib/markdown/remarkFactNote.js';
import remarkInsightBox from './src/lib/markdown/remarkInsightBox.js';
import remarkTimeline from './src/lib/markdown/remarkTimeline.js';

const basePath = '/';

export default defineConfig({
  site: 'https://www.tamnhinhoalac.vn',
  base: basePath,
  output: 'hybrid',
  adapter: vercel(),
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkPrefixBaseLinks(basePath), remarkFactNote, remarkInsightBox, remarkTimeline]
  },
  server: {
    host: true
  }
});
