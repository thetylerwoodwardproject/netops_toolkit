<script lang="ts">
  import CodeBlock from '@/components/CodeBlock.svelte';
  import TextField from '@/components/TextField.svelte';
  import { vlanConfig } from '@/lib/gen/vlan';

  let vlans = $state('10,Engineering\n20,Operations\n30,Voice\n99,Management');
  let trunk = $state('Gi0/1');
  let native = $state('99');
</script>

<div class="form-group">
  <label class="form-label" for="vlan-list">VLANs (one per line: id,name)</label>
  <textarea
    class="form-input"
    id="vlan-list"
    placeholder={'10,Engineering\n20,Operations\n30,Voice\n99,Management'}
    spellcheck="false"
    bind:value={vlans}></textarea>
</div>
<div class="form-row">
  <TextField label="Trunk Interface" id="vlan-trunk" bind:value={trunk} />
  <TextField label="Native VLAN" id="vlan-native" bind:value={native} />
</div>

<div aria-live="polite">
  <CodeBlock code={vlanConfig({ vlans, trunk, native })} />
</div>
