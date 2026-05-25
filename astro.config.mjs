import { defineConfig } from 'astro/config';
import { remarkPrefixBaseLinks } from './src/lib/markdown/remarkPrefixBaseLinks.js';
import remarkFactNote from './src/lib/markdown/remarkFactNote.js';
import remarkInsightBox from './src/lib/markdown/remarkInsightBox.js';
import remarkTimeline from './src/lib/markdown/remarkTimeline.js';

const basePath = '/hoalac_marketing';

export default defineConfig({
  site: 'https://tuanlq88.github.io/hoalac_marketing',
  base: basePath,
  output: 'static',
  integrations: [],
  markdown: {
    remarkPlugins: [remarkPrefixBaseLinks(basePath), remarkFactNote, remarkInsightBox, remarkTimeline]
  },
  server: {
    host: true
  }
});
