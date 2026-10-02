<script lang="ts">
  import { faLock } from '@fortawesome/free-solid-svg-icons/faLock';
  import { faWrench } from '@fortawesome/free-solid-svg-icons/faWrench';
  import CodeBlock from '@/components/CodeBlock.svelte';
  import Icon from '@/components/Icon.svelte';
  import TextField from '@/components/TextField.svelte';
  import { dmvpnConfig, type DmvpnInput, type DmvpnRole } from '@/lib/gen/dmvpn';

  // One form for the four tabs: a hub or a spoke, with or without IPsec.
  let { role, ipsec }: { role: DmvpnRole; ipsec: boolean } = $props();
  const hub = role === 'hub';
  // Element ids must differ between the four copies on the page.
  const p = `dmvpn-${hub ? 'hub' : 'spk'}${ipsec ? '-ipsec' : ''}`;

  const f: DmvpnInput = $state({
    host: hub ? 'HUB-R1' : 'SPOKE-R1',
    tnum: '0',
    tip: hub ? '10.0.0.1 255.255.255.0' : '10.0.0.2 255.255.255.0',
    nbma: '203.0.113.1',
    hubTip: '10.0.0.1',
    src: 'GigabitEthernet0/0',
    nid: '1',
    nauth: 'DMVPN-KEY',
    phase: '3',
    routing: 'eigrp',
    rasn: '100',
    psk: 'Str0ng-PSK-Here!',
    enc: 'aes256-sha256',
  });

  const title = `DMVPN ${hub ? 'Hub' : 'Spoke'} — mGRE ${ipsec ? '+ IPsec (IKEv2)' : 'Only (No IPsec)'}`;
  const blurb = {
    'hub-false':
      'For trusted private WAN where encryption is not required. Supports EIGRP, OSPF, or BGP over the tunnel interface.',
    'hub-true':
      'For DMVPN overlays running over the public internet. IPsec encrypts all GRE tunnel traffic using IKEv2 with AES-256 and SHA-256.',
    'spoke-false':
      'For trusted private WAN. Spoke registers dynamically with the hub NHS server at startup.',
    'spoke-true':
      'For internet-connected spoke sites. IPsec profile must match the hub. Pre-shared key must be identical on both ends.',
  }[`${role}-${ipsec}` as 'hub-false'];
</script>

<div class="panel">
  <h3><Icon icon={ipsec ? faLock : faWrench} /> {title}</h3>
  <p class="text-[12px]">{blurb}</p>
</div>

<div class="form-row">
  <TextField label={hub ? 'Hub Hostname' : 'Spoke Hostname'} id="{p}-host" bind:value={f.host} />
  <TextField label="Tunnel Interface #" id="{p}-tnum" bind:value={f.tnum} />
</div>
<div class="form-row">
  <TextField
    label={hub ? 'Tunnel IP / Mask' : 'Spoke Tunnel IP / Mask'}
    id="{p}-tip"
    bind:value={f.tip}
  />
  <TextField
    label={hub
      ? ipsec
        ? 'Hub NBMA IP (Public)'
        : 'Hub NBMA IP (Public/Underlay)'
      : 'Hub NBMA IP (NHS)'}
    id="{p}-{hub ? 'nbma' : 'hub-nbma'}"
    bind:value={f.nbma}
  />
</div>
{#if hub}
  <div class="form-row">
    <TextField label="Tunnel Source Interface" id="{p}-src" bind:value={f.src} />
    <TextField label="NHRP Network ID" id="{p}-nid" bind:value={f.nid} />
  </div>
{:else}
  <div class="form-row">
    <TextField label="Hub Tunnel IP (NHS)" id="{p}-hub-tip" bind:value={f.hubTip} />
    <TextField label="Tunnel Source Interface" id="{p}-src" bind:value={f.src} />
  </div>
{/if}

{#snippet nauthField()}
  <div class="form-group">
    <label class="form-label" for="{p}-nauth">NHRP Authentication Key</label>
    <input
      class="form-input mono"
      id="{p}-nauth"
      spellcheck="false"
      autocomplete="off"
      bind:value={f.nauth}
    />
    <p class="mt-1 text-[11px] text-text3">
      {#if hub && !ipsec}
        Use the <strong>Password Generator</strong> tool in the Security section to create a strong random
        key, then paste it here on the hub and all spokes.
      {:else if hub}
        Use the <strong>Password Generator</strong> tool in the Security section to create a strong random
        NHRP key, then paste it here and on all spokes.
      {:else if !ipsec}
        Create this NHRP key once with the <strong>Password Generator</strong> tool and paste the same
        value on hub and all spokes.
      {:else}
        Use the <strong>Password Generator</strong> tool to generate a strong NHRP key and reuse it across
        the DMVPN hub and spokes.
      {/if}
    </p>
  </div>
{/snippet}
{#snippet phaseField()}
  <div class="form-group">
    <label class="form-label" for="{p}-phase">DMVPN Phase</label>
    <select class="form-select" id="{p}-phase" bind:value={f.phase}>
      <option value="1">Phase 1{hub ? ' — Hub-and-Spoke' : ''}</option>
      <option value="2">Phase 2{hub ? ' — Direct Spoke-to-Spoke' : ''}</option>
      <option value="3">Phase 3{hub ? ' — Scalable (Recommended)' : ''}</option>
    </select>
  </div>
{/snippet}
{#snippet routingField()}
  <div class="form-group">
    <label class="form-label" for="{p}-routing">Routing Protocol</label>
    <select class="form-select" id="{p}-routing" bind:value={f.routing}>
      <option value="eigrp">EIGRP</option>
      <option value="ospf">OSPF (point-to-multipoint)</option>
      <option value="bgp">BGP</option>
      <option value="none">None / Static</option>
    </select>
  </div>
{/snippet}

{#snippet pskField()}
  <div class="form-group">
    <label class="form-label" for="{p}-psk">IKEv2 Pre-Shared Key</label>
    <input
      class="form-input mono"
      id="{p}-psk"
      spellcheck="false"
      autocomplete="off"
      bind:value={f.psk}
    />
    <p class="mt-1 text-[11px] text-text3">
      {#if hub}
        Generate this pre-shared key with the <strong>Password Generator</strong> tool (Security section)
        and reuse the same value on every DMVPN spoke.
      {:else}
        Generate this IKE pre-shared key in the <strong>Password Generator</strong> tool and paste the
        exact same value on the hub and all spokes.
      {/if}
    </p>
  </div>
{/snippet}
{#snippet encField()}
  <div class="form-group">
    <label class="form-label" for="{p}-enc">Encryption / Integrity</label>
    <select class="form-select" id="{p}-enc" bind:value={f.enc}>
      <option value="aes256-sha256">AES-256 / SHA-256 (Recommended)</option>
      <option value="aes128-sha256">AES-128 / SHA-256</option>
      <option value="aes256-sha512">AES-256 / SHA-512</option>
    </select>
  </div>
{/snippet}

{#if hub}
  <div class="form-row">
    {@render nauthField()}
    {#if ipsec}
      {@render pskField()}
    {:else}
      {@render phaseField()}
    {/if}
  </div>
  <div class="form-row">
    {#if ipsec}
      {@render phaseField()}
      {@render encField()}
    {:else}
      {@render routingField()}
      <TextField label="Routing AS / Process ID" id="{p}-rasn" bind:value={f.rasn} />
    {/if}
  </div>
  {#if ipsec}
    <div class="form-row">
      {@render routingField()}
      <TextField label="Routing AS / Process ID" id="{p}-rasn" bind:value={f.rasn} />
    </div>
  {/if}
{:else}
  <div class="form-row">
    <TextField label="NHRP Network ID" id="{p}-nid" bind:value={f.nid} />
    {@render nauthField()}
  </div>
  {#if ipsec}
    <div class="form-row">
      {@render pskField()}
      {@render encField()}
    </div>
  {/if}
  <div class="form-row">
    {@render phaseField()}
    {@render routingField()}
  </div>
  <TextField label="Routing AS / Process ID" id="{p}-rasn" bind:value={f.rasn} />
{/if}

<div aria-live="polite">
  <CodeBlock code={dmvpnConfig(role, ipsec, f)} />
  <div class="tip">
    <strong>{hub ? 'Hub' : 'Spoke'} Notes</strong>
    <ul class="mt-1 ml-5 list-disc leading-[1.8]">
      {#if hub}
        <li>Spokes register to NBMA IP: <strong>{f.nbma.trim()}</strong></li>
        <li>All spokes must use NHRP network-id <strong>{f.nid.trim()}</strong> and auth key.</li>
        {#if f.phase === '3'}
          <li>
            <code>ip nhrp redirect</code> required on hub for Phase 3 spoke-to-spoke shortcuts.
          </li>
        {/if}
      {:else}
        <li>
          Hub NHS tunnel IP: <strong>{f.hubTip.trim()}</strong> at NBMA
          <strong>{f.nbma.trim()}</strong>
        </li>
        <li>Spoke NBMA IP is auto-registered — works with dynamic DHCP from ISP.</li>
        {#if f.phase === '2' || f.phase === '3'}
          <li>
            <code>ip nhrp shortcut</code> enables direct spoke-to-spoke tunnels for Phase {f.phase}.
          </li>
        {/if}
      {/if}
      {#if ipsec}
        {#if hub}
          <li>
            IPsec uses <strong>transport mode</strong> — GRE is encrypted, outer IP preserved for routing.
          </li>
        {:else}
          <li>Pre-shared key must exactly match the hub IKEv2 keyring entry.</li>
        {/if}
      {:else}
        <li>No encryption — deploy on trusted private WAN only.</li>
      {/if}
      {#if hub}
        <li>
          For routing config help see <strong>BGP &amp; EIGRP</strong> or
          <strong>OSPF Generator</strong> in this toolkit.
        </li>
      {:else}
        <li>
          For IPsec protocol background see <strong>WAN &amp; VPN Services → VPN tab</strong> in this
          toolkit.
        </li>
      {/if}
    </ul>
  </div>
</div>
