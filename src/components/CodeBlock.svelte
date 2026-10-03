<script lang="ts">
  // `comment` is shown after the code in orange and copied with it, as a trailing shell comment.
  let {
    code,
    copy = true,
    comment = '',
  }: { code: string; copy?: boolean; comment?: string } = $props();
  let label = $state('Copy');

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(comment ? `${code} ${comment}` : code);
      label = 'Copied!';
    } catch {
      label = 'Copy failed';
    }
    setTimeout(() => (label = 'Copy'), 1500);
  }
</script>

<!-- The button sits outside the <pre> so it never overlaps the text. -->
<div class="relative my-2.5">
  <!-- prettier-ignore -->
  <pre class="code my-0" class:pr-20={copy}><code>{code}{#if comment}<span class="text-orange"> {comment}</span>{/if}</code></pre>
  {#if copy}
    <button type="button" class="copy-btn" onclick={onCopy}>{label}</button>
  {/if}
</div>
