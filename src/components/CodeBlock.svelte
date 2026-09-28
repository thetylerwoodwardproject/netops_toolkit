<script lang="ts">
  let { code, copy = true }: { code: string; copy?: boolean } = $props();
  let label = $state('Copy');

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(code);
      label = 'Copied!';
    } catch {
      label = 'Copy failed';
    }
    setTimeout(() => (label = 'Copy'), 1500);
  }
</script>

<!-- The button sits outside the <pre> so it stays put when long lines scroll. -->
<div class="relative my-2.5">
  <pre class="code my-0" class:pr-20={copy}><code>{code}</code></pre>
  {#if copy}
    <button type="button" class="copy-btn" onclick={onCopy}>{label}</button>
  {/if}
</div>
