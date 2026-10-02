<script lang="ts">
  import CodeBlock from '@/components/CodeBlock.svelte';
  import TextField from '@/components/TextField.svelte';
  import { ospfConfig, type OspfInput } from '@/lib/gen/ospf';

  const f: OspfInput = $state({
    pid: '10',
    rid: '1.1.1.1',
    bw: '1000',
    nets: '10.10.1.0 0.0.0.255 0\n10.10.2.0 0.0.0.255 0\n192.168.1.0 0.0.0.255 1',
    passive: 'Loopback0,Gi0/0',
    defaultRoute: true,
  });
</script>

<div class="form-row-3">
  <TextField label="Process ID" id="ospf-pid" bind:value={f.pid} />
  <TextField label="Router ID" id="ospf-rid" bind:value={f.rid} />
  <TextField label="Ref. Bandwidth (Mbps)" id="ospf-bw" bind:value={f.bw} />
</div>
<div class="form-group">
  <label class="form-label" for="ospf-nets">Networks (one per line: network wildcard area)</label>
  <textarea
    class="form-input"
    id="ospf-nets"
    placeholder={'10.10.1.0 0.0.0.255 0\n10.10.2.0 0.0.0.255 0'}
    spellcheck="false"
    bind:value={f.nets}></textarea>
</div>
<TextField label="Passive Interfaces (comma-separated)" id="ospf-passive" bind:value={f.passive} />
<label class="my-2 flex items-center gap-1.5 text-[12px] text-text2">
  <input type="checkbox" id="ospf-default" class="accent-accent" bind:checked={f.defaultRoute} />
  Originate default route
</label>

<div aria-live="polite">
  <CodeBlock code={ospfConfig(f)} />
</div>
