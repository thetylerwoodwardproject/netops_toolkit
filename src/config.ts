import base from '../toolkit.config';
import { resolveToolkit } from './lib/toolkit-schema';
import { allTools } from './data/tools';
import { categories } from './data/categories';

// The local file is optional and gitignored, so it is picked up by glob rather than imported.
// TOOLKIT_IGNORE_LOCAL=1 builds the stock defaults, as a fresh clone would (tools/check-default).
const local = process.env.TOOLKIT_IGNORE_LOCAL
  ? undefined
  : Object.values(
      import.meta.glob<Parameters<typeof resolveToolkit>[1]>('../toolkit.config.local.ts', {
        eager: true,
        import: 'default',
      }),
    )[0];

export const toolkit = resolveToolkit(base, local);

export const enabledCategories = categories.filter((c) => toolkit.categories[c.id] !== false);

export const tools = allTools.filter(
  (t) => toolkit.categories[t.category] !== false && (toolkit.externalLookups || !t.external),
);
