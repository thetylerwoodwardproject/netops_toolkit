<script lang="ts">
  import * as Select from '@/components/ui/select/index.js';

  let {
    label,
    id,
    value = $bindable(''),
    options,
  }: {
    label: string;
    id: string;
    value?: string;
    options: { value: string; label: string }[];
  } = $props();

  const current = $derived(options.find((o) => o.value === value)?.label ?? '');
</script>

<div class="form-group">
  <label class="form-label" for={id}>{label}</label>
  <Select.Root type="single" bind:value>
    <Select.Trigger
      {id}
      class="w-full rounded-field border-line bg-bg px-3 py-[9px] text-[16px] leading-[1.21] text-text data-[size=default]:h-auto xs:text-[13px]"
    >
      {current}
    </Select.Trigger>
    <Select.Content>
      {#each options as o (o.value)}
        <Select.Item value={o.value} label={o.label}>{o.label}</Select.Item>
      {/each}
    </Select.Content>
  </Select.Root>
</div>
