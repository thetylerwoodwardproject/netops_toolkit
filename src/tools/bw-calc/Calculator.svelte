<script lang="ts">
  let size: number | null = $state(1);
  let unit = $state('1000000000');

  const speeds = [
    { name: '1 Mbps', bps: 1e6 },
    { name: '10 Mbps', bps: 1e7 },
    { name: '100 Mbps', bps: 1e8 },
    { name: '1 Gbps', bps: 1e9 },
    { name: '10 Gbps', bps: 1e10 },
    { name: '25 Gbps', bps: 25e9 },
    { name: '100 Gbps', bps: 1e11 },
  ];

  function duration(sec: number) {
    if (sec < 60) return `${sec.toFixed(1)} sec`;
    if (sec < 3600) return `${(sec / 60).toFixed(1)} min`;
    if (sec < 86400) return `${(sec / 3600).toFixed(2)} hrs`;
    return `${(sec / 86400).toFixed(2)} days`;
  }

  // An emptied number input binds null.
  const bits = $derived(size === null ? NaN : size * Number(unit) * 8);
</script>

<div class="form-row">
  <div class="form-group">
    <label class="form-label" for="bw-size">File Size</label>
    <input
      class="form-input mono"
      id="bw-size"
      type="number"
      min="0"
      step="any"
      bind:value={size}
    />
  </div>
  <div class="form-group">
    <label class="form-label" for="bw-unit">Unit</label>
    <select class="form-select" id="bw-unit" bind:value={unit}>
      <option value="1000000000">GB</option>
      <option value="1000000">MB</option>
      <option value="1000000000000">TB</option>
    </select>
  </div>
</div>

<div aria-live="polite">
  {#if Number.isFinite(bits) && bits >= 0}
    <div class="result-box">
      <table class="ref-table">
        <thead><tr><th>Link Speed</th><th>Transfer Time</th></tr></thead>
        <tbody>
          {#each speeds as s (s.name)}
            <tr><td>{s.name}</td><td class="mono">{duration(bits / s.bps)}</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="warn">Enter a file size.</div>
  {/if}
</div>
