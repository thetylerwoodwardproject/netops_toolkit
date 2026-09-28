import { formatIPv4, parseIPv4, prefixToMask } from './ipv4';

export interface VlsmRow {
  name: string;
  hosts: number;
  error?: string;
  prefix?: number;
  usable?: number;
  network?: string;
  mask?: string;
  first?: string;
  last?: string;
  broadcast?: string;
}

/**
 * Allocate subnets largest-first from a base network.
 * `requirements` is one "name,hosts" per line, as the original tool took it.
 */
export function planVlsm(networkText: string, requirements: string) {
  const [ipText = '', prefixText = ''] = networkText.trim().split('/');
  const ip = parseIPv4(ipText);
  const prefix = Number.parseInt(prefixText, 10);
  if (ip === null || Number.isNaN(prefix) || prefix < 0 || prefix > 32) {
    return { error: 'Invalid base network' } as const;
  }

  const reqs = requirements
    .trim()
    .split('\n')
    .map((line) => {
      const [name, hosts] = line.split(',');
      return { name: name?.trim() ?? '', hosts: Number.parseInt(hosts ?? '', 10) };
    })
    .filter((r) => r.name && !Number.isNaN(r.hosts))
    .sort((a, b) => b.hosts - a.hosts);

  // The original started from the address as typed, so 192.168.1.5/24 gave
  // subnets that were all misaligned by 5. Start from the network address.
  const base = (ip & prefixToMask(prefix)) >>> 0;
  const total = 2 ** (32 - prefix);
  let offset = 0;
  const rows: VlsmRow[] = [];
  for (const r of reqs) {
    let bits = 0;
    while (2 ** bits < r.hosts + 2) bits++;
    const size = 2 ** bits;
    if (offset + size > total) {
      rows.push({ ...r, error: 'Not enough space' });
      continue;
    }
    const net = (base + offset) >>> 0;
    rows.push({
      ...r,
      prefix: 32 - bits,
      usable: size - 2,
      network: formatIPv4(net),
      mask: formatIPv4(prefixToMask(32 - bits)),
      first: formatIPv4((net + 1) >>> 0),
      last: formatIPv4((net + size - 2) >>> 0),
      broadcast: formatIPv4((net + size - 1) >>> 0),
    });
    offset += size;
  }
  return { rows, used: offset, total };
}
