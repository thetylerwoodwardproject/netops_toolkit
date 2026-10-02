export interface DhcpInput {
  /** One "name,network,mask,gateway,dns" per line. */
  pools: string;
  /** Last host number to exclude, counting from .1. */
  exclude: string;
  lease: string;
}

export function dhcpConfig({ pools, exclude, lease }: DhcpInput): string {
  const list = pools
    .trim()
    .split('\n')
    .map((line) => {
      const [name, net, mask, gw, dns] = line.split(',').map((s) => s.trim());
      return { name, net, mask, gw, dns };
    })
    .filter((p) => p.name && p.net);
  let cfg = 'conf t\n';
  for (const p of list) {
    const base = p.net.split('.').slice(0, 3).join('.');
    cfg +=
      `!\nip dhcp excluded-address ${base}.1 ${base}.${parseInt(exclude)}\nip dhcp pool ${p.name}\n` +
      ` network ${p.net} ${p.mask}\n default-router ${p.gw}\n dns-server ${p.dns}\n lease ${lease}\n`;
  }
  cfg += '!\nend\ncopy running-config startup-config';
  return cfg;
}
