<script lang="ts">
  import { faEthernet } from '@fortawesome/free-solid-svg-icons/faEthernet';
  import { faPaste } from '@fortawesome/free-solid-svg-icons/faPaste';
  import Icon from '@/components/Icon.svelte';
  import { parseTdr, statusTone, type Tone } from '@/lib/gen/cable-diag';

  let paste = $state('');
  const result = $derived(paste.trim() ? parseTdr(paste) : undefined);

  const text: Record<Tone, string> = {
    green: 'text-green',
    red: 'text-red',
    orange: 'text-orange',
    muted: 'text-text3',
  };
  const box: Record<string, string> = {
    green: 'border-green bg-green/10',
    red: 'border-red bg-red/10',
    orange: 'border-orange bg-orange/10',
    none: 'border-text3 bg-surface',
  };
  const label: Record<string, string> = {
    green: 'text-green',
    red: 'text-red',
    orange: 'text-orange',
    none: 'text-text3',
  };
</script>

<div class="panel">
  <h3><Icon icon={faPaste} /> Paste TDR Results</h3>
  <p class="text-[12.5px] text-text2">
    Paste the output of <code>show cable-diagnostics tdr interface &lt;intf&gt;</code> below and this
    will parse each pair's status, distance, and give you a plain-English verdict.
  </p>
  <textarea
    class="form-input mono mt-2 min-h-[150px]"
    id="cd-paste"
    placeholder={`TDR test last run on: March 01 20:23:00
Interface Speed Local pair Pair length        Remote pair Pair status
--------- ----- ---------- ------------------ ----------- --------------------
Gi0/1     1000  Pair A     41   +/- 10 meters  Pair A      Terminated
                Pair B     41   +/- 10 meters  Pair B      Terminated
                Pair C     42   +/- 10 meters  Pair C      Terminated
                Pair D     42   +/- 10 meters  Pair D      Terminated`}
    spellcheck="false"
    bind:value={paste}></textarea>
</div>

<div aria-live="polite">
  {#if result === null}
    <div class="warn">
      Couldn’t find any <code>Pair A/B/C/D</code> rows in the pasted text. Make sure you pasted the
      full output of <code>show cable-diagnostics tdr interface &lt;intf&gt;</code>.
    </div>
  {:else if result}
    {#if result.testTime}
      <div class="tip">Test last run on: <strong>{result.testTime}</strong></div>
    {/if}
    {#each result.interfaces as intf (intf.name)}
      <div class="panel mt-3">
        <h3>
          <Icon icon={faEthernet} />
          {intf.name}
          {#if intf.speed}
            <span class="text-[12px] font-normal text-text3">(speed: {intf.speed})</span>
          {/if}
        </h3>
        <div
          class="mb-3 rounded-field border-l-3 px-3.5 py-2.5 text-[12.5px] text-text2 {box[
            intf.verdict.tone
          ]}"
        >
          <strong class={label[intf.verdict.tone]}>{intf.verdict.label}:</strong>
          {intf.verdict.text}
        </div>
        <div class="result-grid">
          {#each intf.pairs as p, i (i)}
            <div class="result-item">
              <div class="ri-label">Pair {p.pair}</div>
              <div class="ri-value {text[statusTone(p.status)]}">{p.status}</div>
              <div class="mt-1 text-[11px] text-text3">
                {p.length} m ± {p.tolerance} m{p.remote !== '—' ? ` · remote: ${p.remote}` : ''}
              </div>
            </div>
          {/each}
        </div>
        <div class="mt-2.5 text-[12px] leading-[1.7] text-text2">
          {#each intf.statuses as s (s.status)}
            <div><strong class={text[s.tone]}>{s.status}:</strong> {s.explain}</div>
          {/each}
        </div>
      </div>
    {/each}
  {/if}
</div>
