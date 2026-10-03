export type WsCategory =
  | 'ip'
  | 'port'
  | 'proto'
  | 'tcp-flags'
  | 'mac'
  | 'vlan'
  | 'http'
  | 'dns'
  | 'sip'
  | 'icmp'
  | 'frame'
  | 'custom';

export interface WsFields {
  ipDir: string;
  ipVal: string;
  portProto: string;
  portVal: string;
  protoVal: string;
  flagVal: string;
  macDir: string;
  macVal: string;
  vlanVal: string;
  httpField: string;
  httpVal: string;
  dnsField: string;
  dnsVal: string;
  sipType: string;
  sipVal: string;
  icmpType: string;
  frameField: string;
  frameVal: string;
  customField: string;
  customVal: string;
}

/** Categories whose condition has no operator. */
export const NO_OPERATOR: WsCategory[] = ['proto', 'tcp-flags', 'icmp', 'sip'];

/** One display-filter condition, or the message to show when a required field is empty. */
export function wsExpression(
  cat: WsCategory,
  op: string,
  f: WsFields,
): { expr: string } | { error: string } {
  const need = (value: string, error: string) => (value.trim() ? null : { error });
  const t = (s: string) => s.trim();

  switch (cat) {
    case 'ip':
      return need(f.ipVal, 'Enter an IP / CIDR') ?? { expr: `${t(f.ipDir)} ${op} ${t(f.ipVal)}` };
    case 'port':
      return (
        need(f.portVal, 'Enter a port number') ?? {
          expr: `${t(f.portProto)} ${op} ${t(f.portVal)}`,
        }
      );
    case 'proto':
      return { expr: t(f.protoVal) };
    case 'tcp-flags':
      return { expr: t(f.flagVal) };
    case 'mac':
      return (
        need(f.macVal, 'Enter a MAC address') ?? { expr: `${t(f.macDir)} ${op} ${t(f.macVal)}` }
      );
    case 'vlan':
      return { expr: t(f.vlanVal) ? `vlan.id == ${t(f.vlanVal)}` : 'vlan' };
    case 'http': {
      const field = t(f.httpField);
      if (field === 'http.authorization') return { expr: 'http.authorization' };
      const v = t(f.httpVal);
      if (!v) return { error: 'Enter a value' };
      return {
        expr: ['http.request.method', 'http.request.uri', 'http.host'].includes(field)
          ? `${field} ${op} "${v}"`
          : `${field} ${op} ${v}`,
      };
    }
    case 'dns': {
      const field = t(f.dnsField);
      const v = t(f.dnsVal);
      if (!v) return { error: 'Enter a value' };
      return { expr: field !== 'dns.qry.type' ? `${field} ${op} "${v}"` : `${field} ${op} ${v}` };
    }
    case 'sip': {
      const type = t(f.sipType);
      if (type === 'sip' || type === 'rtp') return { expr: type };
      const v = t(f.sipVal);
      return v ? { expr: `${type} == "${v}"` } : { error: 'Enter a value' };
    }
    case 'icmp':
      return { expr: t(f.icmpType) };
    case 'frame':
      return (
        need(f.frameVal, 'Enter a value') ?? { expr: `${t(f.frameField)} ${op} ${t(f.frameVal)}` }
      );
    case 'custom': {
      const field = t(f.customField);
      if (!field) return { error: 'Enter a field name' };
      const v = t(f.customVal);
      return { expr: v ? `${field} ${op} ${v}` : field };
    }
  }
}

export interface WsCondition {
  expr: string;
  /** How this condition joins the one before it: " && " or " || ". */
  join: string;
}

export function wsFilter(conds: WsCondition[]): string {
  return conds.reduce((filter, c, i) => (i === 0 ? c.expr : filter + c.join + c.expr), '');
}
