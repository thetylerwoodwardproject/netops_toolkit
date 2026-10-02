export type RouteType = 'standard' | 'default' | 'floating' | 'null' | 'ipv6' | 'summary';

export interface StaticRouteInput {
  type: RouteType;
  dest: string;
  mask: string;
  nexthop: string;
  intf: string;
  /** Administrative distance, used by floating routes. */
  ad: string;
  desc: string;
  /** Extra routes, one "network mask nexthop" per line. */
  bulk: string;
}

export function staticRouteConfig(f: StaticRouteInput): string {
  const dest = f.dest.trim();
  const mask = f.mask.trim();
  const nh = f.nexthop.trim();
  const intf = f.intf.trim();
  const ad = f.ad.trim();
  const desc = f.desc.trim();
  const bulk = f.bulk.trim();

  // An exit interface comes before the next hop: "ip route net mask Gi0/0 10.0.0.1".
  const via = intf && nh ? [intf, nh] : intf ? [intf] : nh ? [nh] : [];

  let cfg = 'conf t\n';
  if (desc) cfg += `! ${desc}\n`;

  if (f.type === 'ipv6') {
    cfg += `ipv6 unicast-routing\nipv6 route ${[dest, ...via].join(' ')}\n`;
  } else if (f.type === 'null') {
    cfg += `ip route ${dest} ${mask} Null0\n`;
  } else {
    const parts = [dest, mask, ...via];
    if (f.type === 'floating' && ad) parts.push(ad);
    cfg += `ip route ${parts.join(' ')}\n`;
  }

  if (bulk) {
    cfg += '!\n! Additional Routes\n';
    for (const line of bulk.split('\n')) {
      const p = line.trim().split(/\s+/);
      if (p.length >= 2)
        cfg += `${f.type === 'ipv6' ? 'ipv6 route ' : 'ip route '}${p.join(' ')}\n`;
    }
  }

  return cfg + '!\nend\ncopy running-config startup-config';
}
