import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://tuanlq88.github.io/hoalac_marketing',
  base: '/hoalac_marketing',
  output: 'static',
  integrations: [],
  server: {
    host: true
  }
});
