import { z } from 'zod';
import { categoryIds } from '../data/categories';

const link = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  /** Font Awesome icon name, e.g. 'podcast' or 'brands:bluesky'. */
  icon: z.string().optional(),
});

export const toolkitSchema = z.object({
  /** Shown in the header, page titles, the web manifest and share cards. */
  name: z.string().min(1),
  /** One line under the name on the home page. */
  tagline: z.string().optional(),
  /** Font Awesome icon for the logo and favicon: a solid icon name, or 'brands:<name>'. */
  icon: z.string().min(1),
  /** Theme color as #rrggbb. Buttons, links, highlights and the favicon use it. */
  accent: z.string().regex(/^#[0-9a-f]{6}$/i, 'accent must be a #rrggbb color'),
  /** Canonical URL of this instance, used for the sitemap and share links. */
  site: z.url(),
  footer: z.object({
    /** A short line of text, e.g. who runs this instance. */
    note: z.string().optional(),
    links: z.array(link),
  }),
  /** Every category is on unless set to false here. */
  categories: z.partialRecord(z.enum(categoryIds), z.boolean()),
  /**
   * Tools that call third-party services (public IP, geolocation, DNS over HTTPS).
   * Off means those tools are not built at all.
   */
  externalLookups: z.boolean(),
  /** false serves a robots.txt that refuses all crawlers, e.g. for a staging copy. */
  indexable: z.boolean(),
});

export type Toolkit = z.infer<typeof toolkitSchema>;

type LocalToolkit = Partial<Omit<Toolkit, 'footer'>> & { footer?: Partial<Toolkit['footer']> };

/** Types the committed defaults in toolkit.config.ts. */
export const defineToolkit = (config: Toolkit) => config;

/** Types an instance's toolkit.config.local.ts, which only needs the keys it changes. */
export const defineLocalToolkit = (config: LocalToolkit) => config;

export function resolveToolkit(base: Toolkit, local: LocalToolkit = {}): Toolkit {
  const merged = {
    ...base,
    ...local,
    footer: { ...base.footer, ...local.footer },
    categories: { ...base.categories, ...local.categories },
  };
  const result = toolkitSchema.safeParse(merged);
  if (!result.success) {
    throw new Error(`Invalid toolkit config:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
