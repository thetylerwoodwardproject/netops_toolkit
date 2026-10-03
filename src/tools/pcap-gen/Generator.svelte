<script lang="ts">
  import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons/faMagnifyingGlass';
  import CodeBlock from '@/components/CodeBlock.svelte';
  import Icon from '@/components/Icon.svelte';
  import TextField from '@/components/TextField.svelte';
  import { pcapConfig, type PcapInput } from '@/lib/gen/pcap';

  const f: PcapInput = $state({
    name: 'CAP1',
    intf: 'GigabitEthernet0/0',
    dir: 'both',
    buf: '10',
    match: 'any',
    proto: 'ip',
    src: '',
    dst: '',
    port: '',
    exportMethod: 'flash',
    server: '192.168.1.100',
  });
</script>

<div class="form-row">
  <TextField label="Capture Name" id="pcap-name" placeholder="CAP1" bind:value={f.name} />
  <TextField
    label="Interface"
    id="pcap-intf"
    placeholder="GigabitEthernet0/0"
    bind:value={f.intf}
  />
</div>
<div class="form-row">
  <div class="form-group">
    <label class="form-label" for="pcap-dir">Direction</label>
    <select class="form-select" id="pcap-dir" bind:value={f.dir}>
      <option value="both">Both (in &amp; out)</option>
      <option value="in">In only</option>
      <option value="out">Out only</option>
    </select>
  </div>
  <div class="form-group">
    <label class="form-label" for="pcap-buf">Buffer Size (MB)</label>
    <input
      class="form-input mono"
      id="pcap-buf"
      type="number"
      min="1"
      max="512"
      bind:value={f.buf}
    />
  </div>
</div>
<div class="panel mt-1">
  <h3><Icon icon={faMagnifyingGlass} /> Traffic Filter</h3>
  <div class="form-row">
    <div class="form-group">
      <label class="form-label" for="pcap-match">Match</label>
      <select class="form-select" id="pcap-match" bind:value={f.match}>
        <option value="any">Any (all traffic)</option>
        <option value="ipv4">IPv4 any</option>
        <option value="acl">Custom ACL Filter</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label" for="pcap-proto">Protocol (ACL filter only)</label>
      <select class="form-select" id="pcap-proto" bind:value={f.proto}>
        <option value="ip">Any (IP)</option>
        <option value="tcp">TCP</option>
        <option value="udp">UDP</option>
        <option value="icmp">ICMP</option>
      </select>
    </div>
  </div>
  {#if f.match === 'acl'}
    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="pcap-src"
          >Source IP / Wildcard <span class="text-text3">(blank = any)</span></label
        >
        <input
          class="form-input mono"
          id="pcap-src"
          placeholder="192.168.1.0 0.0.0.255"
          spellcheck="false"
          autocomplete="off"
          bind:value={f.src}
        />
      </div>
      <div class="form-group">
        <label class="form-label" for="pcap-dst"
          >Destination IP / Wildcard <span class="text-text3">(blank = any)</span></label
        >
        <input
          class="form-input mono"
          id="pcap-dst"
          placeholder="10.0.0.0 0.255.255.255"
          spellcheck="false"
          autocomplete="off"
          bind:value={f.dst}
        />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label" for="pcap-port"
        >Port <span class="text-text3">(TCP/UDP only — leave blank for any)</span></label
      >
      <input
        class="form-input mono"
        id="pcap-port"
        placeholder="e.g. 443"
        spellcheck="false"
        autocomplete="off"
        bind:value={f.port}
      />
    </div>
  {/if}
</div>
<div class="form-row mt-1">
  <div class="form-group">
    <label class="form-label" for="pcap-export-method">Export Method</label>
    <select class="form-select" id="pcap-export-method" bind:value={f.exportMethod}>
      <option value="flash">Flash / bootflash</option>
      <option value="tftp">TFTP Server</option>
      <option value="ftp">FTP Server</option>
      <option value="none">Don't include export</option>
    </select>
  </div>
  {#if f.exportMethod !== 'none'}
    <div class="form-group">
      <label class="form-label" for="pcap-server"
        >Server IP <span class="text-text3">(TFTP/FTP, and the flash copy hint)</span></label
      >
      <input
        class="form-input mono"
        id="pcap-server"
        placeholder="192.168.1.100"
        spellcheck="false"
        autocomplete="off"
        bind:value={f.server}
      />
    </div>
  {/if}
</div>

<div aria-live="polite">
  <CodeBlock code={pcapConfig(f)} />
</div>
