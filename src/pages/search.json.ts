import type { APIRoute } from 'astro';
import { tools } from '@/config';

export const GET: APIRoute = () =>
  Response.json(
    tools.map(({ id, name, desc, category, tags }) => ({ id, name, desc, category, tags })),
  );
