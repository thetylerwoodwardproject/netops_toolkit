import type { APIRoute } from 'astro';
import { toolkit } from '@/config';

export const GET: APIRoute = () =>
  Response.json({
    name: toolkit.name,
    short_name: toolkit.name,
    description: toolkit.tagline,
    start_url: '/',
    display: 'standalone',
    background_color: '#111214',
    theme_color: toolkit.accent,
    icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
  });
