/** Commands to run a TDR cable test on one or more interfaces. */
export function tdrCommands(single: string, bulk: string, wait: string): string | null {
  const list = bulk
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  const intfs = list.length ? list : single.trim() ? [single.trim()] : [];
  if (!intfs.length) return null;
  const seconds = wait || '5';

  let cfg = '';
  intfs.forEach((intf, i) => {
    cfg += `! === CABLE DIAGNOSTICS (TDR): ${intf} ===\n`;
    cfg += `test cable-diagnostics tdr interface ${intf}\n`;
    cfg += `! wait ~${seconds} seconds for the DSP test to complete\n`;
    cfg += `show cable-diagnostics tdr interface ${intf}\n`;
    if (i < intfs.length - 1) cfg += '!\n';
  });
  return cfg;
}

export type Tone = 'green' | 'red' | 'orange' | 'muted';

export interface Pair {
  pair: string;
  length: number;
  tolerance: number;
  remote: string;
  status: string;
}

export interface Verdict {
  tone: Tone | 'none';
  label: string;
  text: string;
}

export interface InterfaceResult {
  name: string;
  speed: string;
  pairs: Pair[];
  verdict: Verdict;
  /** One explanation per distinct status. */
  statuses: { status: string; tone: Tone; explain: string }[];
}

export interface TdrResult {
  testTime: string;
  interfaces: InterfaceResult[];
}

export function statusTone(status: string): Tone {
  const s = status.toLowerCase();
  if (s.includes('terminated') || s.includes('pair up') || s.includes('working')) return 'green';
  if (s.includes('open') || s.includes('short')) return 'red';
  if (s.includes('impedance')) return 'orange';
  return 'muted';
}

export function statusExplain(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('terminated')) {
    return 'A link partner or proper termination is present at this distance — healthy.';
  }
  if (s.includes('pair up') || s.includes('working'))
    return 'Pair is actively passing a link — healthy.';
  if (s.includes('short')) {
    return 'Shorted to another pair or ground at this distance — physical damage or a wiring fault.';
  }
  if (s.includes('open')) {
    return 'Broken, disconnected, or nothing connected on the far end at this distance.';
  }
  if (s.includes('impedance')) {
    return 'Impedance discontinuity detected (bad connector, kink, or wrong cable category) at this distance.';
  }
  if (s.includes('not completed')) {
    return "Test didn't finish — interface may be admin-down or unsupported.";
  }
  return 'Unrecognized status — verify manually against the pasted output.';
}

const STATUS_KEYWORDS = [
  'Not Completed',
  'Impedance Mismatched',
  'Pair is working correctly',
  'Pair up',
  'Terminated',
  'Open',
  'Short',
];

function verdictFor(pairs: Pair[]): Verdict {
  const names = (list: Pair[]) => list.map((p) => p.pair).join(', ');
  const bad = pairs.filter((p) => /open|short/i.test(p.status));
  const mismatch = pairs.filter((p) => /impedance/i.test(p.status));
  const incomplete = pairs.filter((p) => /not completed/i.test(p.status));
  if (bad.length) {
    return {
      tone: 'red',
      label: 'Fault',
      text: `Fault detected on pair${bad.length > 1 ? 's' : ''} ${names(bad)} — cable is likely broken or disconnected.`,
    };
  }
  if (mismatch.length) {
    return {
      tone: 'orange',
      label: 'Warning',
      text: `Impedance mismatch on pair${mismatch.length > 1 ? 's' : ''} ${names(mismatch)} — check connectors and cable quality.`,
    };
  }
  if (incomplete.length === pairs.length) {
    return {
      tone: 'none',
      label: 'Incomplete',
      text: 'Test did not complete — interface may be down, unsupported, or link already active at a speed that blocks TDR.',
    };
  }
  return {
    tone: 'green',
    label: 'Healthy',
    text: 'All pairs terminated / up — cable appears healthy.',
  };
}

/** Parse the output of `show cable-diagnostics tdr interface <intf>`; null if no Pair rows are found. */
export function parseTdr(raw: string): TdrResult | null {
  const groups: Record<string, { speed: string; pairs: Pair[] }> = {};
  let curIntf: string | null = null;
  let curSpeed = '';

  const testTime = raw.match(/TDR test last run on:\s*(.+)/i)?.[1].trim() ?? '';

  for (const line of raw.split('\n')) {
    let m = line.match(
      /^(\S+)\s+(\S+)\s+Pair\s+([A-D])\s+(\d+)\s+\+\/-\s+(\d+)\s+meters?\s+(.+)$/i,
    );
    let isHeaderRow = true;
    if (!m) {
      m = line.match(/^\s+Pair\s+([A-D])\s+(\d+)\s+\+\/-\s+(\d+)\s+meters?\s+(.+)$/i);
      isHeaderRow = false;
    }
    if (!m) continue;

    let pairLetter: string, length: string, tolerance: string, tail: string;
    if (isHeaderRow) {
      curIntf = m[1];
      curSpeed = m[2];
      [pairLetter, length, tolerance, tail] = [m[3], m[4], m[5], m[6]];
    } else {
      [pairLetter, length, tolerance, tail] = [m[1], m[2], m[3], m[4]];
    }
    if (!curIntf) curIntf = 'Interface';
    tail = tail.trim();

    let status: string | null = null;
    let remote = tail;
    for (const kw of STATUS_KEYWORDS) {
      const re = new RegExp(kw.replace(/ /g, '\\s+') + '\\s*$', 'i');
      if (re.test(tail)) {
        status = kw;
        remote = tail.replace(re, '').trim();
        break;
      }
    }
    if (!status) {
      status = tail;
      remote = '';
    }
    if (!remote || remote === 'N/A' || remote === '-') remote = '—';

    (groups[curIntf] ??= { speed: curSpeed, pairs: [] }).pairs.push({
      pair: pairLetter,
      length: parseInt(length, 10),
      tolerance: parseInt(tolerance, 10),
      remote,
      status,
    });
  }

  const names = Object.keys(groups);
  if (!names.length) return null;
  return {
    testTime,
    interfaces: names.map((name) => {
      const g = groups[name];
      return {
        name,
        speed: g.speed,
        pairs: g.pairs,
        verdict: verdictFor(g.pairs),
        statuses: [...new Set(g.pairs.map((p) => p.status))].map((status) => ({
          status,
          tone: statusTone(status),
          explain: statusExplain(status),
        })),
      };
    }),
  };
}
