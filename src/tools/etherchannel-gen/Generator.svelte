<script lang="ts">
  import CodeBlock from '@/components/CodeBlock.svelte';
  import TextField from '@/components/TextField.svelte';
  import { etherchannelConfig, type EtherchannelInput } from '@/lib/gen/etherchannel';

  const f: EtherchannelInput = $state({
    proto: 'active',
    group: '1',
    range: 'f0/1-2',
    mode: 'trunk',
    vlans: '10,20,30,99',
  });
</script>

<div class="form-row-3">
  <div class="form-group">
    <label class="form-label" for="ec-proto">Protocol</label>
    <select class="form-select" id="ec-proto" bind:value={f.proto}>
      <option value="active">LACP (active)</option>
      <option value="passive">LACP (passive)</option>
      <option value="desirable">PAgP (desirable)</option>
      <option value="auto">PAgP (auto)</option>
      <option value="on">Static (on)</option>
    </select>
  </div>
  <TextField label="Channel Group #" id="ec-group" bind:value={f.group} />
  <TextField label="Interface Range" id="ec-range" bind:value={f.range} />
</div>
<div class="form-row">
  <div class="form-group">
    <label class="form-label" for="ec-mode">Port-Channel Mode</label>
    <select class="form-select" id="ec-mode" bind:value={f.mode}>
      <option>trunk</option>
      <option>access</option>
    </select>
  </div>
  <TextField label="Allowed VLANs (trunk only)" id="ec-vlans" bind:value={f.vlans} />
</div>

<div aria-live="polite">
  <CodeBlock code={etherchannelConfig(f)} />
</div>
