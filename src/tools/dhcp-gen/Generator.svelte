<script lang="ts">
  import SelectField from '@/components/SelectField.svelte';
  import CodeBlock from '@/components/CodeBlock.svelte';
  import TextField from '@/components/TextField.svelte';
  import { dhcpConfig, type DhcpInput } from '@/lib/gen/dhcp';

  const f: DhcpInput = $state({
    pools:
      'OFFICE,192.168.10.0,255.255.255.0,192.168.10.1,8.8.8.8\nVOICE,192.168.20.0,255.255.255.0,192.168.20.1,8.8.8.8',
    exclude: '1',
    lease: '7',
  });
</script>

<div class="form-group">
  <label class="form-label" for="dhcp-pools"
    >Pools (one per line: name,network,mask,gateway,dns)</label
  >
  <textarea
    class="form-input"
    id="dhcp-pools"
    placeholder={'OFFICE,192.168.10.0,255.255.255.0,192.168.10.1,8.8.8.8\nVOICE,192.168.20.0,255.255.255.0,192.168.20.1,8.8.8.8'}
    spellcheck="false"
    bind:value={f.pools}></textarea>
</div>
<div class="form-row">
  <SelectField
    label="Exclude Range (gateway)"
    id="dhcp-excl"
    bind:value={f.exclude}
    options={[
      { value: '1', label: 'Exclude .1 only' },
      { value: '10', label: 'Exclude .1–.10' },
      { value: '20', label: 'Exclude .1–.20' },
    ]}
  />
  <TextField label="Lease (days)" id="dhcp-lease" bind:value={f.lease} />
</div>

<div aria-live="polite">
  <CodeBlock code={dhcpConfig(f)} />
</div>
