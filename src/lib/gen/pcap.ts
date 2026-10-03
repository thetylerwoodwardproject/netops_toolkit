export interface PcapInput {
  name: string;
  intf: string;
  dir: 'both' | 'in' | 'out';
  /** Buffer size in MB. */
  buf: string;
  match: 'any' | 'ipv4' | 'acl';
  /** Protocol of the capture ACL. */
  proto: 'ip' | 'tcp' | 'udp' | 'icmp';
  src: string;
  dst: string;
  port: string;
  exportMethod: 'flash' | 'tftp' | 'ftp' | 'none';
  server: string;
}

export function pcapConfig(f: PcapInput): string {
  const name = f.name.trim() || 'CAP1';
  const intf = f.intf.trim() || 'GigabitEthernet0/0';
  const buf = f.buf || '10';
  const src = f.src.trim();
  const dst = f.dst.trim();
  const port = f.port.trim();
  const server = f.server.trim() || '<server-ip>';
  const file = name.toLowerCase();

  let cfg = 'conf t\n';

  if (f.match === 'acl') {
    const srcStr = src || 'any';
    const dstStr = dst || 'any';
    cfg += `!\n! Capture filter ACL\nip access-list extended ${name}-ACL\n`;
    if (port && (f.proto === 'tcp' || f.proto === 'udp')) {
      cfg += ` permit ${f.proto} ${srcStr} ${dstStr} eq ${port}\n`;
    } else {
      cfg += ` permit ${f.proto} ${srcStr} ${dstStr}\n`;
    }
    cfg += '!\n';
  }

  cfg += `!\n! === PACKET CAPTURE: ${name} ===\n!\n`;
  cfg += '! 1. Define capture on interface\n';
  cfg += `monitor capture ${name} interface ${intf} ${f.dir}\n`;

  if (f.match === 'any') {
    cfg += `monitor capture ${name} match any\n`;
  } else if (f.match === 'ipv4') {
    cfg += `monitor capture ${name} match ipv4 any any\n`;
  } else if (f.match === 'acl') {
    cfg += `monitor capture ${name} match ipv4 access-list ${name}-ACL\n`;
  }

  cfg += '!\n! 2. Set buffer size\n';
  cfg += `monitor capture ${name} buffer size ${buf}\n`;
  cfg += '!\n! 3. Start capturing\n';
  cfg += `monitor capture ${name} start\n`;
  cfg += '!\n! --- Let traffic flow, then stop when done ---\n!\n';
  cfg += '! 4. Stop capture\n';
  cfg += `monitor capture ${name} stop\n`;
  cfg += '!\n! 5. Verify captured packets\n';
  cfg += `show monitor capture ${name}\n`;
  cfg += `show monitor capture ${name} buffer brief\n`;

  if (f.exportMethod !== 'none') {
    cfg += '!\n! 6. Export capture file\n';
    if (f.exportMethod === 'flash') {
      cfg += `monitor capture ${name} export flash:${file}.pcap\n`;
      cfg += '!\n! Then transfer to workstation:\n';
      cfg += `! copy flash:${file}.pcap tftp://${server}/${file}.pcap\n`;
    } else if (f.exportMethod === 'tftp') {
      cfg += `monitor capture ${name} export tftp://${server}/${file}.pcap\n`;
    } else if (f.exportMethod === 'ftp') {
      cfg += `monitor capture ${name} export ftp://<user>:<pass>@${server}/${file}.pcap\n`;
    }
  }

  cfg += '!\n! 7. Clean up\n';
  cfg += `no monitor capture ${name}\n`;
  if (f.match === 'acl') {
    cfg += `no ip access-list extended ${name}-ACL\n`;
  }
  return cfg;
}
