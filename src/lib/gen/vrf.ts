export interface VrfInput {
  name: string;
  rd: string;
  rtExport: string;
  rtImport: string;
  sviIf: string;
  sviIp: string;
  wanIf: string;
  defaultNextHop: string;
  routing: 'eigrp' | 'ospf' | 'bgp' | 'none';
  asn: string;
}

function routingFragment(proto: VrfInput['routing'], asn: string, vrf: string, wanIf: string) {
  if (proto === 'eigrp')
    return `!\nrouter eigrp ${asn}\n address-family ipv4 vrf ${vrf}\n  autonomous-system ${asn}\n  network 0.0.0.0\n  af-interface ${wanIf}\n   no shutdown\n  exit-af-interface\n exit-address-family\n`;
  if (proto === 'ospf')
    return `!\nrouter ospf ${asn} vrf ${vrf}\n router-id 0.0.0.2\n passive-interface default\n no passive-interface ${wanIf}\n network 0.0.0.0 255.255.255.255 area 0\n`;
  if (proto === 'bgp')
    return `!\nrouter bgp ${asn}\n address-family ipv4 vrf ${vrf}\n  ! add neighbor statements here\n exit-address-family\n`;
  return '';
}

export function vrfConfig(input: VrfInput): string {
  const t = (s: string) => s.trim();
  const name = t(input.name);
  const [rtExp, rtImp, sviIf, wanIf, defNh] = [
    t(input.rtExport),
    t(input.rtImport),
    t(input.sviIf),
    t(input.wanIf),
    t(input.defaultNextHop),
  ];
  let cfg = 'conf t\n';
  cfg += `!\nvrf definition ${name}\n rd ${t(input.rd)}\n`;
  if (rtExp) cfg += ` route-target export ${rtExp}\n`;
  if (rtImp) cfg += ` route-target import ${rtImp}\n`;
  cfg += ' address-family ipv4\n exit-address-family\n exit\n';
  if (sviIf) {
    cfg += `!\ninterface ${sviIf}\n description Users SVI in VRF ${name}\n vrf forwarding ${name}\n ip address ${t(input.sviIp)}\n no shutdown\n`;
  }
  if (wanIf) {
    cfg += `!\ninterface ${wanIf}\n description DMVPN Tunnel in VRF ${name}\n vrf forwarding ${name}\n ! Re-apply tunnel IP after vrf forwarding\n no shutdown\n`;
  }
  if (defNh) cfg += `!\nip route vrf ${name} 0.0.0.0 0.0.0.0 ${defNh}\n`;
  cfg += routingFragment(input.routing, t(input.asn), name, wanIf);
  cfg += '!\nend\n! copy running-config startup-config';
  return cfg;
}
