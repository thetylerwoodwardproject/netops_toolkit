export interface NetplanInput {
  interface: string;
  renderer: 'networkd' | 'NetworkManager';
  mode: 'dhcp' | 'static';
  address: string;
  gateway: string;
  /** Comma-separated. */
  nameservers: string;
}

export function netplanYaml(f: NetplanInput): string {
  const iface = f.interface.trim() || 'eth0';
  const address = f.address.trim();
  const gateway = f.gateway.trim();
  const names = f.nameservers
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const lines = ['network:', '  version: 2'];
  if (f.renderer) lines.push('  renderer: ' + f.renderer);
  lines.push('  ethernets:', '    ' + iface + ':');
  if (f.mode === 'dhcp') {
    lines.push('      dhcp4: true');
  } else {
    lines.push('      dhcp4: false');
    if (address) lines.push('      addresses: [' + address + ']');
    if (gateway) lines.push('      gateway4: ' + gateway);
    if (names.length) {
      lines.push('      nameservers:', '        addresses: [' + names.join(', ') + ']');
    }
  }
  return lines.join('\n') + '\n';
}
