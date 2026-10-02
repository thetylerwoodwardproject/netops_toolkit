export interface EtherchannelInput {
  proto: 'active' | 'passive' | 'desirable' | 'auto' | 'on';
  group: string;
  range: string;
  mode: 'trunk' | 'access';
  vlans: string;
}

export function etherchannelConfig({
  proto,
  group,
  range,
  mode,
  vlans,
}: EtherchannelInput): string {
  let cfg =
    `conf t\ninterface range ${range}\n channel-group ${group} mode ${proto}\n no shutdown\nexit\n!\n` +
    `interface port-channel ${group}\n switchport mode ${mode}\n`;
  if (mode === 'trunk') cfg += ` switchport trunk allowed vlan ${vlans}\n`;
  return cfg + ' no shutdown\n!\nend';
}
