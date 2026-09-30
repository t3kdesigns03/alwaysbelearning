// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import preact from '@astrojs/preact';

// Static shell by default. Only /api/* and the two [id] routes render on demand.
// Interactive surfaces (auth + quiz) are Preact islands hydrated with client:load.
export default defineConfig({
  site: 'https://alwaysbelearning.netlify.app',
  output: 'static',
  adapter: netlify(),
  integrations: [preact()],
  devToolbar: { enabled: false },
});
