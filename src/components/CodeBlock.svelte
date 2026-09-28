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

<pre class="code" class:pr-16={copy}>{#if copy}<button
      type="button"
      class="copy-btn"
      onclick={onCopy}>{label}</button
    >{/if}<code>{code}</code></pre>
