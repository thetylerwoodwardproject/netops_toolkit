<script lang="ts">
  import SelectField from '@/components/SelectField.svelte';
  // Keyed rather than valued by Mbps: Livestream and AES67 share 4.80, and the
  // original's <select value="4.80"> couldn't tell them apart.
  const types = {
    standard: { label: 'Standard — 5ms / 240 samples (~2.43 Mbps)', mbps: 2.43 },
    livestream: { label: 'Livestream — 1ms / 12 samples (~4.80 Mbps)', mbps: 4.8 },
    surround: { label: 'Surround / 5.1 — 8ch, 5ms (~9.70 Mbps)', mbps: 9.7 },
    aes67: { label: 'AES67 — 1ms default (~4.80 Mbps)', mbps: 4.8 },
  };

  let count: number | null = $state(10);
  let type: keyof typeof types = $state('standard');

  const result = $derived.by(() => {
    if (count === null || !Number.isFinite(count) || Math.trunc(count) < 1) {
      return { error: 'Enter a valid number of streams (minimum 1).' };
    }
    const each = types[type].mbps;
    const total = Math.trunc(count) * each;
    const headroom = total * 1.25;
    const gbe =
      headroom <= 700
        ? { text: 'Yes', class: 'green' }
        : headroom <= 1000
          ? { text: 'Marginal', class: 'orange' }
          : { text: 'No — use 10GbE', class: 'text-red' };
    return { each, total, headroom, gbe };
  });
</script>

<div class="form-row">
  <div class="form-group">
    <label class="form-label" for="lw-bw-count">Number of Streams</label>
    <input
      type="number"
      id="lw-bw-count"
      class="form-input mono"
      placeholder="e.g. 10"
      min="1"
      max="1000"
      bind:value={count}
    />
  </div>
  <SelectField
    label="Stream Type"
    id="lw-bw-type"
    bind:value={() => type, (v) => (type = v as keyof typeof types)}
    options={Object.entries(types).map(([value, t]) => ({ value, label: t.label }))}
  />
</div>

<div aria-live="polite">
  {#if 'error' in result}
    <div class="mb-2 text-[12px] text-red">{result.error}</div>
  {:else}
    <div class="result-box mt-4">
      <div class="result-grid">
        <div class="result-item">
          <div class="ri-label">Per Stream</div>
          <div class="ri-value">{result.each.toFixed(2)} Mbps</div>
        </div>
        <div class="result-item">
          <div class="ri-label">Total Bandwidth</div>
          <div class="ri-value">{result.total.toFixed(2)} Mbps</div>
        </div>
        <div class="result-item">
          <div class="ri-label">Headroom (×1.25)</div>
          <div class="ri-value">{result.headroom.toFixed(2)} Mbps</div>
        </div>
        <div class="result-item">
          <div class="ri-label">1GbE Sufficient?</div>
          <div class="ri-value {result.gbe.class}">{result.gbe.text}</div>
        </div>
      </div>
    </div>
    {#if result.total > 100}
      <div class="warn mt-3">
        <strong>Exceeds 100 Mbps</strong> — Consider a dedicated AoIP VLAN, 10GbE uplinks, or reducing
        stream count.
      </div>
    {/if}
  {/if}
</div>
