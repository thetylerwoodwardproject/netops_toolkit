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
