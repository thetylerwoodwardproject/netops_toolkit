// IPv4 helpers shared by the calculators. Addresses are unsigned 32-bit ints.

/** '192.168.1.10' → int, or null if it isn't a dotted quad of 0–255 octets. */
export function parseIPv4(text: string): number | null {
  const parts = text.trim().split('.');
  if (parts.length !== 4 || parts.some((p) => !/^\d{1,3}$/.test(p) || Number(p) > 255)) return null;
  return parts.reduce((n, p) => ((n << 8) | Number(p)) >>> 0, 0);
}

export const formatIPv4 = (n: number) =>
  `${(n >>> 24) & 255}.${(n >>> 16) & 255}.${(n >>> 8) & 255}.${n & 255}`;

export const formatIPv4Binary = (n: number) =>
  [0, 1, 2, 3].map((i) => ((n >>> (24 - i * 8)) & 255).toString(2).padStart(8, '0')).join('.');

export const prefixToMask = (prefix: number) =>
  prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;

export interface Subnet {
  network: number;
  broadcast: number;
  mask: number;
  wildcard: number;
  first: number;
  last: number;
  /** Usable hosts: /31 counts both addresses (RFC 3021), /32 the one. */
  hosts: number;
  total: number;
  prefix: number;
}

export function subnet(address: number, prefix: number): Subnet {
  const mask = prefixToMask(prefix);
  const wildcard = ~mask >>> 0;
  const network = (address & mask) >>> 0;
  const broadcast = (network | wildcard) >>> 0;
  const small = prefix >= 31;
  return {
    network,
    broadcast,
    mask,
    wildcard,
    first: small ? network : (network + 1) >>> 0,
    last: small ? broadcast : (broadcast - 1) >>> 0,
    hosts: small ? (prefix === 32 ? 1 : 2) : 2 ** (32 - prefix) - 2,
    total: 2 ** (32 - prefix),
    prefix,
  };
}

export function ipv4Class(address: number) {
  const first = address >>> 24;
  return first < 128 ? 'A' : first < 192 ? 'B' : first < 224 ? 'C' : first < 240 ? 'D' : 'E';
}

/** RFC 1918 only, matching the original toolkit. */
export function isPrivateIPv4(address: number) {
  const a = address >>> 24;
  const b = (address >>> 16) & 255;
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

/**
 * Read an IPv4 address written any of the ways the IP converter accepts:
 * dotted decimal, binary (only 0s, 1s and dots, up to 32 bits), hex (0x
 * prefix or any a–f digit) or a plain decimal integer. Null if it is none of
 * these or doesn't fit in 32 bits.
 */
export function parseIPv4Any(text: string): number | null {
  const v = text.trim();
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(v)) return parseIPv4(v);
  if (/^[01.]+$/.test(v)) {
    const bits = v.replace(/\./g, '');
    return bits.length >= 1 && bits.length <= 32 ? Number.parseInt(bits, 2) >>> 0 : null;
  }
  // The original tested hex before decimal, and plain digits pass a hex test,
  // so decimal input such as 3232235777 was read as hex. Hex now needs a 0x
  // prefix or a letter digit.
  let n: number;
  if (/^0x[0-9a-f]+$/i.test(v)) n = Number.parseInt(v.slice(2), 16);
  else if (/^[0-9a-f]+$/i.test(v) && /[a-f]/i.test(v)) n = Number.parseInt(v, 16);
  else if (/^\d+$/.test(v)) n = Number(v);
  else return null;
  return n <= 0xffffffff ? n : null;
}
