<script lang="ts">
  import { faBolt } from '@fortawesome/free-solid-svg-icons/faBolt';
  import { faCircleXmark } from '@fortawesome/free-solid-svg-icons/faCircleXmark';
  import { faClipboardList } from '@fortawesome/free-solid-svg-icons/faClipboardList';
  import { faFingerprint } from '@fortawesome/free-solid-svg-icons/faFingerprint';
  import { faKey } from '@fortawesome/free-solid-svg-icons/faKey';
  import { faLock } from '@fortawesome/free-solid-svg-icons/faLock';
  import { faLockOpen } from '@fortawesome/free-solid-svg-icons/faLockOpen';
  import { faSpinner } from '@fortawesome/free-solid-svg-icons/faSpinner';
  import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons/faTriangleExclamation';
  import Icon from '@/components/Icon.svelte';

  let bits = $state('4096');
  let usage: 'encrypt' | 'sign' = $state('encrypt');
  let status: { busy: boolean; message: string } | null = $state(null);
  let keys: {
    pub: string;
    priv: string;
    fingerprint: string;
    bits: number;
    algorithm: string;
    pubBytes: number;
    privBytes: number;
  } | null = $state(null);
  let copied = $state('');

  function toPem(label: string, buf: ArrayBuffer) {
    const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    return `-----BEGIN ${label}-----\n${b64.match(/.{1,64}/g)!.join('\n')}\n-----END ${label}-----`;
  }

  async function generate() {
    const size = Number(bits);
    keys = null;
    status = {
      busy: true,
      message: `Generating ${size}-bit RSA key pair… this may take a moment.`,
    };
    try {
      const encrypt = usage === 'encrypt';
      const algorithm = encrypt ? 'RSA-OAEP' : 'RSASSA-PKCS1-v1_5';
      const pair = await crypto.subtle.generateKey(
        {
          name: algorithm,
          modulusLength: size,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        encrypt ? ['encrypt', 'decrypt'] : ['sign', 'verify'],
      );
      const pub = await crypto.subtle.exportKey('spki', pair.publicKey);
      const priv = await crypto.subtle.exportKey('pkcs8', pair.privateKey);
      const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', pub));
      const hex = [...digest].map((b) => b.toString(16).padStart(2, '0')).join(':');
      keys = {
        pub: toPem('PUBLIC KEY', pub),
        priv: toPem('PRIVATE KEY', priv),
        fingerprint: `SHA-256: ${hex.slice(0, 47)}…`,
        bits: size,
        algorithm,
        pubBytes: pub.byteLength,
        privBytes: priv.byteLength,
      };
      status = null;
    } catch (e) {
      status = { busy: false, message: `Error: ${(e as Error).message}` };
    }
  }

  async function copy(which: 'pub' | 'priv') {
    if (!keys) return;
    await navigator.clipboard.writeText(keys[which]);
    copied = which;
    setTimeout(() => copied === which && (copied = ''), 1500);
  }

  function download(which: 'pub' | 'priv') {
    if (!keys) return;
    const url = URL.createObjectURL(new Blob([keys[which]], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = which === 'pub' ? 'public_key.pem' : 'private_key.pem';
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="panel">
  <h3><Icon icon={faKey} /> Key Configuration</h3>
  <div class="form-row-3">
    <div class="form-group">
      <label class="form-label" for="rsa-bits">Key Size (bits)</label>
      <select class="form-select" id="rsa-bits" bind:value={bits}>
        <option value="2048">2048-bit (standard)</option>
        <option value="3072">3072-bit (stronger)</option>
        <option value="4096">4096-bit (high security)</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label" for="rsa-usage">Key Usage</label>
      <select class="form-select" id="rsa-usage" bind:value={usage}>
        <option value="encrypt">Encryption / Decryption (RSA-OAEP)</option>
        <option value="sign">Signing / Verification (RSASSA-PKCS1-v1_5)</option>
      </select>
    </div>
    <div class="form-group">
      <span class="form-label max-md:hidden">&nbsp;</span>
      <button
        class="btn btn-primary inline-flex w-full items-center justify-center gap-1.5"
        type="button"
        disabled={status?.busy}
        onclick={generate}
      >
        <Icon icon={faBolt} size={13} /> Generate Keys
      </button>
    </div>
  </div>
  <div class="tip mt-2.5">
    <Icon icon={faLock} />
    <strong>100% in-browser</strong> — Keys are generated locally using the Web Crypto API. Nothing is
    transmitted or stored.
  </div>
</div>

<div aria-live="polite">
  {#if status}
    <div class="panel">
      <div class="flex items-center gap-2.5 text-[13px] text-text2">
        {#if status.busy}
          <Icon icon={faSpinner} size={20} class="animate-spin text-accent" />
        {:else}
          <Icon icon={faCircleXmark} size={20} class="text-red" />
        {/if}
        <span>{status.message}</span>
      </div>
    </div>
  {/if}

  {#if keys}
    <div class="panel">
      <h3 class="flex-wrap text-green">
        <Icon icon={faLockOpen} /> Public Key
        <span class="text-[11px] font-normal text-text3"
          >(share freely — encrypt TO this, verify signatures WITH this)</span
        >
      </h3>
      <div class="relative">
        <textarea
          class="form-input mono min-h-40 text-[11px]!"
          readonly
          aria-label="Public key"
          value={keys.pub}></textarea>
        <button
          class="btn btn-secondary btn-sm absolute top-2 right-2"
          type="button"
          onclick={() => copy('pub')}>{copied === 'pub' ? 'Copied!' : 'Copy'}</button
        >
      </div>
      <div class="mt-2 flex flex-wrap items-center gap-2">
        <button class="btn btn-secondary btn-sm" type="button" onclick={() => download('pub')}
          >↓ Download public_key.pem</button
        >
        <span class="inline-flex items-center gap-1 text-[11px] text-text3">
          <Icon icon={faFingerprint} size={12} />
          {keys.fingerprint}
        </span>
      </div>
    </div>

    <div class="panel">
      <h3 class="flex-wrap text-orange">
        <Icon icon={faLock} /> Private Key
        <span class="text-[11px] font-normal text-text3"
          >(keep secret — decrypt WITH this, sign WITH this)</span
        >
      </h3>
      <div class="warn mb-2.5">
        <Icon icon={faTriangleExclamation} />
        <strong>Never share your private key.</strong> Store it securely — a compromised private key cannot
        be “un-compromised.”
      </div>
      <div class="relative">
        <textarea
          class="form-input mono min-h-[220px] text-[11px]!"
          readonly
          aria-label="Private key"
          value={keys.priv}></textarea>
        <button
          class="btn btn-secondary btn-sm absolute top-2 right-2"
          type="button"
          onclick={() => copy('priv')}>{copied === 'priv' ? 'Copied!' : 'Copy'}</button
        >
      </div>
      <div class="mt-2 flex flex-wrap gap-2">
        <button class="btn btn-secondary btn-sm" type="button" onclick={() => download('priv')}
          >↓ Download private_key.pem</button
        >
      </div>
    </div>

    <div class="panel">
      <h3><Icon icon={faClipboardList} /> Key Details</h3>
      <div class="result-grid">
        {#each [['Key Size', `${keys.bits} bits`], ['Algorithm', keys.algorithm], ['Hash', 'SHA-256'], ['Public Exponent', '65537 (0x10001)'], ['Public Key Format', 'SPKI / PEM'], ['Private Key Format', 'PKCS#8 / PEM'], ['Public Key (DER)', `${keys.pubBytes} bytes`], ['Private Key (DER)', `${keys.privBytes} bytes`]] as [label, value] (label)}
          <div class="result-item">
            <div class="ri-label">{label}</div>
            <div class="ri-value">{value}</div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
