<script lang="ts">
  import { faWrench } from '@fortawesome/free-solid-svg-icons/faWrench';
  import CodeBlock from '@/components/CodeBlock.svelte';
  import Icon from '@/components/Icon.svelte';
  import TextField from '@/components/TextField.svelte';
  import { vrfConfig, type VrfInput } from '@/lib/gen/vrf';

  const f: VrfInput = $state({
    name: 'PROD',
    rd: '65000:10',
    rtExport: '65000:10',
    rtImport: '65000:10',
    sviIf: 'Vlan10',
    sviIp: '10.10.10.1 255.255.255.0',
    wanIf: 'Tunnel0',
    defaultNextHop: '10.255.0.1',
    routing: 'eigrp',
    asn: '100',
  });
</script>

<div class="panel">
  <h3><Icon icon={faWrench} /> Simple VRF Config — Single VRF Per Spoke</h3>
  <p class="text-[12px]">
    Creates one VRF, binds an access VLAN SVI and your DMVPN tunnel interface into it, adds an
    optional default route, and drops in a routing protocol stub. This matches the <strong
      >build tunnels first, then specify VRFs at the spokes</strong
    > design.
  </p>
</div>
<div class="form-row">
  <TextField label="VRF Name" id="vrf-name" bind:value={f.name} />
  <TextField label="Route Distinguisher (RD)" id="vrf-rd" bind:value={f.rd} />
</div>
<div class="form-row">
  <TextField label="Route-Target Export" id="vrf-rt-exp" bind:value={f.rtExport} />
  <TextField label="Route-Target Import" id="vrf-rt-imp" bind:value={f.rtImport} />
</div>
<div class="form-row">
  <TextField label="Access VLAN SVI Interface" id="vrf-svi-if" bind:value={f.sviIf} />
  <TextField label="SVI IP / Mask" id="vrf-svi-ip" bind:value={f.sviIp} />
</div>
<div class="form-row">
  <TextField label="DMVPN Tunnel Interface" id="vrf-wan-if" bind:value={f.wanIf} />
  <TextField
    label="Default Route Next-Hop (inside VRF)"
    id="vrf-def-nh"
    bind:value={f.defaultNextHop}
  />
</div>
<div class="form-row">
  <div class="form-group">
    <label class="form-label" for="vrf-routing">Routing Protocol in VRF</label>
    <select class="form-select" id="vrf-routing" bind:value={f.routing}>
      <option value="eigrp">EIGRP</option>
      <option value="ospf">OSPF</option>
      <option value="bgp">BGP</option>
      <option value="none">None / Static Only</option>
    </select>
  </div>
  <TextField label="AS / Process / BGP ASN" id="vrf-asn" bind:value={f.asn} />
</div>

<div aria-live="polite">
  <CodeBlock code={vrfConfig(f)} />
  <div class="tip">
    <strong>Next Steps</strong>
    <ul class="mt-1 ml-5 list-disc leading-[1.8]">
      <li>
        Use the <a href="/dmvpn-gen/"><strong>DMVPN Generator</strong></a> to build matching
        hub/spoke tunnel configs — ensure the tunnel interface is placed in VRF
        <strong>{f.name.trim()}</strong>.
      </li>
      <li>
        Use <a href="/bgp-eigrp-cmds/"><strong>BGP &amp; EIGRP</strong></a> to fine-tune routing inside
        this VRF (neighbors, auth, timers).
      </li>
      <li>
        Use the <a href="/vlan-gen/"><strong>VLAN Config Generator</strong></a> for additional SVIs
        that should also live in VRF <strong>{f.name.trim()}</strong>.
      </li>
    </ul>
  </div>
</div>
