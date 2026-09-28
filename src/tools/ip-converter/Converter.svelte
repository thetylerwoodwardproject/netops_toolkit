<script lang="ts">
  import { formatIPv4, formatIPv4Binary, parseIPv4Any } from '@/lib/ipv4';

  let input = $state('');
  const value = $derived(input.trim() ? parseIPv4Any(input) : undefined);
</script>

<div class="form-group">
  <label class="form-label" for="ipc-input">Enter IP Address or Number</label>
  <input
    class="form-input mono"
    id="ipc-input"
    placeholder="192.168.1.1 or 11000000.10101000... or 3232235777"
    spellcheck="false"
    autocomplete="off"
    bind:value={input}
  />
</div>

<div aria-live="polite">
  {#if value === null}
    <div class="warn">Not an IPv4 address, or a binary, hex or decimal number up to 32 bits.</div>
  {:else if value !== undefined}
    <div class="result-box">
      <div class="result-grid">
        <div class="result-item">
          <div class="ri-label">Dotted Decimal</div>
          <div class="ri-value">{formatIPv4(value)}</div>
        </div>
        <div class="result-item">
          <div class="ri-label">Integer</div>
          <div class="ri-value">{value}</div>
        </div>
        <div class="result-item">
          <div class="ri-label">Binary</div>
          <div class="ri-value text-[11px]">{formatIPv4Binary(value)}</div>
        </div>
        <div class="result-item">
          <div class="ri-label">Hexadecimal</div>
          <div class="ri-value">0x{value.toString(16).toUpperCase().padStart(8, '0')}</div>
        </div>
      </div>
    </div>
  {/if}
</div>
