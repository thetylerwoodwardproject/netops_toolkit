<script lang="ts">
  import { faLaptop } from '@fortawesome/free-solid-svg-icons/faLaptop';
  import CodeBlock from '@/components/CodeBlock.svelte';
  import Icon from '@/components/Icon.svelte';
  import TextField from '@/components/TextField.svelte';
  import { eigrpConfig, type EigrpInput } from '@/lib/gen/eigrp';

  const f: EigrpInput = $state({
    mode: 'classic',
    asNum: '100',
    name: 'ENTERPRISE',
    activeIntf: 'GigabitEthernet0/0',
    networks: '10.0.0.0 0.0.255.255\n192.168.1.0 0.0.0.255',
    passive: 'Loopback0,GigabitEthernet0/1',
    hello: '5',
    hold: '15',
    noAutoSummary: true,
    variance: false,
    varianceVal: '2',
    stub: false,
  });
</script>

<div class="panel">
  <h3><Icon icon={faLaptop} /> EIGRP Config Generator</h3>
  <div class="form-row">
    <div class="form-group">
      <label class="form-label" for="eigrp-mode">EIGRP Mode</label>
      <select class="form-select" id="eigrp-mode" bind:value={f.mode}>
        <option value="classic">Classic</option>
        <option value="named">Named Mode</option>
      </select>
    </div>
    <TextField label="AS Number" id="eigrp-as" bind:value={f.asNum} />
  </div>
  {#if f.mode === 'named'}
    <TextField label="Process Name (Named Mode)" id="eigrp-name" bind:value={f.name} />
  {/if}
  <TextField
    label="Active Interface (no passive-interface)"
    id="eigrp-active-intf"
    bind:value={f.activeIntf}
  />
  <div class="form-group">
    <label class="form-label" for="eigrp-networks">Networks (one per line: network wildcard)</label>
    <textarea
      class="form-input"
      id="eigrp-networks"
      placeholder={'10.0.0.0 0.0.255.255\n192.168.1.0 0.0.0.255'}
      spellcheck="false"
      bind:value={f.networks}></textarea>
  </div>
  <TextField
    label="Passive Interfaces (comma-separated)"
    id="eigrp-passive"
    bind:value={f.passive}
  />
  <div class="form-row">
    <TextField label="Hello Timer (sec)" id="eigrp-hello" placeholder="5" bind:value={f.hello} />
    <TextField label="Hold Timer (sec)" id="eigrp-hold" placeholder="15" bind:value={f.hold} />
  </div>
  <label class="my-1 flex items-center gap-1.5 text-[12px] text-text2">
    <input
      type="checkbox"
      id="eigrp-no-autosummary"
      class="accent-accent"
      bind:checked={f.noAutoSummary}
    />
    no auto-summary (classic mode)
  </label>
  <label class="my-1 flex items-center gap-1.5 text-[12px] text-text2">
    <input type="checkbox" id="eigrp-variance" class="accent-accent" bind:checked={f.variance} />
    Enable unequal-cost load balancing (variance)
  </label>
  {#if f.variance}
    <div class="mt-2">
      <TextField label="Variance Multiplier" id="eigrp-variance-val" bind:value={f.varianceVal} />
    </div>
  {/if}
  <label class="my-1 flex items-center gap-1.5 text-[12px] text-text2">
    <input type="checkbox" id="eigrp-stub" class="accent-accent" bind:checked={f.stub} />
    Configure as EIGRP stub (connected, summary)
  </label>
</div>

<div aria-live="polite">
  <CodeBlock code={eigrpConfig(f)} />
  <div class="tip">
    <strong>Notes:</strong>
    <ul class="mt-1 ml-5 list-disc">
      <li>
        Mode: <strong>{f.mode === 'classic' ? 'Classic' : 'Named'}</strong> — AS
        <strong>{f.asNum.trim()}</strong>
      </li>
      <li>
        passive-interface default enabled — only <strong>{f.activeIntf.trim()}</strong> sends hellos by
        default
      </li>
      {#if f.variance}
        <li>Unequal-cost LB enabled with variance <strong>{f.varianceVal.trim()}</strong></li>
      {/if}
      {#if f.stub}
        <li>EIGRP stub configured — reduces query scope in hub-and-spoke</li>
      {/if}
    </ul>
  </div>
</div>
