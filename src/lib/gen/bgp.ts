export interface BgpInput {
  localAs: string;
  routerId: string;
  type: 'ebgp' | 'ibgp';
  neighborIp: string;
  remoteAs: string;
  desc: string;
  /** One "network mask" per line. */
  networks: string;
  updateSrc: string;
  localPref: string;
  logChanges: boolean;
  defaultOrig: boolean;
  rrClient: boolean;
  softReconfig: boolean;
}

export function bgpConfig(f: BgpInput): string {
  const localAs = f.localAs.trim();
  const routerId = f.routerId.trim();
  const ip = f.neighborIp.trim();
  const remoteAs = f.remoteAs.trim();
  const desc = f.desc.trim();
  const updateSrc = f.updateSrc.trim();
  const localPref = f.localPref.trim();
  const nets = f.networks
    .trim()
    .split('\n')
    .filter((l) => l.trim());
  const ibgp = f.type === 'ibgp';

  let cfg = `conf t\n!\nrouter bgp ${localAs}\n bgp router-id ${routerId}\n`;
  if (f.logChanges) cfg += ` bgp log-neighbor-changes\n`;
  cfg += `!\n ! Neighbor configuration\n neighbor ${ip} remote-as ${remoteAs}\n`;
  if (desc) cfg += ` neighbor ${ip} description ${desc}\n`;
  if (ibgp && updateSrc) cfg += ` neighbor ${ip} update-source ${updateSrc}\n`;
  if (f.softReconfig) cfg += ` neighbor ${ip} soft-reconfiguration inbound\n`;
  if (f.defaultOrig) cfg += ` neighbor ${ip} default-originate\n`;
  if (ibgp && f.rrClient) cfg += ` neighbor ${ip} route-reflector-client\n`;
  if (nets.length > 0) {
    cfg += `!\n ! Advertised networks\n`;
    for (const n of nets) {
      const parts = n.trim().split(/\s+/);
      cfg += ` network ${parts[0]}${parts[1] ? ' mask ' + parts[1] : ''}\n`;
    }
  }
  if (ibgp && localPref) {
    cfg += `!\n ! Set local preference via route-map\n route-map SET-LOCALPREF permit 10\n  set local-preference ${localPref}\n!\n neighbor ${ip} route-map SET-LOCALPREF in\n`;
  }
  return cfg + `!\nend\ncopy running-config startup-config`;
}
