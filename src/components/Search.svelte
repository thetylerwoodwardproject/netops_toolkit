<script lang="ts">
  import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons/faMagnifyingGlass';
  import Icon from './Icon.svelte';

  interface Entry {
    id: string;
    name: string;
    desc: string;
    category: string;
    tags: string[];
  }

  let query = $state('');
  let open = $state(false);
  let selected = $state(0);
  let index: Entry[] | null = $state(null);
  let input: HTMLInputElement;

  // The index is small but only needed once someone searches.
  async function load() {
    if (index) return;
    index = await fetch('/search.json').then((r) => r.json());
  }

  const results = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q || !index) return [];
    return index
      .filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.desc.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.includes(q)),
      )
      .slice(0, 8);
  });

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') selected = Math.min(selected + 1, results.length - 1);
    else if (e.key === 'ArrowUp') selected = Math.max(selected - 1, 0);
    else if (e.key === 'Enter' && results[selected]) location.href = `/${results[selected].id}/`;
    else if (e.key === 'Escape') {
      query = '';
      input.blur();
    } else return;
    e.preventDefault();
  }

  function onGlobalKeydown(e: KeyboardEvent) {
    const typing = (e.target as HTMLElement).closest('input, textarea, select, [contenteditable]');
    if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
      e.preventDefault();
      input.focus();
    }
  }
</script>

<svelte:window onkeydown={onGlobalKeydown} />

<div class="relative">
  <span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text3">
    <Icon icon={faMagnifyingGlass} size={14} />
  </span>
  <input
    bind:this={input}
    bind:value={query}
    type="search"
    placeholder="Search tools…"
    aria-label="Search tools"
    autocomplete="off"
    role="combobox"
    aria-expanded={open && results.length > 0}
    aria-controls="search-results"
    class="w-full rounded-lg border border-line bg-surface py-[9px] pr-3 pl-9 text-[13px] text-text outline-none placeholder:text-text3 focus:border-accent focus:ring-3 focus:ring-accent/15 sm:pr-12"
    onfocus={() => {
      open = true;
      load();
    }}
    onblur={() => setTimeout(() => (open = false), 150)}
    oninput={() => (selected = 0)}
    onkeydown={onKeydown}
  />
  <kbd
    class="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-line bg-bg px-1.5 text-[11px] text-text3 sm:block"
    >⌘K</kbd
  >

  {#if open && query.trim()}
    <ul
      id="search-results"
      role="listbox"
      class="absolute inset-x-0 top-full m-0 mt-1.5 list-none overflow-hidden rounded-lg border border-line2 bg-surface p-1 shadow-2xl"
    >
      {#each results as t, i (t.id)}
        <li role="option" aria-selected={i === selected}>
          <a
            href="/{t.id}/"
            class="block rounded-field px-3 py-2 text-text no-underline hover:bg-surface2 hover:no-underline {i ===
            selected
              ? 'bg-surface2'
              : ''}"
            onmouseenter={() => (selected = i)}
          >
            <span class="block text-[13px] font-semibold">{t.name}</span>
            <span class="block truncate text-[11.5px] text-text3">{t.desc}</span>
          </a>
        </li>
      {:else}
        <li class="px-3 py-2 text-[12px] text-text3">{index ? 'No tools match.' : 'Loading…'}</li>
      {/each}
    </ul>
  {/if}
</div>
