<script lang="ts">
  import SelectField from '@/components/SelectField.svelte';
  import CodeBlock from '@/components/CodeBlock.svelte';
  import TextField from '@/components/TextField.svelte';
  import { aclConfig, type AclInput } from '@/lib/gen/acl';

  const f: AclInput = $state({
    type: 'standard',
    name: 'BLOCK-GUEST',
    rules:
      'permit,192.168.10.0 0.0.0.255,any,tcp,80\ndeny,192.168.20.0 0.0.0.255,any,tcp,443\npermit,any',
    intf: 'Gi0/0',
    dir: 'in',
  });
</script>

<div class="form-row">
  <SelectField
    label="ACL Type"
    id="acl-type"
    bind:value={f.type}
    options={[
      { value: 'standard', label: 'standard' },
      { value: 'extended', label: 'extended' },
    ]}
  />
  <TextField label="ACL Name/Number" id="acl-name" bind:value={f.name} />
</div>
<div class="form-group">
  <label class="form-label" for="acl-rules"
    >Rules (one per line: action,source[,dest,protocol,port])</label
  >
  <textarea
    class="form-input"
    id="acl-rules"
    placeholder={'permit,192.168.10.0 0.0.0.255\ndeny,192.168.20.0 0.0.0.255\npermit,any'}
    spellcheck="false"
    bind:value={f.rules}></textarea>
</div>
<div class="form-row">
  <TextField label="Apply to Interface" id="acl-intf" bind:value={f.intf} />
  <SelectField
    label="Direction"
    id="acl-dir"
    bind:value={f.dir}
    options={[
      { value: 'in', label: 'in' },
      { value: 'out', label: 'out' },
    ]}
  />
</div>

<div aria-live="polite">
  <CodeBlock code={aclConfig(f)} />
  <div class="tip">
    💡 <strong>Standard ACLs</strong> → place close to destination. <strong>Extended ACLs</strong>
    → place close to source.
  </div>
</div>
