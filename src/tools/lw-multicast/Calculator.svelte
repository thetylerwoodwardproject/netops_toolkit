<script lang="ts">
  import CodeBlock from '@/components/CodeBlock.svelte';

  const types = {
    standard: { name: 'Standard', base: 0xefc00000 },
    backfeed: { name: 'Backfeed', base: 0xefc10000 },
    backfeed_ls: { name: 'Backfeed Livestream', base: 0xefc30000 },
    surround: { name: 'Surround / 5.1', base: 0xefc40000 },
  };

  let channel: number | null = $state(null);
  let type: keyof typeof types = $state('standard');

  const result = $derived.by(() => {
    if (channel === null) return null;
    if (!Number.isInteger(channel) || channel < 1 || channel > 32767) {
      return { error: 'Channel must be between 1 and 32767.' };
    }
    const addr = types[type].base + channel;
    const ip = [(addr >>> 24) & 255, (addr >>> 16) & 255, (addr >>> 8) & 255, addr & 255].join('.');
    return { ip, hex: '0x' + addr.toString(16).toUpperCase() };
  });
</script>

<div class="form-row">
  <div class="form-group">
    <label class="form-label" for="lw-ch">Channel Number (1–32767)</label>
    <input
      type="number"
      id="lw-ch"
      class="form-input mono"
      placeholder="e.g. 27"
      min="1"
      max="32767"
      bind:value={channel}
    />
  </div>
  <div class="form-group">
    <label class="form-label" for="lw-type">Stream Type</label>
    <select id="lw-type" class="form-select" bind:value={type}>
      <option value="standard">Standard (239.192.x.x)</option>
      <option value="backfeed">Backfeed (239.193.x.x)</option>
      <option value="backfeed_ls">Backfeed Livestream (239.195.x.x)</option>
      <option value="surround">Surround / 5.1 (239.196.x.x)</option>
    </select>
  </div>
</div>

<div aria-live="polite">
  {#if result && 'error' in result}
    <div class="mb-2 text-[12px] text-red">{result.error}</div>
  {:else if result}
    <div class="result-box mt-4">
      <div class="result-grid">
        <div class="result-item">
          <div class="ri-label">Multicast IP</div>
          <div class="ri-value">{result.ip}</div>
        </div>
        <div class="result-item">
          <div class="ri-label">Hex Address</div>
          <div class="ri-value">{result.hex}</div>
        </div>
        <div class="result-item">
          <div class="ri-label">UDP Port</div>
          <div class="ri-value green">5004</div>
        </div>
        <div class="result-item">
          <div class="ri-label">Stream Type</div>
          <div class="ri-value">{types[type].name}</div>
        </div>
      </div>
      <div class="mt-3">
        <div class="field-label">IGMP Join Example</div>
        <CodeBlock
          code={`# Linux\nip maddr add ${result.ip} dev eth0\n\n# Cisco IOS\nip igmp join-group ${result.ip}`}
        />
      </div>
      <div class="mt-2.5">
        <div class="field-label">Wireshark Display Filter</div>
        <CodeBlock code={`ip.dst == ${result.ip} && udp.port == 5004`} />
      </div>
    </div>
  {/if}
</div>
