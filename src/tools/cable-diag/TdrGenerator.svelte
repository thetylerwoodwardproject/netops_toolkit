<script lang="ts">
  import { faGear } from '@fortawesome/free-solid-svg-icons/faGear';
  import CodeBlock from '@/components/CodeBlock.svelte';
  import Icon from '@/components/Icon.svelte';
  import TextField from '@/components/TextField.svelte';
  import { tdrCommands } from '@/lib/gen/cable-diag';

  let intf = $state('GigabitEthernet0/1');
  let wait = $state('5');
  let bulk = $state('');

  const cfg = $derived(tdrCommands(intf, bulk, wait));
</script>

<div class="panel">
  <h3><Icon icon={faGear} /> TDR Test Command Builder</h3>
  <div class="form-row">
    <TextField label="Interface" id="cd-intf" placeholder="GigabitEthernet0/1" bind:value={intf} />
    <div class="form-group">
      <label class="form-label" for="cd-wait">Wait Time Before Reading Results (seconds)</label>
      <input
        class="form-input mono"
        id="cd-wait"
        type="number"
        min="1"
        max="60"
        bind:value={wait}
      />
    </div>
  </div>
  <div class="form-group mt-1.5">
    <label class="form-label" for="cd-bulk"
      >+ Bulk Interfaces
      <span class="font-normal text-text3"
        >(one per line — overrides the single interface above if filled in)</span
      ></label
    >
    <textarea
      class="form-input mono min-h-[70px]"
      id="cd-bulk"
      placeholder={'GigabitEthernet0/1\nGigabitEthernet0/2\nGigabitEthernet0/3'}
      spellcheck="false"
      bind:value={bulk}></textarea>
  </div>
</div>

<div aria-live="polite">
  {#if cfg}
    <CodeBlock code={cfg} />
  {:else}
    <div class="warn">Enter at least one interface.</div>
  {/if}
</div>
