export interface OspfInput {
  pid: string;
  rid: string;
  /** Reference bandwidth in Mbps. */
  bw: string;
  /** One "network wildcard area" per line. */
  nets: string;
  /** Comma-separated interface names. */
  passive: string;
  defaultRoute: boolean;
}

export function ospfConfig({ pid, rid, bw, nets, passive, defaultRoute }: OspfInput): string {
  let cfg = `conf t\nrouter ospf ${pid}\n router-id ${rid}\n auto-cost reference-bandwidth ${bw}\n`;
  for (const n of nets
    .trim()
    .split('\n')
    .filter((l) => l.trim())) {
    const line = n
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/([\d.]+)\s+([\d.]+)\s+(\d+)/, '$1 $2 area $3');
    cfg += ` network ${line}\n`;
  }
  for (const p of passive
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)) {
    cfg += ` passive-interface ${p}\n`;
  }
  if (defaultRoute) cfg += ` default-information originate\n`;
  return cfg + '!\nend';
}
