import type { APIRoute } from 'astro';
import { toolkit } from '@/config';

// The accent color, as its own stylesheet: the CSP forbids inline styles.
export const GET: APIRoute = () =>
  new Response(`:root{--brand:${toolkit.accent}}\n`, {
    headers: { 'Content-Type': 'text/css; charset=utf-8' },
  });
