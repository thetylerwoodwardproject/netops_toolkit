export type DmvpnRole = 'hub' | 'spoke';
export type RoutingProto = 'eigrp' | 'ospf' | 'bgp' | 'none';

export interface DmvpnInput {
  host: string;
  /** Tunnel interface number. */
  tnum: string;
  /** This router's tunnel address and mask. */
  tip: string;
  /** Hub: its own public (NBMA) address. Spoke: the hub's. */
  nbma: string;
  /** Spoke only: the hub's tunnel address. */
  hubTip: string;
  src: string;
  nid: string;
  nauth: string;
  phase: '1' | '2' | '3';
  routing: RoutingProto;
  rasn: string;
  psk: string;
  enc: string;
}

const ENCRYPTION: Record<string, { enc: string; integ: string; grp: string }> = {
  'aes256-sha256': { enc: 'aes 256', integ: 'sha256', grp: 'group14' },
  'aes128-sha256': { enc: 'aes 128', integ: 'sha256', grp: 'group14' },
  'aes256-sha512': { enc: 'aes 256', integ: 'sha512', grp: 'group14' },
};

function routingHub(proto: RoutingProto, asn: string, tnum: string, phase: string): string {
  if (proto === 'eigrp') {
    let cfg = `!\nrouter eigrp ${asn}\n network 10.0.0.0 0.0.255.255\n no auto-summary\n`;
    if (phase === '2') {
      cfg += `! Phase 2: disable split-horizon on hub tunnel\ninterface Tunnel${tnum}\n no ip split-horizon eigrp ${asn}\n no ip next-hop-self eigrp ${asn}\n`;
    }
    return cfg;
  }
  if (proto === 'ospf') {
    return `!\nrouter ospf ${asn}\n router-id 0.0.0.1\n network 10.0.0.0 0.0.255.255 area 0\ninterface Tunnel${tnum}\n ip ospf network point-to-multipoint\n ip ospf hello-interval 10\n ip ospf dead-interval 40\n`;
  }
  if (proto === 'bgp') {
    return `!\n! BGP: add spoke neighbors manually or use dynamic neighbor\nrouter bgp ${asn}\n bgp log-neighbor-changes\n ! neighbor <spoke-tunnel-ip> remote-as ${asn}\n`;
  }
  return '';
}

function routingSpoke(proto: RoutingProto, asn: string, hubTip: string, tnum: string): string {
  if (proto === 'eigrp') {
    return `!\nrouter eigrp ${asn}\n network 10.0.0.0 0.0.255.255\n no auto-summary\n`;
  }
  if (proto === 'ospf') {
    return `!\nrouter ospf ${asn}\n router-id 0.0.0.2\n network 10.0.0.0 0.0.255.255 area 0\ninterface Tunnel${tnum}\n ip ospf network point-to-multipoint\n ip ospf hello-interval 10\n ip ospf dead-interval 40\n`;
  }
  if (proto === 'bgp') {
    return `!\nrouter bgp ${asn}\n bgp log-neighbor-changes\n neighbor ${hubTip} remote-as ${asn}\n`;
  }
  return '';
}

export function dmvpnConfig(role: DmvpnRole, ipsec: boolean, f: DmvpnInput): string {
  const t = (s: string) => s.trim();
  const host = t(f.host);
  const tnum = t(f.tnum);
  const nbma = t(f.nbma);
  const hubTip = t(f.hubTip);
  const nid = t(f.nid);
  const rasn = t(f.rasn);
  const psk = t(f.psk);
  const ep = ENCRYPTION[f.enc] ?? ENCRYPTION['aes256-sha256'];
  const hub = role === 'hub';

  let cfg = `conf t\nhostname ${host}\n!\n`;
  if (ipsec) {
    cfg += '! -- IKEv2 Proposal -------------------------------------------\n';
    cfg += `crypto ikev2 proposal DMVPN-PROP\n encryption ${ep.enc}\n integrity ${ep.integ}\n ${ep.grp}\n!\n`;
    cfg += 'crypto ikev2 policy DMVPN-POL\n proposal DMVPN-PROP\n!\n';
    cfg += hub
      ? `crypto ikev2 keyring DMVPN-KEYS\n peer ANY\n  address 0.0.0.0 0.0.0.0\n  pre-shared-key ${psk}\n!\n`
      : `crypto ikev2 keyring DMVPN-KEYS\n peer HUB\n  address ${nbma}\n  pre-shared-key ${psk}\n!\n`;
    cfg += hub
      ? 'crypto ikev2 profile DMVPN-IKEV2\n match identity remote address 0.0.0.0\n authentication remote pre-share\n authentication local pre-share\n keyring local DMVPN-KEYS\n!\n'
      : `crypto ikev2 profile DMVPN-IKEV2\n match identity remote address ${nbma} 255.255.255.255\n authentication remote pre-share\n authentication local pre-share\n keyring local DMVPN-KEYS\n!\n`;
    cfg += '! -- IPsec Transform-Set & Profile ----------------------------\n';
    cfg += `crypto ipsec transform-set DMVPN-TS esp-${ep.enc.replace(' ', '-')} esp-${ep.integ}-hmac\n mode transport\n!\n`;
    cfg +=
      'crypto ipsec profile DMVPN-IPSEC\n set transform-set DMVPN-TS\n set ikev2-profile DMVPN-IKEV2\n!\n';
  }
  cfg += '! -- Tunnel Interface -----------------------------------------\n';
  cfg += `interface Tunnel${tnum}\n`;
  cfg += ` description DMVPN ${hub ? 'Hub' : 'Spoke'} Tunnel Phase ${f.phase}${ipsec ? ' + IPsec' : ' (No Encryption)'}\n`;
  cfg += ` ip address ${t(f.tip)}\n`;
  cfg += ` no ip redirects\n ip nhrp authentication ${t(f.nauth)}\n`;
  cfg += ` ip nhrp network-id ${nid}\n`;
  if (hub) {
    cfg += ' ip nhrp map multicast dynamic\n';
    if (f.phase === '3') cfg += ' ip nhrp redirect\n';
  } else {
    cfg += ` ip nhrp nhs ${hubTip} nbma ${nbma} multicast\n`;
    if (f.phase === '2' || f.phase === '3') cfg += ' ip nhrp shortcut\n';
  }
  cfg += ` tunnel source ${t(f.src)}\n`;
  cfg += ' tunnel mode gre multipoint\n';
  cfg += ` tunnel key ${nid}\n`;
  if (ipsec) cfg += ' tunnel protection ipsec profile DMVPN-IPSEC\n';
  cfg += '!\n';
  cfg += hub
    ? routingHub(f.routing, rasn, tnum, f.phase)
    : routingSpoke(f.routing, rasn, hubTip, tnum);
  cfg += '!\nend\n! copy running-config startup-config';
  return cfg;
}
