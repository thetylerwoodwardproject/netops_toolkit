<script lang="ts">
  import CodeBlock from '@/components/CodeBlock.svelte';
  import TextField from '@/components/TextField.svelte';
  import { sshConfig, type SshInput } from '@/lib/gen/ssh';

  const f: SshInput = $state({
    host: 'SW-CORE-01',
    domain: 'mynetwork.local',
    user: 'admin',
    pass: 'Str0ngP@ss!',
    rsa: '2048',
    vty: '0 15',
  });
</script>

<div class="form-row">
  <TextField label="Hostname" id="ssh-host" bind:value={f.host} />
  <TextField label="Domain Name" id="ssh-domain" bind:value={f.domain} />
</div>
<div class="form-row">
  <TextField label="Username" id="ssh-user" bind:value={f.user} />
  <TextField label="Password" id="ssh-pass" bind:value={f.pass} />
</div>
<div class="form-row">
  <div class="form-group">
    <label class="form-label" for="ssh-rsa">RSA Key Size</label>
    <select class="form-select" id="ssh-rsa" bind:value={f.rsa}>
      <option>2048</option>
      <option>4096</option>
      <option>1024</option>
    </select>
  </div>
  <TextField label="VTY Lines" id="ssh-vty" bind:value={f.vty} />
</div>

<div aria-live="polite">
  <CodeBlock code={sshConfig(f)} />
</div>
