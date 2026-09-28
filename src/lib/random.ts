/** A uniformly random index below `n`, from the browser's CSPRNG. */
export function randomIndex(n: number): number {
  // Reject values from the top partial range so every index is equally likely.
  const limit = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return buf[0] % n;
}

export function randomString(length: number, alphabet: string): string {
  let s = '';
  for (let i = 0; i < length; i++) s += alphabet[randomIndex(alphabet.length)];
  return s;
}
