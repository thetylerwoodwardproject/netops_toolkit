<script lang="ts">
  import { Select as SelectPrimitive } from 'bits-ui';
  import Icon from '@/components/Icon.svelte';
  import { faChevronDown } from '@fortawesome/free-solid-svg-icons/faChevronDown';
  import { cn, type WithoutChildrenOrChild } from '@/lib/utils.js';

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: WithoutChildrenOrChild<SelectPrimitive.ScrollDownButtonProps> = $props();
</script>

<SelectPrimitive.ScrollDownButton
  bind:ref
  data-slot="select-scroll-down-button"
  class={cn(
    "z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
    className,
  )}
  {...restProps}
>
  <Icon icon={faChevronDown} size={12} />
</SelectPrimitive.ScrollDownButton>
