<script lang="ts">
  import { faPuzzlePiece } from '@fortawesome/free-solid-svg-icons/faPuzzlePiece';
  import { faWrench } from '@fortawesome/free-solid-svg-icons/faWrench';
  import CodeBlock from '@/components/CodeBlock.svelte';
  import Icon from '@/components/Icon.svelte';
  import {
    NO_OPERATOR,
    wsExpression,
    wsFilter,
    type WsCategory,
    type WsCondition,
    type WsFields,
  } from '@/lib/gen/wireshark';

  let cat: WsCategory = $state('ip');
  let op = $state('==');
  let join = $state(' && ');
  let conds: WsCondition[] = $state([]);
  let error = $state('');
  const f: WsFields = $state({
    ipDir: 'ip.addr',
    ipVal: '',
    portProto: 'tcp.port',
    portVal: '',
    protoVal: 'tcp',
    flagVal: 'tcp.flags.syn == 1',
    macDir: 'eth.addr',
    macVal: '',
    vlanVal: '',
    httpField: 'http.request.method',
    httpVal: '',
    dnsField: 'dns.qry.name',
    dnsVal: '',
    sipType: 'sip',
    sipVal: '',
    icmpType: 'icmp',
    frameField: 'frame.len',
    frameVal: '',
    customField: '',
    customVal: '',
  });

  const protocols =
    'tcp udp icmp icmpv6 arp dns http http2 tls ftp smtp pop imap dhcp dhcpv6 ospf bgp eigrp stp cdp lldp snmp ntp sip rtp rtsp h323 igmp pim vlan mpls gre esp vxlan ptp mdns ssdp smb smb2 nbns kerberos ldap radius'.split(
      ' ',
    );

  const filter = $derived(wsFilter(conds));

  function add(negate: boolean) {
    const r = wsExpression(cat, op, f);
    if ('error' in r) {
      error = r.error;
      return;
    }
    error = '';
    conds.push({ expr: negate ? `!(${r.expr})` : r.expr, join });
  }
</script>

<div class="panel">
  <h3><Icon icon={faWrench} /> Display Filter Builder</h3>
  <p class="mb-3 text-[13px] text-text2">
    Select a category, configure the condition, then click <strong>Add Condition</strong>.
    Conditions stack — choose AND / OR to join them. Use <strong>Negate</strong> to wrap in
    <code>!(…)</code> for safe exclusions.
  </p>
  <div class="form-row">
    <div class="form-group">
      <label class="form-label" for="ws-cat">Category</label>
      <select class="form-select" id="ws-cat" bind:value={cat}>
        <option value="ip">IP Address</option>
        <option value="port">TCP/UDP Port</option>
        <option value="proto">Protocol</option>
        <option value="tcp-flags">TCP Flags</option>
        <option value="mac">MAC / Ethernet</option>
        <option value="vlan">VLAN</option>
        <option value="http">HTTP</option>
        <option value="dns">DNS</option>
        <option value="sip">SIP / RTP</option>
        <option value="icmp">ICMP</option>
        <option value="frame">Frame / Size</option>
        <option value="custom">Custom Field</option>
      </select>
    </div>
    {#if !NO_OPERATOR.includes(cat)}
      <div class="form-group">
        <label class="form-label" for="ws-op">Operator</label>
        <select class="form-select" id="ws-op" bind:value={op}>
          <option value="==">== (equals)</option>
          <option value="!=">!= (not equal)*</option>
          <option value=">">&gt; (greater than)</option>
          <option value="<">&lt; (less than)</option>
          <option value="contains">contains</option>
          <option value="matches">matches (regex)</option>
        </select>
      </div>
    {/if}
  </div>

  {#if cat === 'ip'}
    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="ws-ip-dir">Direction</label>
        <select class="form-select" id="ws-ip-dir" bind:value={f.ipDir}>
          <option value="ip.addr">Either (ip.addr)</option>
          <option value="ip.src">Source (ip.src)</option>
          <option value="ip.dst">Destination (ip.dst)</option>
          <option value="ipv6.addr">IPv6 Either</option>
          <option value="ipv6.src">IPv6 Src</option>
          <option value="ipv6.dst">IPv6 Dst</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="ws-ip-val">IP / CIDR</label>
        <input
          class="form-input mono"
          id="ws-ip-val"
          placeholder="192.168.1.10 or 10.0.0.0/8"
          spellcheck="false"
          autocomplete="off"
          bind:value={f.ipVal}
        />
      </div>
    </div>
  {:else if cat === 'port'}
    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="ws-port-proto">Protocol</label>
        <select class="form-select" id="ws-port-proto" bind:value={f.portProto}>
          <option value="tcp.port">TCP (either)</option>
          <option value="tcp.srcport">TCP Source</option>
          <option value="tcp.dstport">TCP Dest</option>
          <option value="udp.port">UDP (either)</option>
          <option value="udp.srcport">UDP Source</option>
          <option value="udp.dstport">UDP Dest</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="ws-port-val">Port Number</label>
        <input
          class="form-input mono"
          id="ws-port-val"
          placeholder="443"
          spellcheck="false"
          autocomplete="off"
          bind:value={f.portVal}
        />
      </div>
    </div>
  {:else if cat === 'proto'}
    <div class="form-group">
      <label class="form-label" for="ws-proto-val">Protocol</label>
      <select class="form-select" id="ws-proto-val" bind:value={f.protoVal}>
        {#each protocols as p (p)}<option>{p}</option>{/each}
      </select>
    </div>
  {:else if cat === 'tcp-flags'}
    <div class="form-group">
      <label class="form-label" for="ws-flag-val">Flag / Condition</label>
      <select class="form-select" id="ws-flag-val" bind:value={f.flagVal}>
        <option value="tcp.flags.syn == 1">SYN set</option>
        <option value="tcp.flags.ack == 1">ACK set</option>
        <option value="tcp.flags.fin == 1">FIN set</option>
        <option value="tcp.flags.reset == 1">RST set</option>
        <option value="tcp.flags.push == 1">PSH set</option>
        <option value="tcp.flags.urg == 1">URG set</option>
        <option value="tcp.flags.syn == 1 && tcp.flags.ack == 0">SYN only (new connection)</option>
        <option value="tcp.flags.syn == 1 && tcp.flags.ack == 1">SYN-ACK</option>
        <option value="tcp.window_size == 0 && tcp.flags.reset != 1">Zero-window</option>
      </select>
    </div>
  {:else if cat === 'mac'}
    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="ws-mac-dir">Direction</label>
        <select class="form-select" id="ws-mac-dir" bind:value={f.macDir}>
          <option value="eth.addr">Either</option>
          <option value="eth.src">Source</option>
          <option value="eth.dst">Destination</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="ws-mac-val">MAC Address</label>
        <input
          class="form-input mono"
          id="ws-mac-val"
          placeholder="aa:bb:cc:dd:ee:ff"
          spellcheck="false"
          autocomplete="off"
          bind:value={f.macVal}
        />
      </div>
    </div>
  {:else if cat === 'vlan'}
    <div class="form-group">
      <label class="form-label" for="ws-vlan-val">VLAN ID (blank = any tagged frame)</label>
      <input
        class="form-input mono"
        id="ws-vlan-val"
        placeholder="100"
        spellcheck="false"
        autocomplete="off"
        bind:value={f.vlanVal}
      />
    </div>
  {:else if cat === 'http'}
    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="ws-http-field">Field</label>
        <select class="form-select" id="ws-http-field" bind:value={f.httpField}>
          <option value="http.request.method">Method (GET, POST…)</option>
          <option value="http.response.code">Response Code</option>
          <option value="http.request.uri">URI path</option>
          <option value="http.host">Host header</option>
          <option value="http.authorization">Authorization (any)</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="ws-http-val">Value</label>
        <input
          class="form-input mono"
          id="ws-http-val"
          placeholder="GET  or  404  or  /login"
          spellcheck="false"
          autocomplete="off"
          bind:value={f.httpVal}
        />
      </div>
    </div>
  {:else if cat === 'dns'}
    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="ws-dns-field">Field</label>
        <select class="form-select" id="ws-dns-field" bind:value={f.dnsField}>
          <option value="dns.qry.name">Query name</option>
          <option value="dns.resp.name">Response name</option>
          <option value="dns.qry.type">Query type (A=1, AAAA=28)</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="ws-dns-val">Value</label>
        <input
          class="form-input mono"
          id="ws-dns-val"
          placeholder="example.com"
          spellcheck="false"
          autocomplete="off"
          bind:value={f.dnsVal}
        />
      </div>
    </div>
  {:else if cat === 'sip'}
    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="ws-sip-type">Filter</label>
        <select class="form-select" id="ws-sip-type" bind:value={f.sipType}>
          <option value="sip">All SIP</option>
          <option value="rtp">All RTP</option>
          <option value="sip.Method">SIP Method</option>
          <option value="sip.Status-Code">SIP Status Code</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="ws-sip-val">Value (if field)</label>
        <input
          class="form-input mono"
          id="ws-sip-val"
          placeholder="INVITE  or  200"
          spellcheck="false"
          autocomplete="off"
          bind:value={f.sipVal}
        />
      </div>
    </div>
  {:else if cat === 'icmp'}
    <div class="form-group">
      <label class="form-label" for="ws-icmp-type">Type</label>
      <select class="form-select" id="ws-icmp-type" bind:value={f.icmpType}>
        <option value="icmp">All ICMP</option>
        <option value="icmp.type == 0">Echo Reply (0)</option>
        <option value="icmp.type == 3">Destination Unreachable (3)</option>
        <option value="icmp.type == 5">Redirect (5)</option>
        <option value="icmp.type == 8">Echo Request / ping (8)</option>
        <option value="icmp.type == 11">Time Exceeded / TTL (11)</option>
      </select>
    </div>
  {:else if cat === 'frame'}
    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="ws-frame-field">Field</label>
        <select class="form-select" id="ws-frame-field" bind:value={f.frameField}>
          <option value="frame.len">Frame length (bytes)</option>
          <option value="frame.number">Frame number</option>
          <option value="ip.ttl">IP TTL</option>
          <option value="ip.frag_offset">IP frag offset</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="ws-frame-val">Value</label>
        <input
          class="form-input mono"
          id="ws-frame-val"
          placeholder="1500"
          spellcheck="false"
          autocomplete="off"
          bind:value={f.frameVal}
        />
      </div>
    </div>
  {:else}
    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="ws-custom-field">Field Name</label>
        <input
          class="form-input mono"
          id="ws-custom-field"
          placeholder="ip.ttl"
          spellcheck="false"
          autocomplete="off"
          bind:value={f.customField}
        />
      </div>
      <div class="form-group">
        <label class="form-label" for="ws-custom-val">Value</label>
        <input
          class="form-input mono"
          id="ws-custom-val"
          placeholder="64"
          spellcheck="false"
          autocomplete="off"
          bind:value={f.customVal}
        />
      </div>
    </div>
  {/if}

  <div class="form-row mt-2.5 items-end">
    <div class="form-group">
      <label class="form-label" for="ws-join">Join with</label>
      <select class="form-select w-[140px]" id="ws-join" bind:value={join}>
        <option value=" && ">AND (&amp;&amp;)</option>
        <option value=" || ">OR (||)</option>
      </select>
    </div>
    <div class="form-group">
      <div class="btn-group">
        <button class="btn btn-primary" type="button" onclick={() => add(false)}>
          + Add Condition
        </button>
        <button class="btn btn-secondary" type="button" onclick={() => add(true)}>
          Negate !(…)
        </button>
        <button
          class="btn btn-secondary"
          type="button"
          onclick={() => {
            conds = [];
            error = '';
          }}>Clear All</button
        >
      </div>
    </div>
  </div>
  {#if error}
    <div class="warn" role="alert">{error}</div>
  {/if}
</div>

<div class="panel">
  <h3><Icon icon={faPuzzlePiece} /> Built Filter</h3>
  <div id="ws-conditions" class="mb-2.5 flex min-h-9 flex-wrap gap-1.5" aria-live="polite">
    {#if conds.length === 0}
      <span class="text-[13px] text-text3">No conditions yet — add one above.</span>
    {:else}
      {#each conds as c, i (i)}
        <span
          class="inline-flex items-center gap-1.5 rounded-full bg-surface2 px-2.5 py-1 font-mono text-[12px]"
        >
          {#if i > 0}<em class="font-sans text-[11px] text-text3 not-italic">{c.join.trim()}</em
            >&nbsp;{/if}{c.expr}
          <button
            type="button"
            class="cursor-pointer border-0 bg-transparent p-0 text-[15px] leading-none text-text3"
            title="Remove"
            aria-label="Remove condition {i + 1}"
            onclick={() => conds.splice(i, 1)}>&times;</button
          >
        </span>
      {/each}
    {/if}
  </div>
  {#if conds.length}
    <CodeBlock code={filter} />
  {/if}
  <div class="tip mt-2.5">
    * <strong>Never use <code>!=</code> to exclude an IP or port</strong> — use
    <code>!(ip.addr == x.x.x.x)</code> instead. The Negate button does this automatically.
  </div>
</div>
