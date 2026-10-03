<script lang="ts">
  import SelectField from '@/components/SelectField.svelte';
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
  <SelectField
    label="Protocol"
    id="ec-proto"
    bind:value={f.proto}
    options={[
      { value: 'active', label: 'LACP (active)' },
      { value: 'passive', label: 'LACP (passive)' },
      { value: 'desirable', label: 'PAgP (desirable)' },
      { value: 'auto', label: 'PAgP (auto)' },
      { value: 'on', label: 'Static (on)' },
    ]}
  />
  <TextField label="Channel Group #" id="ec-group" bind:value={f.group} />
  <TextField label="Interface Range" id="ec-range" bind:value={f.range} />
</div>
<div class="form-row">
  <SelectField
    label="Port-Channel Mode"
    id="ec-mode"
    bind:value={f.mode}
    options={[
      { value: 'trunk', label: 'trunk' },
      { value: 'access', label: 'access' },
    ]}
  />
  <TextField label="Allowed VLANs (trunk only)" id="ec-vlans" bind:value={f.vlans} />
</div>

<div aria-live="polite">
  <CodeBlock code={etherchannelConfig(f)} />
</div>
