export interface NatInput {
  type: 'pat' | 'static' | 'dynamic';
  inside: string;
  outside: string;
  /** Inside network with wildcard mask (PAT and dynamic). */
  net: string;
  local: string;
  global: string;
  poolStart: string;
  poolEnd: string;
}

export function natConfig(f: NatInput): string {
  let cfg = 'conf t\n';
  const ends = `!\ninterface ${f.inside}\n ip nat inside\ninterface ${f.outside}\n ip nat outside\n`;
  if (f.type === 'pat') {
    cfg += `access-list 1 permit ${f.net}\nip nat inside source list 1 interface ${f.outside} overload\n${ends}`;
  } else if (f.type === 'static') {
    cfg += `ip nat inside source static ${f.local} ${f.global}\n${ends}`;
  } else {
    cfg +=
      `access-list 1 permit ${f.net}\nip nat pool NATPOOL ${f.poolStart} ${f.poolEnd} netmask 255.255.255.0\n` +
      `ip nat inside source list 1 pool NATPOOL\n${ends}`;
  }
  return cfg + '!\nend';
}
