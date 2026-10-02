<script lang="ts">
  import { faLaptop } from '@fortawesome/free-solid-svg-icons/faLaptop';
  import CodeBlock from '@/components/CodeBlock.svelte';
  import Icon from '@/components/Icon.svelte';
  import TextField from '@/components/TextField.svelte';
  import { bgpConfig, type BgpInput } from '@/lib/gen/bgp';

  const f: BgpInput = $state({
    localAs: '65001',
    routerId: '1.1.1.1',
    type: 'ebgp',
    neighborIp: '203.0.113.1',
    remoteAs: '64500',
    desc: 'ISP-UPLINK',
    networks: '198.51.100.0 255.255.255.0\n10.10.0.0 255.255.0.0',
    updateSrc: 'Loopback0',
    localPref: '',
    logChanges: true,
    defaultOrig: false,
    rrClient: false,
    softReconfig: true,
  });
</script>

<div class="panel">
  <h3><Icon icon={faLaptop} /> BGP Config Generator</h3>
  <div class="form-row">
    <TextField label="Local AS Number" id="bgp-local-as" bind:value={f.localAs} />
    <TextField label="Router ID (Loopback IP)" id="bgp-router-id" bind:value={f.routerId} />
  </div>
  <div class="form-row">
    <div class="form-group">
      <label class="form-label" for="bgp-type">BGP Type</label>
      <select class="form-select" id="bgp-type" bind:value={f.type}>
        <option value="ebgp">eBGP (external / ISP)</option>
        <option value="ibgp">iBGP (internal)</option>
      </select>
    </div>
    <TextField label="Neighbor IP" id="bgp-neighbor-ip" bind:value={f.neighborIp} />
  </div>
  <div class="form-row">
    <TextField label="Remote AS" id="bgp-remote-as" bind:value={f.remoteAs} />
    <TextField label="Neighbor Description" id="bgp-neighbor-desc" bind:value={f.desc} />
  </div>
  <div class="form-group">
    <label class="form-label" for="bgp-networks"
      >Networks to Advertise (one per line: network mask)</label
    >
    <textarea
      class="form-input"
      id="bgp-networks"
      placeholder={'198.51.100.0 255.255.255.0\n10.10.0.0 255.255.0.0'}
      spellcheck="false"
      bind:value={f.networks}></textarea>
  </div>
  <div class="form-row">
    <TextField
      label="Update-Source Interface (iBGP)"
      id="bgp-update-src"
      placeholder="Loopback0"
      bind:value={f.updateSrc}
    />
    <TextField
      label="Local Preference (iBGP inbound)"
      id="bgp-localpref"
      placeholder="e.g. 200 (optional)"
      bind:value={f.localPref}
    />
  </div>
  <label class="my-1 flex items-center gap-1.5 text-[12px] text-text2">
    <input type="checkbox" id="bgp-log-changes" class="accent-accent" bind:checked={f.logChanges} />
    bgp log-neighbor-changes
  </label>
  <label class="my-1 flex items-center gap-1.5 text-[12px] text-text2">
    <input
      type="checkbox"
      id="bgp-default-orig"
      class="accent-accent"
      bind:checked={f.defaultOrig}
    />
    default-originate toward neighbor
  </label>
  <label class="my-1 flex items-center gap-1.5 text-[12px] text-text2">
    <input type="checkbox" id="bgp-rr-client" class="accent-accent" bind:checked={f.rrClient} />
    route-reflector-client (iBGP RR)
  </label>
  <label class="my-2 flex items-center gap-1.5 text-[12px] text-text2">
    <input
      type="checkbox"
      id="bgp-soft-reconfig"
      class="accent-accent"
      bind:checked={f.softReconfig}
    />
    neighbor soft-reconfiguration inbound
  </label>
</div>

<div aria-live="polite">
  <CodeBlock code={bgpConfig(f)} />
  <div class="tip">
    <strong>Notes:</strong>
    <ul class="mt-1 ml-5 list-disc">
      <li>
        Type: <strong>{f.type === 'ebgp' ? 'eBGP' : 'iBGP'}</strong> — Local AS
        <strong>{f.localAs.trim()}</strong>, Remote AS <strong>{f.remoteAs.trim()}</strong>
      </li>
      {#if f.type === 'ibgp'}
        <li>iBGP: ensure full-mesh, route-reflector, or confederation is in place</li>
      {/if}
      {#if f.defaultOrig}
        <li>default-originate enabled — neighbor will receive a default route</li>
      {/if}
      {#if f.rrClient}
        <li>Route-reflector-client set — this router is the RR for this peer</li>
      {/if}
    </ul>
  </div>
</div>
