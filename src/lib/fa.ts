// Font Awesome Free icons looked up by name at build time. Only the SVG paths
// of icons actually used end up in the pages; no icon font or script ships.
import { fas } from '@fortawesome/free-solid-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-common-types';

function index(pack: Record<string, IconDefinition>) {
  const byName = new Map<string, IconDefinition>();
  for (const def of Object.values(pack)) {
    byName.set(def.iconName, def);
    for (const alias of def.icon[2]) if (typeof alias === 'string') byName.set(alias, def);
  }
  return byName;
}

const solid = index(fas);
const brands = index(fab);

/** 'network-wired' (solid) or 'brands:github'. Throws on an unknown name. */
export function faIcon(name: string): IconDefinition {
  const [set, icon] = name.startsWith('brands:') ? [brands, name.slice(7)] : [solid, name];
  const def = set.get(icon);
  if (!def) {
    throw new Error(
      `Unknown Font Awesome icon "${name}". Use a Free solid icon name from fontawesome.com, or "brands:<name>" for a brand icon.`,
    );
  }
  return def;
}

/** The icon as a standalone SVG document, e.g. for the favicon. */
export function faSvg(name: string, fill = 'currentColor') {
  const [w, h, , , d] = faIcon(name).icon;
  const path = Array.isArray(d) ? d.join(' ') : d;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><path fill="${fill}" d="${path}"/></svg>`;
}
