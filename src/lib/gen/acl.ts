export interface AclInput {
  type: 'standard' | 'extended';
  name: string;
  /** One "action,source[,dest,protocol,port]" per line. */
  rules: string;
  intf: string;
  dir: 'in' | 'out';
}

export function aclConfig({ type, name, rules, intf, dir }: AclInput): string {
  const acl = name.trim();
  let cfg = `conf t\nip access-list ${type} ${acl}\n`;
  for (const rule of rules.trim().split('\n')) {
    const p = rule.split(',').map((s) => s.trim());
    if (type === 'extended' && p.length >= 4) {
      cfg += ` ${p[0]} ${p[3]} ${p[1]} ${p[2]}${p[4] ? ' eq ' + p[4] : ''}\n`;
    } else {
      cfg += ` ${p[0]} ${p[1] || 'any'}\n`;
    }
  }
  cfg += `exit\ninterface ${intf.trim()}\n ip access-group ${acl} ${dir}\nend`;
  return cfg;
}
