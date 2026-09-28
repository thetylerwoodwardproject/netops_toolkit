import type { APIRoute } from 'astro';
import { toolkit } from '@/config';
import { faSvg } from '@/lib/fa';

export const GET: APIRoute = () =>
  new Response(faSvg(toolkit.icon, toolkit.accent), {
    headers: { 'Content-Type': 'image/svg+xml' },
  });
