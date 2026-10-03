export interface EigrpInput {
  mode: 'classic' | 'named';
  asNum: string;
  /** Process name, named mode only. */
  name: string;
  activeIntf: string;
  /** One "network wildcard" per line. */
  networks: string;
  /** Comma-separated interface names. */
  passive: string;
  hello: string;
  hold: string;
  noAutoSummary: boolean;
  variance: boolean;
  varianceVal: string;
  stub: boolean;
}

export function eigrpConfig(f: EigrpInput): string {
  const asNum = f.asNum.trim();
  const name = f.name.trim();
  const active = f.activeIntf.trim();
  const hello = f.hello.trim();
  const hold = f.hold.trim();
  const varianceVal = f.varianceVal.trim();
  const nets = f.networks
    .trim()
    .split('\n')
    .filter((l) => l.trim());
  const passive = f.passive
    .trim()
    .split(',')
    .map((s) => s.trim())
    .filter((p) => p && p !== active);
  const classic = f.mode === 'classic';

  let cfg = 'conf t\n!\n';

  if (classic) {
    cfg += `router eigrp ${asNum}\n`;
    for (const n of nets) cfg += ` network ${n.trim()}\n`;
    cfg += ` passive-interface default\n`;
    cfg += ` no passive-interface ${active}\n`;
    for (const p of passive) cfg += ` passive-interface ${p}\n`;
    if (f.noAutoSummary) cfg += ` no auto-summary\n`;
    if (f.variance) cfg += ` variance ${varianceVal}\n`;
    if (f.stub) cfg += ` eigrp stub connected summary\n`;
    cfg += `!\n`;
  } else {
    cfg += `router eigrp ${name}\n`;
    cfg += ` address-family ipv4 unicast autonomous-system ${asNum}\n`;
    cfg += `  !\n  af-interface default\n   passive-interface\n  exit-af-interface\n`;
    cfg += `  !\n  af-interface ${active}\n   no passive-interface\n`;
    if (hello) cfg += `   hello-interval ${hello}\n`;
    if (hold) cfg += `   hold-time ${hold}\n`;
    cfg += `  exit-af-interface\n`;
    for (const p of passive) {
      cfg += `  !\n  af-interface ${p}\n   passive-interface\n  exit-af-interface\n`;
    }
    cfg += `  !\n  topology base\n`;
    if (f.variance) cfg += `   variance ${varianceVal}\n`;
    cfg += `  exit-af-topology\n`;
    for (const n of nets) cfg += `  network ${n.trim()}\n`;
    if (f.stub) cfg += `  eigrp stub connected summary\n`;
    cfg += ` exit-address-family\n!\n`;
  }

  // Interface timers for classic mode
  if (classic && (hello || hold)) {
    cfg += `! Apply hello/hold timers on active interface\ninterface ${active}\n`;
    if (hello) cfg += ` ip hello-interval eigrp ${asNum} ${hello}\n`;
    if (hold) cfg += ` ip hold-time eigrp ${asNum} ${hold}\n`;
    cfg += `!\n`;
  }

  return cfg + `end\ncopy running-config startup-config`;
}
