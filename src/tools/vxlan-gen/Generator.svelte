<script lang="ts">
  import CodeBlock from '@/components/CodeBlock.svelte';
  import TextField from '@/components/TextField.svelte';
  import { vxlanConfig, type VxlanInput } from '@/lib/gen/vxlan';

  const f: VxlanInput = $state({
    host: 'LEAF-01',
    lo: '10.1.1.1',
    vni: '10010',
    vlan: '10',
    mcast: '239.1.1.10',
    intf: 'Ethernet1/1',
    ip: '192.168.100.1 255.255.255.0',
    peers: '10.1.1.2',
    evpn: false,
  });
</script>

<div class="form-row">
  <TextField label="Hostname" id="vxlan-host" bind:value={f.host} />
  <TextField label="Loopback IP (VTEP)" id="vxlan-lo" bind:value={f.lo} />
</div>
<div class="form-row-3">
  <TextField label="VNI" id="vxlan-vni" bind:value={f.vni} />
  <TextField label="VLAN ID" id="vxlan-vlan" bind:value={f.vlan} />
  <TextField label="Multicast Group" id="vxlan-mcast" placeholder="Optional" bind:value={f.mcast} />
</div>
<div class="form-row">
  <TextField label="Underlay Interface" id="vxlan-intf" bind:value={f.intf} />
  <TextField label="Underlay IP/Mask" id="vxlan-ip" bind:value={f.ip} />
</div>
<TextField
  label="Remote VTEPs (comma-separated IPs)"
  id="vxlan-peers"
  placeholder="10.1.1.2,10.1.1.3"
  bind:value={f.peers}
/>
<label class="my-2.5 flex items-center gap-1.5 text-[12px] text-text2">
  <input type="checkbox" id="vxlan-evpn" class="accent-accent" bind:checked={f.evpn} />
  Enable EVPN control plane (Nexus 9K)
</label>

<div aria-live="polite">
  <CodeBlock code={vxlanConfig(f)} />
  <div class="tip mt-3">
    <strong>Notes:</strong>
    <ul class="mt-1 ml-5 list-disc">
      <li>VTEP source: Loopback0 ({f.lo.trim()})</li>
      <li>VNI {f.vni.trim()} mapped to VLAN {f.vlan.trim()}</li>
      {#if f.mcast.trim()}
        <li>Using multicast group {f.mcast.trim()} for BUM traffic</li>
      {:else}
        <li>Using unicast mode with static peers</li>
      {/if}
      {#if f.evpn}
        <li>EVPN control plane enabled - configure BGP spine peering</li>
      {:else}
        <li>Data-plane learning mode (flood-and-learn)</li>
      {/if}
      <li>Configure OSPF or another IGP for underlay reachability</li>
      <li>Ensure MTU 1600+ on all underlay interfaces</li>
    </ul>
  </div>
</div>
