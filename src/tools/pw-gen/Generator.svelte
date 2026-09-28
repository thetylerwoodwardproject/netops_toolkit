<script lang="ts">
  import { onMount } from 'svelte';
  import { randomString } from '@/lib/random';

  // No 0/O, 1/l/I: easy to misread when typed from a screen.
  const BASE = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const SPECIAL = '!@#$%&*+-=';

  let length: number | null = $state(16);
  let count: number | null = $state(5);
  let special = $state(true);
  let passwords: string[] = $state([]);
  let copied = $state(-1);

  // Passwords are made only in the browser: anything rendered at build time
  // would be the same for every visitor.
  function generate() {
    const len = Math.min(Math.max(Math.trunc(length ?? 0), 1), 256);
    const n = Math.min(Math.max(Math.trunc(count ?? 0), 1), 100);
    const alphabet = BASE + (special ? SPECIAL : '');
    passwords = Array.from({ length: n }, () => randomString(len, alphabet));
  }

  onMount(generate);

  async function copy(i: number) {
    await navigator.clipboard.writeText(passwords[i]);
    copied = i;
    setTimeout(() => copied === i && (copied = -1), 1500);
  }
</script>

<div class="form-row-3">
  <div class="form-group">
    <label class="form-label" for="pw-len">Length</label>
    <input
      class="form-input mono"
      id="pw-len"
      type="number"
      min="1"
      max="256"
      bind:value={length}
    />
  </div>
  <div class="form-group">
    <label class="form-label" for="pw-count">Count</label>
    <input
      class="form-input mono"
      id="pw-count"
      type="number"
      min="1"
      max="100"
      bind:value={count}
    />
  </div>
  <div class="form-group">
    <span class="form-label max-md:hidden">&nbsp;</span>
    <button class="btn btn-primary w-full" type="button" onclick={generate}>Generate</button>
  </div>
</div>
<label class="mb-2.5 flex items-center gap-1.5 text-[12px] text-text2">
  <input type="checkbox" id="pw-special" class="accent-accent" bind:checked={special} /> Include special
  chars
</label>

<div aria-live="polite">
  {#if passwords.length}
    <div class="result-box">
      {#each passwords as pw, i (i)}
        <div class="flex items-center gap-2 border-b border-line py-1.5">
          <code class="flex-1 bg-transparent p-0 font-mono text-[13px] break-all text-accent"
            >{pw}</code
          >
          <button class="btn btn-sm btn-secondary" type="button" onclick={() => copy(i)}>
            {copied === i ? 'Copied!' : 'Copy'}
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>
