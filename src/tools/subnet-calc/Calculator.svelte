<script lang="ts">
  import { faGraduationCap } from '@fortawesome/free-solid-svg-icons/faGraduationCap';
  import Icon from '@/components/Icon.svelte';
  import {
    formatIPv4,
    formatIPv4Binary,
    ipv4Class,
    isPrivateIPv4,
    parseIPv4,
    subnet,
  } from '@/lib/ipv4';

  let address = $state('192.168.1.0');
  let prefix = $state('24');

  // Accept a pasted "10.0.0.0/8" in the address box and split it across both fields.
  function onAddressInput() {
    const slash = address.indexOf('/');
    if (slash === -1) return;
    prefix = address.slice(slash + 1).trim();
    address = address.slice(0, slash).trim();
  }

  const result = $derived.by(() => {
    const ip = parseIPv4(address);
    const bits = /^\/?\d{1,2}$/.test(prefix.trim()) ? Number(prefix.trim().replace('/', '')) : NaN;
    if (ip === null) return { error: 'Invalid IP address' };
    if (!(bits >= 0 && bits <= 32)) return { error: 'Enter a valid IP and CIDR (0-32)' };
    return { ip, net: subnet(ip, bits) };
  });

  const n = (x: number) => x.toLocaleString('en-US');
</script>

<div class="tip mb-3.5">
  <Icon icon={faGraduationCap} class="mr-1 inline align-[-2px] text-accent" />
  <strong>New to subnetting?</strong> An IP address has two parts: the <em>network</em> (your
  neighborhood) and the <em>host</em> (your house number). The CIDR number after the slash (e.g.
  /24) tells you how many bits are the network part. Try <code>192.168.1.0</code> with CIDR
  <code>24</code>, or paste <code>10.0.0.0/8</code> into the address box.
</div>

<div class="form-row">
  <div class="form-group">
    <label class="form-label" for="sc-ip">IP Address</label>
    <input
      class="form-input mono"
      id="sc-ip"
      placeholder="192.168.1.0"
      spellcheck="false"
      autocomplete="off"
      bind:value={address}
      oninput={onAddressInput}
    />
  </div>
  <div class="form-group">
    <label class="form-label" for="sc-cidr">CIDR / Prefix Length</label>
    <input
      class="form-input mono"
      id="sc-cidr"
      placeholder="24"
      inputmode="numeric"
      autocomplete="off"
      bind:value={prefix}
    />
  </div>
</div>

<div aria-live="polite">
  {#if 'error' in result}
    <div class="warn">{result.error}</div>
  {:else}
    {@const { ip, net } = result}
    <div class="result-box">
      <div class="result-grid">
        <div class="result-item">
          <div class="ri-label">Network Address</div>
          <div class="ri-value">{formatIPv4(net.network)}</div>
        </div>
        <div class="result-item">
          <div class="ri-label">Broadcast Address</div>
          <div class="ri-value">{formatIPv4(net.broadcast)}</div>
        </div>
        <div class="result-item">
          <div class="ri-label">Subnet Mask</div>
          <div class="ri-value">{formatIPv4(net.mask)}</div>
        </div>
        <div class="result-item">
          <div class="ri-label">Wildcard Mask</div>
          <div class="ri-value">{formatIPv4(net.wildcard)}</div>
        </div>
        <div class="result-item">
          <div class="ri-label">First Usable</div>
          <div class="ri-value green">{formatIPv4(net.first)}</div>
        </div>
        <div class="result-item">
          <div class="ri-label">Last Usable</div>
          <div class="ri-value green">{formatIPv4(net.last)}</div>
        </div>
        <div class="result-item">
          <div class="ri-label">Usable Hosts</div>
          <div class="ri-value">{n(net.hosts)}</div>
        </div>
        <div class="result-item">
          <div class="ri-label">Total Addresses</div>
          <div class="ri-value">{n(net.total)}</div>
        </div>
        <div class="result-item">
          <div class="ri-label">IP Class</div>
          <div class="ri-value">{ipv4Class(ip)}</div>
        </div>
        <div class="result-item">
          <div class="ri-label">IP Type</div>
          <div class="ri-value">{isPrivateIPv4(ip) ? 'Private (RFC 1918)' : 'Public'}</div>
        </div>
        <div class="result-item">
          <div class="ri-label">Binary Mask</div>
          <div class="ri-value text-[11px]">{formatIPv4Binary(net.mask)}</div>
        </div>
        <div class="result-item">
          <div class="ri-label">CIDR Notation</div>
          <div class="ri-value">/{net.prefix}</div>
        </div>
      </div>
    </div>
  {/if}
</div>
