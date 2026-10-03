<script lang="ts">
  import { faDownload } from '@fortawesome/free-solid-svg-icons/faDownload';
  import CodeBlock from '@/components/CodeBlock.svelte';
  import Icon from '@/components/Icon.svelte';
  import TextField from '@/components/TextField.svelte';
  import { netplanYaml, type NetplanInput } from '@/lib/gen/netplan';

  const f: NetplanInput = $state({
    interface: 'eth0',
    renderer: 'networkd',
    mode: 'dhcp',
    address: '',
    gateway: '',
    nameservers: '',
  });
  let filename = $state('01-netcfg.yaml');

  const yaml = $derived(netplanYaml(f));

  function download() {
    const url = URL.createObjectURL(new Blob([yaml], { type: 'text/yaml' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || '01-netcfg.yaml';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
</script>

<div class="form-row">
  <TextField label="Interface" id="np-interface" bind:value={f.interface} />
  <div class="form-group">
    <label class="form-label" for="np-renderer">Renderer</label>
    <select class="form-select" id="np-renderer" bind:value={f.renderer}>
      <option value="networkd">networkd</option>
      <option value="NetworkManager">NetworkManager</option>
    </select>
  </div>
</div>
<div class="form-row">
  <div class="form-group">
    <label class="form-label" for="np-mode">Mode</label>
    <select class="form-select" id="np-mode" bind:value={f.mode}>
      <option value="dhcp">DHCP (IPv4)</option>
      <option value="static">Static (IPv4)</option>
    </select>
  </div>
  <TextField label="Filename" id="np-filename" bind:value={filename} />
</div>
{#if f.mode === 'static'}
  <TextField
    label="Address (CIDR)"
    id="np-address"
    placeholder="192.168.1.10/24"
    bind:value={f.address}
  />
  <div class="form-row">
    <TextField label="Gateway" id="np-gateway" placeholder="192.168.1.1" bind:value={f.gateway} />
    <TextField
      label="Nameservers (comma separated)"
      id="np-nameservers"
      placeholder="8.8.8.8,1.1.1.1"
      bind:value={f.nameservers}
    />
  </div>
{/if}

<div aria-live="polite">
  <CodeBlock code={yaml} />
</div>
<div class="btn-group mt-2">
  <button class="btn btn-secondary" type="button" onclick={download}>
    <Icon icon={faDownload} /> Download
  </button>
</div>
