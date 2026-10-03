<script lang="ts">
  import SelectField from '@/components/SelectField.svelte';
  import { faCalendar } from '@fortawesome/free-solid-svg-icons/faCalendar';
  import { faClock } from '@fortawesome/free-solid-svg-icons/faClock';
  import { faDesktop } from '@fortawesome/free-solid-svg-icons/faDesktop';
  import { faGear } from '@fortawesome/free-solid-svg-icons/faGear';
  import { faBolt } from '@fortawesome/free-solid-svg-icons/faBolt';
  import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons/faTriangleExclamation';
  import { faUpload } from '@fortawesome/free-solid-svg-icons/faUpload';
  import CodeBlock from '@/components/CodeBlock.svelte';
  import Icon from '@/components/Icon.svelte';
  import TextField from '@/components/TextField.svelte';
  import { crontabLine, type CrontabInput } from '@/lib/gen/crontab';

  const f: CrontabInput = $state({
    preset: '',
    min: '0',
    hour: '*',
    dom: '*',
    mon: '*',
    dow: '*',
    cmd: '/usr/local/bin/backup.sh',
    user: '',
    stdout: '',
    stderr: '',
    mailto: '',
    mailAddr: 'admin@example.com',
    logPath: '/var/log/mycron.log',
    errLogPath: '/var/log/mycron-errors.log',
  });

  const presets: [string, string][] = [
    ['@reboot', '@reboot'],
    ['@hourly', '@hourly'],
    ['@daily', '@daily (midnight)'],
    ['@weekly', '@weekly'],
    ['@monthly', '@monthly'],
    ['0 * * * *', 'Every Hour'],
    ['*/5 * * * *', 'Every 5 min'],
    ['*/15 * * * *', 'Every 15 min'],
    ['0 2 * * *', 'Daily 2 AM'],
    ['0 2 * * 0', 'Weekly Sun 2 AM'],
    ['0 0 1 * *', '1st of Month'],
    ['0 8-17 * * 1-5', 'Weekdays 8–5'],
  ];

  function applyPreset(expr: string) {
    if (expr.startsWith('@')) {
      f.preset = expr;
      return;
    }
    f.preset = '';
    const parts = expr.split(' ');
    f.min = parts[0] || '*';
    f.hour = parts[1] || '*';
    f.dom = parts[2] || '*';
    f.mon = parts[3] || '*';
    f.dow = parts[4] || '*';
  }

  type Field = 'min' | 'hour' | 'dom' | 'mon' | 'dow';
  const fields: {
    key: Field;
    label: string;
    range: string;
    placeholder: string;
    helpers: [string, string][];
  }[] = [
    {
      key: 'min',
      label: 'Minute',
      range: '(0–59)',
      placeholder: '0, */5, 0-30',
      helpers: [
        ['*', '* (every)'],
        ['0', '0 (on the hour)'],
        ['*/5', '*/5 (every 5 min)'],
        ['*/10', '*/10 (every 10 min)'],
        ['*/15', '*/15 (every 15 min)'],
        ['*/30', '*/30 (every 30 min)'],
        ['0,30', '0,30 (twice/hr)'],
      ],
    },
    {
      key: 'hour',
      label: 'Hour',
      range: '(0–23)',
      placeholder: '*, 0, 8-17',
      helpers: [
        ['*', '* (every hour)'],
        ['0', '0 (midnight)'],
        ['1', '1 (1 AM)'],
        ['2', '2 (2 AM)'],
        ['6', '6 (6 AM)'],
        ['8', '8 (8 AM)'],
        ['12', '12 (noon)'],
        ['17', '17 (5 PM)'],
        ['*/2', '*/2 (every 2hr)'],
        ['*/4', '*/4 (every 4hr)'],
        ['*/6', '*/6 (every 6hr)'],
        ['8-17', '8-17 (business hrs)'],
      ],
    },
    {
      key: 'dom',
      label: 'Day of Month',
      range: '(1–31)',
      placeholder: '*, 1, 15',
      helpers: [
        ['*', '* (every day)'],
        ['1', '1 (1st)'],
        ['15', '15 (15th)'],
        ['1,15', '1,15 (1st & 15th)'],
        ['L', 'L (last day)*'],
      ],
    },
    {
      key: 'mon',
      label: 'Month',
      range: '(1–12)',
      placeholder: '*, 1-6, 12',
      helpers: [
        ['*', '* (every month)'],
        ['1', '1 (Jan)'],
        ['3', '3 (Mar)'],
        ['6', '6 (Jun)'],
        ['9', '9 (Sep)'],
        ['12', '12 (Dec)'],
        ['1-6', '1-6 (Jan–Jun)'],
        ['7-12', '7-12 (Jul–Dec)'],
        ['*/3', '*/3 (quarterly)'],
      ],
    },
    {
      key: 'dow',
      label: 'Day of Week',
      range: '(0=Sun)',
      placeholder: '*, 0, 1-5',
      helpers: [
        ['*', '* (every day)'],
        ['0', '0 (Sunday)'],
        ['1', '1 (Monday)'],
        ['5', '5 (Friday)'],
        ['6', '6 (Saturday)'],
        ['1-5', '1-5 (Mon–Fri)'],
        ['0,6', '0,6 (Weekends)'],
      ],
    },
  ];

  const needsLog = $derived(f.stdout === '>>LOG' || f.stdout === '>LOG');
  const needsErrLog = $derived(f.stderr === '2>>ERRLOG');
  const result = $derived(crontabLine(f));
</script>

<div class="panel">
  <h3><Icon icon={faBolt} /> Quick Presets</h3>
  <div class="mt-1.5 flex flex-wrap gap-1.5">
    {#each presets as [expr, label] (expr)}
      <button class="btn btn-secondary btn-sm" type="button" onclick={() => applyPreset(expr)}>
        {label}
      </button>
    {/each}
  </div>
</div>

<div class="panel">
  <h3><Icon icon={faCalendar} /> Schedule Fields</h3>
  <div
    class="grid grid-cols-2 gap-2 xs:grid-cols-3 md:grid-cols-5 {f.preset
      ? 'pointer-events-none opacity-40'
      : ''}"
  >
    {#each fields as fld (fld.key)}
      <div class="form-group">
        <label class="form-label" for="ct-{fld.key}"
          >{fld.label} <span class="font-normal text-text3">{fld.range}</span></label
        >
        <input
          class="form-input mono"
          id="ct-{fld.key}"
          placeholder={fld.placeholder}
          spellcheck="false"
          autocomplete="off"
          bind:value={f[fld.key]}
        />
        <select
          class="form-select mt-1 text-[11px]"
          aria-label="{fld.label} helpers"
          value=""
          onchange={(e) => {
            if (e.currentTarget.value) f[fld.key] = e.currentTarget.value;
            e.currentTarget.value = '';
          }}
        >
          <option value="">— helpers —</option>
          {#each fld.helpers as [value, label] (value)}<option {value}>{label}</option>{/each}
        </select>
      </div>
    {/each}
  </div>
  {#if f.preset}
    <div class="tip">
      Using a <strong>@special string</strong> — schedule fields are not used. Clear the preset to
      use custom fields.
      <button class="btn btn-sm btn-secondary ml-2" type="button" onclick={() => (f.preset = '')}>
        Clear Preset
      </button>
    </div>
  {/if}
</div>

<div class="panel">
  <h3><Icon icon={faGear} /> Command &amp; User</h3>
  <div class="form-row">
    <TextField
      label="Command / Script Path"
      id="ct-cmd"
      placeholder="/path/to/script.sh"
      bind:value={f.cmd}
    />
    <div class="form-group">
      <label class="form-label" for="ct-user"
        >Run as User <span class="font-normal text-text3">(system crontab only)</span></label
      >
      <input
        class="form-input mono"
        id="ct-user"
        placeholder="root, www-data, deploy…"
        spellcheck="false"
        autocomplete="off"
        bind:value={f.user}
      />
      <div class="mt-[3px] text-[11px] text-text3">
        Leave blank for user crontab (<code>crontab -e</code>). Fill in for
        <code>/etc/cron.d/</code> files.
      </div>
    </div>
  </div>
</div>

<div class="panel">
  <h3><Icon icon={faUpload} /> Output &amp; Logging Options</h3>
  <div class="grid grid-cols-1 gap-3.5 xs:grid-cols-2">
    <SelectField
      label="Stdout (standard output)"
      id="ct-stdout"
      bind:value={f.stdout}
      group={false}
      options={[
        { value: '', label: '— no redirect —' },
        { value: '>/dev/null', label: '> /dev/null (discard stdout)' },
        { value: '>>LOG', label: '>> logfile (append to log)' },
        { value: '>LOG', label: '> logfile (overwrite log)' },
      ]}
    />
    <SelectField
      label="Stderr (errors)"
      id="ct-stderr"
      bind:value={f.stderr}
      group={false}
      options={[
        { value: '', label: '— no redirect —' },
        { value: '2>/dev/null', label: '2> /dev/null (discard errors)' },
        { value: '2>&1', label: '2>&1 (merge into stdout)' },
        { value: '2>>ERRLOG', label: '2>> error logfile (append)' },
      ]}
    />
  </div>
  {#if needsLog || needsErrLog}
    <div class="mt-3">
      <div class="form-row">
        {#if needsLog}
          <TextField label="Log File Path" id="ct-logpath" bind:value={f.logPath} />
        {/if}
        {#if needsErrLog}
          <TextField label="Error Log File Path" id="ct-errlogpath" bind:value={f.errLogPath} />
        {/if}
      </div>
      <div class="warn">
        <Icon icon={faTriangleExclamation} class="mr-1 inline text-orange" />
        <strong>Log file setup required</strong> — cron will not create missing directories
        automatically.<br />
        You must create the log directory and set proper permissions <em>before</em> the job runs.<br
        />
        <strong>Examples:</strong><br />
        <code class="mt-1.5 mb-0.5 block font-mono text-[12px]">sudo mkdir -p /var/log/mycron</code>
        <code class="my-0.5 block font-mono text-[12px]">sudo touch /var/log/mycron.log</code>
        <code class="my-0.5 block font-mono text-[12px]"
          >sudo chown youruser:youruser /var/log/mycron.log</code
        >
        <code class="my-0.5 block font-mono text-[12px]">sudo chmod 640 /var/log/mycron.log</code>
        <br />
        <strong>Tips:</strong><br />
        • Use <code>logrotate</code> to prevent logs from growing indefinitely.<br />
        • <code>chmod 640</code> = owner read/write, group read, others none — good for log files.<br
        />
        • If running as <code>root</code>, the log directory must still be writable by root (it
        usually is).<br />
        • For system-wide crons in <code>/etc/cron.d/</code>, <code>/var/log/</code> is typically
        owned by root/syslog — verify with <code>ls -la /var/log/</code>.
      </div>
    </div>
  {/if}
  <SelectField
    label="Email Notifications (MAILTO)"
    id="ct-mailto"
    bind:value={f.mailto}
    group={false}
    class="mt-3"
    options={[
      { value: '', label: '— system default (send to cron owner) —' },
      { value: 'suppress', label: 'MAILTO="" (suppress all email)' },
      { value: 'custom', label: 'MAILTO=address (send to specific address)' },
    ]}
  />
  {#if f.mailto === 'custom'}
    <div class="mt-2">
      <TextField label="Email Address" id="ct-mailaddr" bind:value={f.mailAddr} />
    </div>
  {/if}
</div>

<div class="panel">
  <h3><Icon icon={faDesktop} /> Generated Crontab Entry</h3>
  <div aria-live="polite">
    <CodeBlock code={result.output} />
    {#if result.human}
      <div class="mt-2 text-[12px] text-green">
        <Icon icon={faClock} class="mr-1 inline align-[-2px]" />
        {result.human}
      </div>
    {/if}
  </div>
  <div class="tip mt-2.5">
    <strong>Installing:</strong> Run <code>crontab -e</code> to edit your user crontab, or paste
    system-wide jobs into <code>/etc/cron.d/jobname</code> (requires user field). Verify with
    <code>crontab -l</code>.
  </div>
</div>
