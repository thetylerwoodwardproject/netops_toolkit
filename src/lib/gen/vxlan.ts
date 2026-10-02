export interface VxlanInput {
  host: string;
  /** VTEP loopback address. */
  lo: string;
  vni: string;
  vlan: string;
  /** Multicast group for BUM traffic; empty uses unicast peers. */
  mcast: string;
  intf: string;
  /** Underlay address and mask, e.g. "192.168.100.1 255.255.255.0". */
  ip: string;
  /** Comma-separated remote VTEP addresses. */
  peers: string;
  evpn: boolean;
}

export function vxlanConfig(f: VxlanInput): string {
  const { host, lo, vni, vlan, mcast, intf, ip, evpn } = {
    host: f.host.trim(),
    lo: f.lo.trim(),
    vni: f.vni.trim(),
    vlan: f.vlan.trim(),
    mcast: f.mcast.trim(),
    intf: f.intf.trim(),
    ip: f.ip.trim(),
    evpn: f.evpn,
  };
  const peers = f.peers
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  let cfg = `! VXLAN Configuration for ${host}
conf t
hostname ${host}

! Enable VXLAN features
feature nv overlay
feature vn-segment-vlan-based
${evpn ? 'feature bgp\nfeature fabric forwarding\nnv overlay evpn' : ''}

! Loopback interface for VTEP
interface Loopback0
 description VTEP Source Interface
 ip address ${lo}/32
 ip router ospf 1 area 0.0.0.0
 no shutdown

! Underlay interface
interface ${intf}
 description Underlay Interface
 no switchport
 ip address ${ip}
 ip router ospf 1 area 0.0.0.0
 no shutdown

! VLAN to VNI mapping
vlan ${vlan}
 vn-segment ${vni}

! NVE interface (VTEP)
interface nve1
 description VXLAN VTEP Interface
 no shutdown
 source-interface loopback0
 member vni ${vni}
${mcast ? `  mcast-group ${mcast}` : ''}
`;

  if (peers.length > 0 && !mcast) {
    for (const peer of peers) cfg += `  peer-ip ${peer}\n`;
  }

  if (evpn) {
    cfg += `
! EVPN configuration
router bgp 65001
 neighbor <SPINE-IP> remote-as 65001
 neighbor <SPINE-IP> update-source loopback0
 address-family l2vpn evpn
  send-community extended
  neighbor <SPINE-IP> activate

evpn
 vni ${vni} l2
  rd auto
  route-target both auto
`;
  }

  cfg += `
! Access port configuration example
interface Ethernet1/10
 description Access Port
 switchport access vlan ${vlan}
 no shutdown

! OSPF for underlay routing
router ospf 1
 router-id ${lo}

!
copy running-config startup-config
`;
  return cfg;
}
