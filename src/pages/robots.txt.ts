import type { APIRoute } from 'astro';
import { toolkit } from '@/config';

export const GET: APIRoute = ({ site }) =>
  new Response(
    toolkit.indexable
      ? `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap-index.xml', site)}\n`
      : 'User-agent: *\nDisallow: /\n',
  );
