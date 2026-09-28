<script lang="ts">
  import { faChartColumn } from '@fortawesome/free-solid-svg-icons/faChartColumn';
  import Icon from '@/components/Icon.svelte';
  import { planVlsm } from '@/lib/vlsm';

  let network = $state('192.168.1.0/24');
  let requirements = $state('Engineering,50\nOperations,25\nManagement,10\nPoint-to-Point,2');

  const plan = $derived(planVlsm(network, requirements));
</script>

<div class="form-group">
  <label class="form-label" for="vlsm-net">Base Network (CIDR)</label>
  <input
    class="form-input mono"
    id="vlsm-net"
    placeholder="192.168.1.0/24"
    spellcheck="false"
    autocomplete="off"
    bind:value={network}
  />
</div>
<div class="form-group">
  <label class="form-label" for="vlsm-reqs">Subnet Requirements (one per line: name,hosts)</label>
  <textarea
    class="form-input"
    id="vlsm-reqs"
    placeholder={'Engineering,50\nOperations,25\nManagement,10\nPoint-to-Point,2'}
    spellcheck="false"
    bind:value={requirements}></textarea>
</div>

<div aria-live="polite">
  {#if 'error' in plan}
    <div class="warn">{plan.error}</div>
  {:else}
    <div class="result-box overflow-x-auto">
      <table class="ref-table">
        <thead>
          <tr>
            <th>Subnet</th><th>Needed</th><th>Allocated</th><th>Network</th><th>Mask</th><th
              >Range</th
            ><th>Broadcast</th>
          </tr>
        </thead>
        <tbody>
          {#each plan.rows as r, i (i)}
            {#if r.error}
              <tr
                ><td>{r.name}</td><td>{r.hosts}</td><td colspan="5" class="text-red">{r.error}</td
                ></tr
              >
            {:else}
              <tr>
                <td><strong>{r.name}</strong></td>
                <td>{r.hosts}</td>
                <td>{r.usable} (/{r.prefix})</td>
                <td class="mono">{r.network}</td>
                <td class="mono">{r.mask}</td>
                <td class="mono">{r.first} – {r.last}</td>
                <td class="mono">{r.broadcast}</td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
    </div>
    <div class="tip mt-3">
      <Icon icon={faChartColumn} />
      Used: {plan.used}/{plan.total} addresses ({((plan.used / plan.total) * 100).toFixed(1)}%) —
      Free: {plan.total - plan.used} addresses
    </div>
  {/if}
</div>
