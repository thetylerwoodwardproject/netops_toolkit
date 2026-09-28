<script lang="ts">
  let {
    label,
    id,
    value = $bindable(''),
    placeholder = '',
    mono = true,
  }: { label: string; id: string; value?: string; placeholder?: string; mono?: boolean } = $props();
</script>

<div class="form-group">
  <label class="form-label" for={id}>{label}</label>
  <input
    class="form-input"
    class:mono
    {id}
    {placeholder}
    spellcheck="false"
    autocomplete="off"
    bind:value
  />
</div>
