<script lang="ts">
  import { faBullseye } from '@fortawesome/free-solid-svg-icons/faBullseye';
  import { faClock } from '@fortawesome/free-solid-svg-icons/faClock';
  import { faFolder } from '@fortawesome/free-solid-svg-icons/faFolder';
  import { faGear } from '@fortawesome/free-solid-svg-icons/faGear';
  import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons/faMagnifyingGlass';
  import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons/faTriangleExclamation';
  import { faUpload } from '@fortawesome/free-solid-svg-icons/faUpload';
  import CodeBlock from '@/components/CodeBlock.svelte';
  import Icon from '@/components/Icon.svelte';
  import TextField from '@/components/TextField.svelte';
  import { nmapCommand, type NmapInput } from '@/lib/gen/nmap';

  const f: NmapInput = $state({
    target: '192.168.1.0/24',
    scanType: '-sS',
    zombie: '',
    timing: '-T3',
    hostgroup: '',
    portPreset: 'top1000',
    customPorts: '',
    outputFmt: '',
    outputFile: 'scan_results',
    script: '',
    customScript: '',
    sv: false,
    os: false,
    sc: false,
    aggressive: false,
    v: false,
    vv: false,
    open: false,
    reason: false,
    pn: false,
    n: false,
    pe: false,
    traceroute: false,
  });

  // " " keeps the gap after a flag from collapsing, as the old &nbsp; did.
  const sp = '   ';
  const scanTypes: [string, string][] = [
    ['-sS', `-sS${sp}SYN Stealth (default, needs root)`],
    ['-sT', `-sT${sp}TCP Connect (no root needed)`],
    ['-sU', `-sU${sp}UDP Scan`],
    ['-sS -sU', `-sS -sU${sp}SYN + UDP`],
    ['-sn', `-sn${sp}Ping Scan (host discovery only)`],
    ['-sA', `-sA${sp}ACK Scan (firewall mapping)`],
    ['-sW', `-sW${sp}Window Scan`],
    ['-sN', `-sN${sp}TCP Null Scan`],
    ['-sF', `-sF${sp}FIN Scan`],
    ['-sX', `-sX${sp}Xmas Scan`],
    ['-sI zombie', `-sI${sp}Idle/Zombie Scan`],
  ];
  const timings: [string, string][] = [
    ['-T0', `-T0${sp}Paranoid (IDS evasion, very slow)`],
    ['-T1', `-T1${sp}Sneaky (IDS evasion, slow)`],
    ['-T2', `-T2${sp}Polite (lower bandwidth impact)`],
    ['-T3', `-T3${sp}Normal (default)`],
    ['-T4', `-T4${sp}Aggressive (fast, reliable network)`],
    ['-T5', `-T5${sp}Insane (fastest, may miss ports)`],
  ];
  const outputs: [string, string][] = [
    ['', 'None (terminal only)'],
    ['-oN', `-oN${sp}Normal text`],
    ['-oX', `-oX${sp}XML`],
    ['-oG', `-oG${sp}Grepable`],
    ['-oA', `-oA${sp}All three formats`],
  ];
  const scripts: [string, string][] = [
    ['', 'None'],
    ['--script=default', 'default (same as -sC)'],
    ['--script=vuln', 'vuln — Check for vulnerabilities'],
    ['--script=safe', 'safe — Non-intrusive safe scripts'],
    ['--script=auth', 'auth — Authentication bypass tests'],
    ['--script=discovery', 'discovery — Network discovery'],
    ['--script=intrusive', 'intrusive — Potentially disruptive scans'],
    ['--script=malware', 'malware — Malware/backdoor detection'],
    ['--script=banner', 'banner — Grab service banners'],
    ['--script=http-headers', 'http-headers — Get HTTP headers'],
    ['--script=ssl-cert', 'ssl-cert — Retrieve SSL certificates'],
    ['--script=smb-vuln*', 'smb-vuln* — SMB vulnerability checks'],
    ['--script=ftp-anon', 'ftp-anon — Check for anonymous FTP'],
    ['--script=dns-brute', 'dns-brute — DNS subdomain brute force'],
    ['--script=http-title', 'http-title — Get HTTP page titles'],
    ['--script=snmp-info', 'snmp-info — SNMP information gathering'],
    ['custom', 'Custom...'],
  ];
  const options: [keyof NmapInput, string, string][] = [
    ['sv', '-sV', 'Service version detection'],
    ['os', '-O', 'OS detection (root)'],
    ['sc', '-sC', 'Default NSE scripts'],
    ['aggressive', '-A', 'Aggressive (OS+Ver+Script+Trace)'],
    ['v', '-v', 'Verbose output'],
    ['vv', '-vv', 'Very verbose'],
    ['open', '--open', 'Show only open ports'],
    ['reason', '--reason', 'Show port state reason'],
    ['pn', '-Pn', 'Skip host discovery (treat as up)'],
    ['n', '-n', 'No DNS resolution'],
    ['pe', '-PE', 'ICMP echo host discovery'],
    ['traceroute', '--traceroute', 'Trace packet path'],
  ];

  const result = $derived(nmapCommand(f));
</script>

<div class="panel">
  <h3><Icon icon={faBullseye} /> Target</h3>
  <TextField
    label="Target (IP, hostname, range, or CIDR)"
    id="nmap-target"
    placeholder="192.168.1.1, 10.0.0.0/24, host.domain.com"
    bind:value={f.target}
  />
</div>
<div class="form-row">
  <div class="panel">
    <h3><Icon icon={faMagnifyingGlass} /> Scan Type</h3>
    <div class="form-group">
      <label class="form-label" for="nmap-scan-type">Primary Scan</label>
      <select class="form-select" id="nmap-scan-type" bind:value={f.scanType}>
        {#each scanTypes as [value, label] (value)}<option {value}>{label}</option>{/each}
      </select>
    </div>
    {#if f.scanType === '-sI zombie'}
      <TextField
        label="Zombie Host IP"
        id="nmap-zombie"
        placeholder="192.168.1.50"
        bind:value={f.zombie}
      />
    {/if}
  </div>
  <div class="panel">
    <h3><Icon icon={faClock} /> Timing &amp; Aggression</h3>
    <div class="form-group">
      <label class="form-label" for="nmap-timing">Timing Template</label>
      <select class="form-select" id="nmap-timing" bind:value={f.timing}>
        {#each timings as [value, label] (value)}<option {value}>{label}</option>{/each}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label" for="nmap-hostgroup">Parallel Hosts (--min-hostgroup)</label>
      <select class="form-select" id="nmap-hostgroup" bind:value={f.hostgroup}>
        <option value="">Default</option>
        {#each [16, 32, 64, 128] as n (n)}
          <option value="--min-hostgroup {n}">{n} hosts</option>
        {/each}
      </select>
    </div>
  </div>
</div>
<div class="form-row">
  <div class="panel">
    <h3><Icon icon={faFolder} /> Port Selection</h3>
    <div class="form-group">
      <label class="form-label" for="nmap-port-preset">Port Range</label>
      <select class="form-select" id="nmap-port-preset" bind:value={f.portPreset}>
        <option value="top100">Top 100 Ports (--top-ports 100)</option>
        <option value="top1000">Top 1000 Ports (default)</option>
        <option value="common">Common Network Ports (22,23,25,53,80,443,3389...)</option>
        <option value="allports">All 65535 Ports (-p-)</option>
        <option value="custom">Custom</option>
      </select>
    </div>
    {#if f.portPreset === 'custom'}
      <TextField
        label="Custom Ports (e.g. 22,80,443 or 1-1024)"
        id="nmap-ports-custom"
        placeholder="22,80,443,3389 or 1-1024"
        bind:value={f.customPorts}
      />
    {/if}
  </div>
  <div class="panel">
    <h3><Icon icon={faUpload} /> Output</h3>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="nmap-output-fmt">Output Format</label>
        <select class="form-select" id="nmap-output-fmt" bind:value={f.outputFmt}>
          {#each outputs as [value, label] (value)}<option {value}>{label}</option>{/each}
        </select>
      </div>
      <TextField
        label="Output Filename"
        id="nmap-output-file"
        placeholder="scan_results"
        bind:value={f.outputFile}
      />
    </div>
  </div>
</div>
<div class="panel">
  <h3><Icon icon={faGear} /> Detection &amp; Script Options</h3>
  <div class="mb-2 grid grid-cols-1 gap-x-4 gap-y-2 xs:grid-cols-2 md:grid-cols-3">
    {#each options as [key, flag, desc] (key)}
      <label class="flex items-center gap-1.5 text-[12px] text-text2">
        <input
          type="checkbox"
          id="nmap-{key === 'traceroute' ? 'traceroute' : key}"
          class="accent-accent"
          bind:checked={f[key] as boolean}
        />
        {flag}&nbsp; {desc}
      </label>
    {/each}
  </div>
  <div class="form-group mt-2.5">
    <label class="form-label" for="nmap-script">NSE Script (--script)</label>
    <select class="form-select" id="nmap-script" bind:value={f.script}>
      {#each scripts as [value, label] (value)}<option {value}>{label}</option>{/each}
    </select>
  </div>
  {#if f.script === 'custom'}
    <TextField
      label="Custom Script Name or Path"
      id="nmap-script-custom"
      placeholder="--script=my-script or /path/to/script.nse"
      bind:value={f.customScript}
    />
  {/if}
</div>

<div aria-live="polite">
  {#if result}
    <CodeBlock code={result.cmd} comment={result.needsRoot ? '# ⚠️ Requires root/sudo' : ''} />
    {#if result.notes.length}
      <div class="tip">
        <strong>Notes</strong>
        <ul class="mt-1 ml-5 list-disc">
          {#each result.notes as note (note)}
            <li>
              {#if note.startsWith('This script category')}<Icon
                  icon={faTriangleExclamation}
                  class="mr-1 inline text-orange"
                />{/if}{note}
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  {:else}
    <div class="warn">Enter a target IP, hostname, or CIDR.</div>
  {/if}
</div>
