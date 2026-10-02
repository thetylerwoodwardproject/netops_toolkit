<script lang="ts">
  import CodeBlock from '@/components/CodeBlock.svelte';
  import TextField from '@/components/TextField.svelte';
  import { natConfig, type NatInput } from '@/lib/gen/nat';

  const f: NatInput = $state({
    type: 'pat',
    inside: 'Gi0/0',
    outside: 'Gi0/1',
    net: '192.168.10.0 0.0.0.255',
    local: '192.168.10.10',
    global: '203.0.113.10',
    poolStart: '203.0.113.1',
    poolEnd: '203.0.113.10',
  });
</script>

<div class="form-group">
  <label class="form-label" for="nat-type">NAT Type</label>
  <select class="form-select" id="nat-type" bind:value={f.type}>
    <option value="pat">PAT (Overload) — Most Common</option>
    <option value="static">Static NAT</option>
    <option value="dynamic">Dynamic NAT</option>
  </select>
</div>
<div class="form-row">
  <TextField label="Inside Interface" id="nat-in" bind:value={f.inside} />
  <TextField label="Outside Interface" id="nat-out" bind:value={f.outside} />
</div>
{#if f.type === 'pat'}
  <TextField label="Inside Network (with wildcard)" id="nat-net" bind:value={f.net} />
{:else if f.type === 'static'}
  <div class="form-row">
    <TextField label="Local IP" id="nat-local" bind:value={f.local} />
    <TextField label="Global IP" id="nat-global" bind:value={f.global} />
  </div>
{:else}
  <TextField label="Inside Network" id="nat-net" bind:value={f.net} />
  <div class="form-row">
    <TextField label="Pool Start IP" id="nat-ps" bind:value={f.poolStart} />
    <TextField label="Pool End IP" id="nat-pe" bind:value={f.poolEnd} />
  </div>
{/if}

<div aria-live="polite">
  <CodeBlock code={natConfig(f)} />
</div>
