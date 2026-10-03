<script lang="ts">
  import SelectField from '@/components/SelectField.svelte';
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
    <SelectField
      label="Category"
      id="ws-cat"
      bind:value={cat}
      options={[
        { value: 'ip', label: 'IP Address' },
        { value: 'port', label: 'TCP/UDP Port' },
        { value: 'proto', label: 'Protocol' },
        { value: 'tcp-flags', label: 'TCP Flags' },
        { value: 'mac', label: 'MAC / Ethernet' },
        { value: 'vlan', label: 'VLAN' },
        { value: 'http', label: 'HTTP' },
        { value: 'dns', label: 'DNS' },
        { value: 'sip', label: 'SIP / RTP' },
        { value: 'icmp', label: 'ICMP' },
        { value: 'frame', label: 'Frame / Size' },
        { value: 'custom', label: 'Custom Field' },
      ]}
    />
    {#if !NO_OPERATOR.includes(cat)}
      <SelectField
        label="Operator"
        id="ws-op"
        bind:value={op}
        options={[
          { value: '==', label: '== (equals)' },
          { value: '!=', label: '!= (not equal)*' },
          { value: '>', label: '> (greater than)' },
          { value: '<', label: '< (less than)' },
          { value: 'contains', label: 'contains' },
          { value: 'matches', label: 'matches (regex)' },
        ]}
      />
    {/if}
  </div>

  {#if cat === 'ip'}
    <div class="form-row">
      <SelectField
        label="Direction"
        id="ws-ip-dir"
        bind:value={f.ipDir}
        options={[
          { value: 'ip.addr', label: 'Either (ip.addr)' },
          { value: 'ip.src', label: 'Source (ip.src)' },
          { value: 'ip.dst', label: 'Destination (ip.dst)' },
          { value: 'ipv6.addr', label: 'IPv6 Either' },
          { value: 'ipv6.src', label: 'IPv6 Src' },
          { value: 'ipv6.dst', label: 'IPv6 Dst' },
        ]}
      />
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
      <SelectField
        label="Protocol"
        id="ws-port-proto"
        bind:value={f.portProto}
        options={[
          { value: 'tcp.port', label: 'TCP (either)' },
          { value: 'tcp.srcport', label: 'TCP Source' },
          { value: 'tcp.dstport', label: 'TCP Dest' },
          { value: 'udp.port', label: 'UDP (either)' },
          { value: 'udp.srcport', label: 'UDP Source' },
          { value: 'udp.dstport', label: 'UDP Dest' },
        ]}
      />
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
    <SelectField
      label="Protocol"
      id="ws-proto-val"
      bind:value={f.protoVal}
      options={protocols.map((p) => ({ value: p, label: p }))}
    />
  {:else if cat === 'tcp-flags'}
    <SelectField
      label="Flag / Condition"
      id="ws-flag-val"
      bind:value={f.flagVal}
      options={[
        { value: 'tcp.flags.syn == 1', label: 'SYN set' },
        { value: 'tcp.flags.ack == 1', label: 'ACK set' },
        { value: 'tcp.flags.fin == 1', label: 'FIN set' },
        { value: 'tcp.flags.reset == 1', label: 'RST set' },
        { value: 'tcp.flags.push == 1', label: 'PSH set' },
        { value: 'tcp.flags.urg == 1', label: 'URG set' },
        { value: 'tcp.flags.syn == 1 && tcp.flags.ack == 0', label: 'SYN only (new connection)' },
        { value: 'tcp.flags.syn == 1 && tcp.flags.ack == 1', label: 'SYN-ACK' },
        { value: 'tcp.window_size == 0 && tcp.flags.reset != 1', label: 'Zero-window' },
      ]}
    />
  {:else if cat === 'mac'}
    <div class="form-row">
      <SelectField
        label="Direction"
        id="ws-mac-dir"
        bind:value={f.macDir}
        options={[
          { value: 'eth.addr', label: 'Either' },
          { value: 'eth.src', label: 'Source' },
          { value: 'eth.dst', label: 'Destination' },
        ]}
      />
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
      <SelectField
        label="Field"
        id="ws-http-field"
        bind:value={f.httpField}
        options={[
          { value: 'http.request.method', label: 'Method (GET, POST…)' },
          { value: 'http.response.code', label: 'Response Code' },
          { value: 'http.request.uri', label: 'URI path' },
          { value: 'http.host', label: 'Host header' },
          { value: 'http.authorization', label: 'Authorization (any)' },
        ]}
      />
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
      <SelectField
        label="Field"
        id="ws-dns-field"
        bind:value={f.dnsField}
        options={[
          { value: 'dns.qry.name', label: 'Query name' },
          { value: 'dns.resp.name', label: 'Response name' },
          { value: 'dns.qry.type', label: 'Query type (A=1, AAAA=28)' },
        ]}
      />
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
      <SelectField
        label="Filter"
        id="ws-sip-type"
        bind:value={f.sipType}
        options={[
          { value: 'sip', label: 'All SIP' },
          { value: 'rtp', label: 'All RTP' },
          { value: 'sip.Method', label: 'SIP Method' },
          { value: 'sip.Status-Code', label: 'SIP Status Code' },
        ]}
      />
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
    <SelectField
      label="Type"
      id="ws-icmp-type"
      bind:value={f.icmpType}
      options={[
        { value: 'icmp', label: 'All ICMP' },
        { value: 'icmp.type == 0', label: 'Echo Reply (0)' },
        { value: 'icmp.type == 3', label: 'Destination Unreachable (3)' },
        { value: 'icmp.type == 5', label: 'Redirect (5)' },
        { value: 'icmp.type == 8', label: 'Echo Request / ping (8)' },
        { value: 'icmp.type == 11', label: 'Time Exceeded / TTL (11)' },
      ]}
    />
  {:else if cat === 'frame'}
    <div class="form-row">
      <SelectField
        label="Field"
        id="ws-frame-field"
        bind:value={f.frameField}
        options={[
          { value: 'frame.len', label: 'Frame length (bytes)' },
          { value: 'frame.number', label: 'Frame number' },
          { value: 'ip.ttl', label: 'IP TTL' },
          { value: 'ip.frag_offset', label: 'IP frag offset' },
        ]}
      />
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
    <SelectField
      label="Join with"
      id="ws-join"
      triggerClass="w-[140px]"
      bind:value={join}
      options={[
        { value: ' && ', label: 'AND (&&)' },
        { value: ' || ', label: 'OR (||)' },
      ]}
    />
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
