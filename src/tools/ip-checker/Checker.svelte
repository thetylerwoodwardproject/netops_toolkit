<script lang="ts">
  import { onMount } from 'svelte';
  import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons/faArrowsRotate';
  import { faDesktop } from '@fortawesome/free-solid-svg-icons/faDesktop';
  import { faEarthAmericas } from '@fortawesome/free-solid-svg-icons/faEarthAmericas';
  import { faGlobe } from '@fortawesome/free-solid-svg-icons/faGlobe';
  import Icon from '@/components/Icon.svelte';
  import {
    browserInfo,
    fetchGeo,
    fetchIPv4,
    fetchIPv6,
    fetchIpFallback,
    reverseDns,
  } from '@/lib/ipcheck';

  type Tone = 'warn' | 'ok' | 'muted';
  type Cell =
    | { t: 'skel' }
    | { t: 'text'; v: string }
    | { t: 'badge'; tone: Tone; v: string }
    | { t: 'link'; href: string; v: string };

  const publicRows = [
    ['ipv6', 'IPv6 Address'],
    ['hostname', 'Hostname (PTR)'],
    ['network', 'Network Block (CIDR)'],
    ['org', 'ISP / Org'],
    ['asn', 'ASN'],
    ['location', 'Location'],
    ['timezone', 'Timezone'],
    ['calling', 'Calling Code'],
    ['type', 'Connection Type'],
    ['coords', 'Coordinates'],
  ] as const;
  const browserRows = [
    ['browser', 'Browser'],
    ['os', 'Platform / OS'],
    ['device', 'Device Type'],
    ['screen', 'Screen Resolution'],
    ['theme', 'Color Scheme'],
    ['cpu', 'CPU Threads'],
  ] as const;
  type Key = (typeof publicRows)[number][0] | (typeof browserRows)[number][0];

  const skel = (): Cell => ({ t: 'skel' });
  const text = (v?: string | null): Cell => ({ t: 'text', v: v || '—' });
  const badge = (tone: Tone, v: string): Cell => ({ t: 'badge', tone, v });
  const keys = [...publicRows, ...browserRows].map(([k]) => k);
  const blank = () => Object.fromEntries(keys.map((k) => [k, skel()])) as Record<Key, Cell>;

  let cells: Record<Key, Cell> = $state(blank());
  let ip: { loading: true } | { loading: false; addr?: string; none?: boolean } = $state({
    loading: true,
  });
  let ipCopied = $state(false);
  let error = $state('');
  let busy = $state(false);
  let updated = $state('');

  const badgeClass: Record<Tone, string> = {
    warn: 'border-yellow/25 bg-yellow/10 text-yellow',
    ok: 'border-green/25 bg-green/10 text-green',
    muted: 'border-white/10 bg-white/5 text-text3',
  };

  async function copyIp(addr: string) {
    try {
      await navigator.clipboard.writeText(addr);
      ipCopied = true;
      setTimeout(() => (ipCopied = false), 1800);
    } catch {
      // clipboard unavailable
    }
  }

  async function refresh() {
    ip = { loading: true };
    cells = blank();
    error = '';
    busy = true;

    const [ipv4, ipv6, info] = await Promise.all([fetchIPv4(), fetchIPv6(), browserInfo()]);

    cells.ipv6 = ipv6 ? text(ipv6) : badge('muted', 'Not detected');
    cells.browser = text(info.browser);
    cells.os = text(info.os);
    cells.device = badge('muted', info.mobile ? 'Mobile' : 'Desktop');
    cells.screen = text(`${screen.width} × ${screen.height}  ·  ${window.devicePixelRatio}x`);
    cells.theme = badge(
      'muted',
      window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark' : 'Light',
    );
    cells.cpu = text(
      navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} logical cores` : '—',
    );

    try {
      const d = await fetchGeo(ipv4);

      // The explicitly fetched IPv4, else the geolocation answer if it is dotted-decimal.
      const resolved = ipv4 || (/^\d{1,3}(\.\d{1,3}){3}$/.test(d.ip ?? '') ? d.ip! : null);
      if (resolved) {
        ip = { loading: false, addr: resolved };
        cells.hostname = text('…');
        reverseDns(resolved).then((ptr) => (cells.hostname = text(ptr || 'No PTR record')));
      } else {
        ip = { loading: false, none: true };
        cells.hostname = text('—');
      }

      cells.network = text(d.network);
      cells.org = text(d.org);
      cells.asn = text(d.asn);

      const flag = d.country_code
        ? String.fromCodePoint(...[...d.country_code].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0)))
        : '';
      const loc = [d.city, d.region, d.country_name].filter(Boolean).join(', ');
      cells.location = text(flag ? `${flag}  ${loc}` : loc);

      cells.timezone = text(d.timezone);
      cells.calling = text(d.country_calling_code);
      cells.type = d.proxy ? badge('warn', 'Proxy / VPN') : badge('ok', 'Residential / ISP');

      if (d.latitude && d.longitude) {
        const lat = parseFloat(String(d.latitude)).toFixed(4);
        const lon = parseFloat(String(d.longitude)).toFixed(4);
        cells.coords = {
          t: 'link',
          href: `https://www.google.com/maps?q=${lat},${lon}`,
          v: `${lat}, ${lon} ↗`,
        };
      } else {
        cells.coords = text();
      }

      busy = false;
      updated = `Last updated: ${new Date().toLocaleTimeString()}`;
    } catch {
      try {
        const addr = await fetchIpFallback();
        ip = { loading: false, addr };
        for (const [k] of publicRows) if (k !== 'ipv6') cells[k] = text('Unavailable');
        busy = false;
        updated = `Last updated: ${new Date().toLocaleTimeString()} (limited data)`;
      } catch {
        busy = false;
        ip = { loading: false };
        error = 'Could not reach IP lookup APIs. Check your connection.';
      }
    }
  }

  // Lookups happen only in the browser, never at build time.
  onMount(refresh);
</script>

{#snippet value(c: Cell)}
  {#if c.t === 'skel'}
    <span class="inline-block h-3 w-[110px] animate-pulse rounded bg-line2 align-middle"></span>
  {:else if c.t === 'badge'}
    <span
      class="inline-block rounded border px-[7px] py-0.5 text-[11px] font-semibold tracking-[0.05em] uppercase {badgeClass[
        c.tone
      ]}">{c.v}</span
    >
  {:else if c.t === 'link'}
    <a href={c.href} target="_blank" rel="noopener">{c.v}</a>
  {:else}
    {c.v}
  {/if}
{/snippet}

<div class="panel mb-3.5">
  <div class="flex items-center gap-3.5">
    <div
      class="grid size-10 shrink-0 place-items-center rounded-field border border-accent/25 bg-accent/12 text-accent"
    >
      <Icon icon={faEarthAmericas} size={20} />
    </div>
    <div>
      <div class="mb-1 text-[10px] font-bold tracking-[0.08em] text-text3 uppercase">
        Public IPv4 Address
      </div>
      <div
        class="flex min-h-7 flex-wrap items-center gap-2.5 {ip.loading
          ? 'text-[15px] font-normal text-text3'
          : 'text-[22px] font-bold tracking-tight text-white'}"
        id="ipc-ip"
        aria-live="polite"
      >
        {#if ip.loading}
          Fetching...
        {:else if ip.addr}
          {ip.addr}
          <button
            type="button"
            class="cursor-pointer rounded-[5px] border px-2 py-[3px] text-[11px] font-semibold tracking-[0.06em] whitespace-nowrap uppercase transition-colors {ipCopied
              ? 'border-accent bg-accent text-accent-ink'
              : 'border-accent/20 bg-accent/12 text-accent hover:bg-accent/20'}"
            onclick={() => copyIp(ip.loading ? '' : (ip.addr ?? ''))}
          >
            {ipCopied ? 'Copied!' : 'Copy'}
          </button>
        {:else if ip.none}
          <span
            class="inline-block rounded border border-white/10 bg-white/5 px-[7px] py-0.5 text-[11px] font-semibold tracking-[0.05em] text-text3 uppercase"
            >IPv4 not available</span
          >
        {:else}
          Error
        {/if}
      </div>
    </div>
  </div>
</div>

<div class="panel mb-3.5">
  <h3><Icon icon={faGlobe} /> Public Network</h3>
  <table class="ref-table">
    <tbody>
      {#each publicRows as [key, label] (key)}
        <tr
          ><td class="text-text3 {key === 'ipv6' ? 'w-[38%]' : ''}">{label}</td><td
            >{@render value(cells[key])}</td
          ></tr
        >
      {/each}
    </tbody>
  </table>
</div>

<div class="panel mb-3.5">
  <h3><Icon icon={faDesktop} /> Browser &amp; System</h3>
  <table class="ref-table">
    <tbody>
      {#each browserRows as [key, label] (key)}
        <tr
          ><td class="text-text3 {key === 'browser' ? 'w-[38%]' : ''}">{label}</td><td
            >{@render value(cells[key])}</td
          ></tr
        >
      {/each}
    </tbody>
  </table>
</div>

{#if error}
  <div class="warn" role="alert">{error}</div>
{/if}

<button
  class="btn btn-secondary mb-2.5 flex w-full items-center justify-center gap-1.5"
  type="button"
  onclick={refresh}
>
  <Icon icon={faArrowsRotate} size={13} class={busy ? 'animate-spin' : ''} />
  Refresh
</button>

<div class="mb-4 text-center text-[11px] text-text3 opacity-70">{updated}</div>
