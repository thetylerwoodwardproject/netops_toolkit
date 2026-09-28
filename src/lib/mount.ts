import { hydrate, mount, type Component } from 'svelte';

/**
 * Start a Svelte component on every element matching `selector`.
 *
 * This replaces Astro's client:* directives, which add an inline bootstrap
 * script that the site's CSP (script-src 'self', no unsafe-inline) blocks.
 * Called from a component's <script>, which Astro bundles into an external
 * module. If the element holds the component's server-rendered markup it is
 * hydrated in place; otherwise the component is mounted fresh. Props come from
 * a JSON data-props attribute.
 */
export function start<P extends Record<string, unknown>>(
  selector: string,
  component: Component<P>,
) {
  for (const target of document.querySelectorAll<HTMLElement>(selector)) {
    const props = (target.dataset.props ? JSON.parse(target.dataset.props) : {}) as P;
    if (target.hasAttribute('data-ssr')) hydrate(component, { target, props });
    else mount(component, { target, props });
  }
}
