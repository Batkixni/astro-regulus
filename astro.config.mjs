// @ts-check
import { defineConfig } from 'astro/config';

import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  image: { service: { entrypoint: 'astro/assets/services/noop' } },
  integrations: [tailwind({
    applyBaseStyles: false,
  }), react(), mdx()],
});