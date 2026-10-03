export interface CrontabInput {
  /** An @special string (@daily...) that replaces the five fields, or ''. */
  preset: string;
  min: string;
  hour: string;
  dom: string;
  mon: string;
  dow: string;
  cmd: string;
  /** Only for system crontabs (/etc/cron.d). */
  user: string;
  /** '', '>/dev/null', '>>LOG' or '>LOG'; LOG stands for `logPath`. */
  stdout: string;
  /** '', '2>/dev/null', '2>&1' or '2>>ERRLOG'; ERRLOG stands for `errLogPath`. */
  stderr: string;
  /** '', 'suppress' or 'custom'. */
  mailto: string;
  mailAddr: string;
  logPath: string;
  errLogPath: string;
}

const SPECIAL: Record<string, string> = {
  '@reboot': 'Runs once at system startup',
  '@hourly': 'Runs every hour on the hour',
  '@daily': 'Runs every day at midnight',
  '@midnight': 'Runs every day at midnight',
  '@weekly': 'Runs every Sunday at midnight',
  '@monthly': 'Runs on the 1st of every month at midnight',
  '@yearly': 'Runs on January 1st at midnight',
  '@annually': 'Runs on January 1st at midnight',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  '',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function crontabLine(f: CrontabInput): { output: string; human: string } {
  const min = f.min.trim() || '*';
  const hour = f.hour.trim() || '*';
  const dom = f.dom.trim() || '*';
  const mon = f.mon.trim() || '*';
  const dow = f.dow.trim() || '*';
  const cmd = f.cmd.trim() || '/path/to/command';
  const user = f.user.trim();
  const mailAddr = f.mailAddr.trim();
  const logPath = f.logPath.trim() || '/var/log/mycron.log';
  const errLogPath = f.errLogPath.trim() || '/var/log/mycron-errors.log';

  const schedule = f.preset ? f.preset : `${min} ${hour} ${dom} ${mon} ${dow}`;

  const stdout = f.stdout.replace('>>LOG', `>> ${logPath}`).replace('>LOG', `> ${logPath}`);
  const stderr = f.stderr.replace('2>>ERRLOG', `2>> ${errLogPath}`);
  let redirect = '';
  if (stdout) redirect += ' ' + stdout;
  if (stderr) redirect += ' ' + stderr;

  const line = `${schedule}  ${user ? user + ' ' : ''}${cmd}${redirect}`;

  let mailto = '';
  if (f.mailto === 'suppress') mailto = 'MAILTO=""\n';
  else if (f.mailto === 'custom' && mailAddr) mailto = `MAILTO="${mailAddr}"\n`;

  return { output: mailto + line, human: humanize(schedule, f.preset) };
}

function ordinal(dom: string): string {
  if (dom.endsWith('1') && dom !== '11') return 'st';
  if (dom.endsWith('2') && dom !== '12') return 'nd';
  if (dom.endsWith('3') && dom !== '13') return 'rd';
  return 'th';
}

function humanize(schedule: string, preset: string): string {
  if (preset && SPECIAL[preset]) return SPECIAL[preset];
  if (preset) return 'Custom scheduled expression';
  const parts = schedule.split(/\s+/);
  if (parts.length !== 5) return '';
  const [min, hour, dom, mon, dow] = parts;

  let desc = 'Runs ';
  if (min === '*' && hour === '*') desc += 'every minute';
  else if (min.startsWith('*/') && hour === '*') desc += `every ${min.slice(2)} minutes`;
  else if (hour === '*' && min !== '*') desc += `at minute ${min} of every hour`;
  else if (hour !== '*' && min !== '*') {
    const h = parseInt(hour);
    const hLabel =
      hour.includes('-') || hour.includes('/') || hour.includes(',')
        ? `hour(s) ${hour}`
        : h < 12
          ? hour + ' AM'
          : h === 12
            ? '12 PM'
            : h - 12 + ' PM';
    desc += `at ${min === '0' ? '' : 'minute ' + min + ' past '}${hLabel}`;
  }
  if (dom !== '*') desc += `, on the ${dom}${ordinal(dom)} of the month`;
  if (mon !== '*') {
    const m = parseInt(mon);
    desc += `, in ${!isNaN(m) && m >= 1 && m <= 12 ? MONTHS[m] : mon}`;
  }
  if (dow !== '*') {
    const d = parseInt(dow);
    desc += `, on ${!isNaN(d) && d >= 0 && d <= 6 ? DAYS[d] : dow}`;
  }
  return desc;
}
