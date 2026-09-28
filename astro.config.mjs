import { existsSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import base from './toolkit.config.ts';
import { resolveToolkit } from './src/lib/toolkit-schema.ts';

const localPath = new URL('./toolkit.config.local.ts', import.meta.url);
const local =
  !process.env.TOOLKIT_IGNORE_LOCAL && existsSync(localPath)
    ? (await import(/* @vite-ignore */ localPath.href)).default
    : undefined;
const { site } = resolveToolkit(base, local);

export default defineConfig({
  site,

  trailingSlash: 'always',
  build: {
    format: 'directory',
    assets: '_astro',
    // The CSP has no unsafe-inline; nothing may be inlined.
    inlineStylesheets: 'never',
  },

  // dist is the live symlink; never build into it.
  outDir: './.build',

  integrations: [svelte(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    // The CSP has no unsafe-inline; nothing may be inlined.
    build: { assetsInlineLimit: 0 },
  },
});
