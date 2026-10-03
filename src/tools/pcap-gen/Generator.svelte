<script lang="ts">
  import SelectField from '@/components/SelectField.svelte';
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
  <SelectField
    label="Direction"
    id="pcap-dir"
    bind:value={f.dir}
    options={[
      { value: 'both', label: 'Both (in & out)' },
      { value: 'in', label: 'In only' },
      { value: 'out', label: 'Out only' },
    ]}
  />
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
    <SelectField
      label="Match"
      id="pcap-match"
      bind:value={f.match}
      options={[
        { value: 'any', label: 'Any (all traffic)' },
        { value: 'ipv4', label: 'IPv4 any' },
        { value: 'acl', label: 'Custom ACL Filter' },
      ]}
    />
    <SelectField
      label="Protocol (ACL filter only)"
      id="pcap-proto"
      bind:value={f.proto}
      options={[
        { value: 'ip', label: 'Any (IP)' },
        { value: 'tcp', label: 'TCP' },
        { value: 'udp', label: 'UDP' },
        { value: 'icmp', label: 'ICMP' },
      ]}
    />
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
  <SelectField
    label="Export Method"
    id="pcap-export-method"
    bind:value={f.exportMethod}
    options={[
      { value: 'flash', label: 'Flash / bootflash' },
      { value: 'tftp', label: 'TFTP Server' },
      { value: 'ftp', label: 'FTP Server' },
      { value: 'none', label: "Don't include export" },
    ]}
  />
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
