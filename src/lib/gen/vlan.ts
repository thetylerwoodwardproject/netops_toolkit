export interface VlanInput {
  /** One "id,name" per line. */
  vlans: string;
  trunk: string;
  native: string;
}

export function vlanConfig({ vlans, trunk, native }: VlanInput): string {
  const list = vlans
    .trim()
    .split('\n')
    .map((line) => {
      const [id, name] = line.split(',');
      return { id: id?.trim() ?? '', name: name?.trim() };
    })
    .filter((v) => v.id);
  let cfg = 'conf t\n!\n! === VLAN Creation ===\n';
  for (const v of list) cfg += `vlan ${v.id}\n name ${v.name || 'VLAN' + v.id}\n!\n`;
  cfg +=
    `! === Trunk Configuration ===\ninterface ${trunk.trim()}\n description Trunk Port\n` +
    ` switchport trunk encapsulation dot1q\n switchport mode trunk\n` +
    ` switchport trunk native vlan ${native.trim()}\n` +
    ` switchport trunk allowed vlan ${list.map((v) => v.id).join(',')}\n` +
    ` switchport nonegotiate\n no shutdown\n!\nend\ncopy running-config startup-config`;
  return cfg;
}
