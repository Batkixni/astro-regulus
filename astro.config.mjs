// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  adapter: node({
    mode: "standalone",
  }),
  integrations: [tailwind({
    applyBaseStyles: false, // We import globals.css manually
  }), react(), mdx()]
});
