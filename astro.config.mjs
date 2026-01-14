import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://example.com',
  output: 'static',
  integrations: [],
  server: {
    host: true
  }
});
