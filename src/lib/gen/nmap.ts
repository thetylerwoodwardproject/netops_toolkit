export interface NmapInput {
  target: string;
  /** An nmap scan flag; "-sI zombie" is the idle scan, completed by `zombie`. */
  scanType: string;
  zombie: string;
  timing: string;
  hostgroup: string;
  portPreset: 'top100' | 'top1000' | 'common' | 'allports' | 'custom';
  customPorts: string;
  outputFmt: string;
  outputFile: string;
  script: string;
  customScript: string;
  sv: boolean;
  os: boolean;
  sc: boolean;
  aggressive: boolean;
  v: boolean;
  vv: boolean;
  open: boolean;
  reason: boolean;
  pn: boolean;
  n: boolean;
  pe: boolean;
  traceroute: boolean;
}

export interface NmapResult {
  cmd: string;
  needsRoot: boolean;
  notes: string[];
  /** The last note is a warning about intrusive scripts. */
  intrusive: boolean;
}

const COMMON_PORTS =
  '-p 21,22,23,25,53,80,110,111,135,139,143,161,162,389,443,445,514,587,636,993,995,1433,1521,1723,3306,3389,5060,5432,5900,6379,8080,8443,27017';

/** The nmap command line for the form, or null without a target. */
export function nmapCommand(f: NmapInput): NmapResult | null {
  const target = f.target.trim();
  if (!target) return null;

  let scanType = f.scanType;
  if (scanType === '-sI zombie') {
    const zombie = f.zombie.trim();
    scanType = zombie ? `-sI ${zombie}` : '-sI <zombie_host>';
  }

  const needsRootScan = ['-sS', '-sU', '-sA', '-sW', '-sN', '-sF', '-sX', '-sI', '-O', '-A'].some(
    (flag) => scanType.includes(flag),
  );

  const flags: string[] = [];
  if (f.aggressive) {
    flags.push('-A');
  } else {
    if (f.sv) flags.push('-sV');
    if (f.os) flags.push('-O');
    if (f.sc) flags.push('-sC');
  }
  if (f.pn) flags.push('-Pn');
  if (f.n) flags.push('-n');
  if (f.pe) flags.push('-PE');
  if (f.vv) flags.push('-vv');
  else if (f.v) flags.push('-v');
  if (f.open) flags.push('--open');
  if (f.reason) flags.push('--reason');
  if (f.traceroute) flags.push('--traceroute');

  let portFlag = '';
  if (f.portPreset === 'top100') portFlag = '--top-ports 100';
  else if (f.portPreset === 'common') portFlag = COMMON_PORTS;
  else if (f.portPreset === 'allports') portFlag = '-p-';
  else if (f.portPreset === 'custom') {
    const custom = f.customPorts.trim();
    portFlag = custom ? `-p ${custom}` : '';
  }

  const scriptFlag = f.script === 'custom' ? f.customScript.trim() : f.script;

  let outFlag = '';
  const outFile = f.outputFile.trim();
  if (f.outputFmt && outFile) outFlag = `${f.outputFmt} ${outFile}`;
  else if (f.outputFmt) outFlag = `${f.outputFmt} output`;

  const parts = ['nmap'];
  if (scanType) parts.push(scanType);
  if (f.timing !== '-T3') parts.push(f.timing);
  if (f.hostgroup) parts.push(f.hostgroup);
  parts.push(...flags);
  if (portFlag) parts.push(portFlag);
  if (scriptFlag) parts.push(scriptFlag);
  if (outFlag) parts.push(outFlag);
  parts.push(target);

  const notes: string[] = [];
  if (f.aggressive) {
    notes.push('-A enables OS detection, version detection, default scripts, and traceroute');
  }
  if (f.portPreset === 'allports') {
    notes.push('-p- scans all 65535 ports — this will take significantly longer');
  }
  if (f.timing === '-T0' || f.timing === '-T1') {
    notes.push('T0/T1 timing is very slow — may take hours on a /24');
  }
  if (f.timing === '-T5') notes.push('-T5 (Insane) may miss ports due to extremely short timeouts');
  if (scanType.includes('-sU')) {
    notes.push('UDP scans are slow — combine with -T4 and limit port range for speed');
  }
  const intrusive =
    f.script.includes('vuln') || f.script.includes('intrusive') || f.script.includes('exploit');
  if (intrusive) notes.push('This script category may be intrusive — only use with authorization');

  return { cmd: parts.join(' '), needsRoot: needsRootScan || f.os, notes, intrusive };
}
