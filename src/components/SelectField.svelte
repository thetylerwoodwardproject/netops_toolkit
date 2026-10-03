<script lang="ts">
  import * as Select from '@/components/ui/select/index.js';

  let {
    label,
    id,
    value = $bindable(''),
    options,
    onchange,
    group = true,
    class: className = '',
  }: {
    label: string;
    id: string;
    value?: string;
    options: { value: string; label: string }[];
    /** Runs after the bound value has been updated, like a native select's change event. */
    onchange?: () => void;
    /** The wrapper is a .form-group (with its bottom margin) unless this is false. */
    group?: boolean;
    /** Extra classes on the wrapper, e.g. a top margin. */
    class?: string;
  } = $props();

  const current = $derived(options.find((o) => o.value === value)?.label ?? '');
</script>

<div class={[group && 'form-group', className]}>
  <label class="form-label" for={id}>{label}</label>
  <Select.Root type="single" bind:value onValueChange={() => onchange && queueMicrotask(onchange)}>
    <Select.Trigger
      {id}
      class="w-full rounded-field border-line bg-bg px-3 py-0 text-[16px] leading-[1.21] text-text data-[size=default]:h-[42px] xs:text-[13px] xs:data-[size=default]:h-[38px]"
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
