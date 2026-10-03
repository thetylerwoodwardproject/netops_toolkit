<script lang="ts">
  import SelectField from '@/components/SelectField.svelte';
  import { faGear } from '@fortawesome/free-solid-svg-icons/faGear';
  import CodeBlock from '@/components/CodeBlock.svelte';
  import Icon from '@/components/Icon.svelte';
  import TextField from '@/components/TextField.svelte';
  import { staticRouteConfig, type StaticRouteInput } from '@/lib/gen/static-route';

  const f: StaticRouteInput = $state({
    type: 'standard',
    dest: '10.10.10.0',
    mask: '255.255.255.0',
    nexthop: '192.168.1.1',
    intf: '',
    ad: '210',
    desc: '',
    bulk: '',
  });

  // Picking a type fills in what it implies, as the old site did, and a sample
  // IPv6 route replaces the IPv4 one (an IPv4 next hop makes no sense there).
  function onType() {
    if (f.type === 'default') {
      f.dest = '0.0.0.0';
      f.mask = '0.0.0.0';
    } else if (f.type === 'ipv6') {
      f.dest = '2001:db8:acad::/48';
      f.mask = '';
      f.nexthop = '2001:db8:acad:1::1';
    } else if (f.dest.includes(':')) {
      f.dest = '10.10.10.0';
      f.mask = '255.255.255.0';
      f.nexthop = '192.168.1.1';
    }
  }

  const destLabel = $derived(
    f.type === 'default'
      ? 'Destination (fixed 0.0.0.0)'
      : f.type === 'ipv6'
        ? 'IPv6 Prefix (include /length)'
        : 'Destination Network',
  );
  const maskLabel = $derived(f.type === 'default' ? 'Mask (fixed 0.0.0.0)' : 'Subnet Mask');
</script>

<div class="panel">
  <h3><Icon icon={faGear} /> Route Entry Builder</h3>
  <div class="form-row">
    <SelectField
      label="Route Type"
      id="sr-type"
      bind:value={f.type}
      onchange={onType}
      options={[
        { value: 'standard', label: 'Standard Static Route' },
        { value: 'default', label: 'Default Route (0.0.0.0/0)' },
        { value: 'floating', label: 'Floating Static (Backup)' },
        { value: 'null', label: 'Null0 Black Hole' },
        { value: 'ipv6', label: 'IPv6 Static Route' },
        { value: 'summary', label: 'Summary / Supernet' },
      ]}
    />
    <TextField label={destLabel} id="sr-dest" placeholder="10.10.10.0" bind:value={f.dest} />
  </div>
  <div class="form-row">
    {#if f.type !== 'ipv6'}
      <TextField label={maskLabel} id="sr-mask" placeholder="255.255.255.0" bind:value={f.mask} />
    {/if}
    {#if f.type !== 'null'}
      <TextField
        label="Next-Hop IP"
        id="sr-nexthop"
        placeholder="192.168.1.1"
        bind:value={f.nexthop}
      />
    {/if}
  </div>
  <div class="form-row">
    {#if f.type !== 'null'}
      <div class="form-group">
        <label class="form-label" for="sr-intf"
          >Exit Interface
          <span class="font-normal text-text3">(optional, recommended with next-hop)</span></label
        >
        <input
          class="form-input mono"
          id="sr-intf"
          placeholder="GigabitEthernet0/0/1"
          spellcheck="false"
          autocomplete="off"
          bind:value={f.intf}
        />
      </div>
    {/if}
    {#if f.type === 'floating'}
      <div class="form-group">
        <label class="form-label" for="sr-ad"
          >Administrative Distance
          <span class="font-normal text-text3">(e.g. 210 for OSPF backup)</span></label
        >
        <input
          class="form-input mono"
          id="sr-ad"
          placeholder="210"
          spellcheck="false"
          autocomplete="off"
          bind:value={f.ad}
        />
      </div>
    {/if}
  </div>
  <div class="form-group mt-1.5">
    <label class="form-label" for="sr-bulk"
      >+ Bulk Routes
      <span class="font-normal text-text3">(one per line: network mask nexthop)</span></label
    >
    <textarea
      class="form-input min-h-[70px]"
      id="sr-bulk"
      placeholder={'172.16.0.0 255.255.0.0 10.0.0.1\n192.168.50.0 255.255.255.0 10.0.0.2\n10.20.0.0 255.255.0.0 10.0.0.1'}
      spellcheck="false"
      bind:value={f.bulk}></textarea>
  </div>
  <div class="form-group mt-2">
    <label class="form-label" for="sr-desc"
      >Description / Remark <span class="font-normal text-text3">(optional)</span></label
    >
    <input
      class="form-input mono"
      id="sr-desc"
      placeholder="WAN-backup-link or DATA-VLAN-10"
      spellcheck="false"
      autocomplete="off"
      bind:value={f.desc}
    />
  </div>
</div>

<div aria-live="polite">
  <CodeBlock code={staticRouteConfig(f)} />
</div>
