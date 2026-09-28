<!--
  Font Awesome icon inside a Svelte island. Import the definition from its own
  module path so only that icon is bundled:
    import { faCopy } from '@fortawesome/free-solid-svg-icons/faCopy';
-->
<script lang="ts">
  import type { IconDefinition } from '@fortawesome/fontawesome-common-types';

  let {
    icon,
    size = 16,
    class: className = '',
  }: { icon: IconDefinition; size?: number; class?: string } = $props();

  const [width, height, , , data] = $derived(icon.icon);
  const d = $derived(Array.isArray(data) ? data.join(' ') : data);
  const h = $derived(Math.round(size * 0.9 * 100) / 100);
  const w = $derived(Math.round(((h * width) / height) * 100) / 100);
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 {width} {height}"
  width={w}
  height={h}
  fill="currentColor"
  aria-hidden="true"
  focusable="false"
  class="shrink-0 {className}"
>
  <path {d}></path>
</svg>
