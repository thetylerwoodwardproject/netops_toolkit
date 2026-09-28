import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

// Each tool lives in src/tools/<tool id>/index.astro. A registered tool with no
// directory yet gets a placeholder page (see src/pages/[tool].astro).
const modules = import.meta.glob<AstroComponentFactory>('./*/index.astro', {
  eager: true,
  import: 'default',
});

export const implementations: Record<string, AstroComponentFactory> = Object.fromEntries(
  Object.entries(modules).map(([path, component]) => [path.split('/')[1], component]),
);
