// Lookups for the IP checker. These are the only third-party requests the
// toolkit makes; the hosts below are listed in the Content Security Policy's
// connect-src (tools/serve.mjs finds them by scanning the build), and the tool
// is left out of the build entirely when externalLookups is off.

async function fetchIp(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
    const d = await r.json();
    return d.ip || null;
  } catch {
    return null;
  }
}

export const fetchIPv4 = () => fetchIp('https://api4.ipify.org?format=json');
export const fetchIPv6 = () => fetchIp('https://api6.ipify.org?format=json');

export async function reverseDns(ip: string): Promise<string | null> {
  try {
    const rev = ip.split('.').reverse().join('.');
    const r = await fetch(`https://dns.google/resolve?name=${rev}.in-addr.arpa&type=PTR`, {
      headers: { Accept: 'application/dns-json' },
    });
    const d = await r.json();
    if (d.Answer?.length) return String(d.Answer[0].data).replace(/\.$/, '');
  } catch {
    // no PTR record, or the lookup failed
  }
  return null;
}

/** What ipapi.co returns for an address; only the fields the page uses. */
export interface Geo {
  error?: boolean;
  reason?: string;
  ip?: string;
  network?: string;
  org?: string;
  asn?: string;
  city?: string;
  region?: string;
  country_name?: string;
  country_code?: string;
  timezone?: string;
  country_calling_code?: string;
  proxy?: boolean;
  latitude?: number | string;
  longitude?: number | string;
}

export async function fetchGeo(ipv4: string | null): Promise<Geo> {
  const url = ipv4 ? `https://ipapi.co/${ipv4}/json/` : 'https://ipapi.co/json/';
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const d: Geo = await res.json();
  if (d.error) throw new Error(d.reason || 'API error');
  return d;
}

/** The address alone, from the lighter fallback endpoint. */
export async function fetchIpFallback(): Promise<string> {
  const r = await fetch('https://api.ipify.org?format=json');
  const d = await r.json();
  return d.ip;
}

interface UserAgentData {
  brands?: { brand: string; version: string }[];
  mobile?: boolean;
  getHighEntropyValues(hints: string[]): Promise<{
    platform?: string;
    platformVersion?: string;
    mobile?: boolean;
    brands?: { brand: string; version: string }[];
  }>;
}

export async function browserInfo() {
  const info: { browser: string | null; os: string | null; mobile: boolean } = {
    browser: null,
    os: null,
    mobile: false,
  };
  const uad = (navigator as Navigator & { userAgentData?: UserAgentData }).userAgentData;
  if (uad) {
    try {
      const h = await uad.getHighEntropyValues(['platform', 'platformVersion', 'mobile', 'brands']);
      const brand = (h.brands || uad.brands || [])
        .filter((b) => !b.brand.includes('Not') && !b.brand.includes('Chromium'))
        .sort((a, b) => Number(b.version) - Number(a.version))[0];
      if (brand) info.browser = `${brand.brand} ${brand.version}`;
      info.os = h.platform ? `${h.platform} ${h.platformVersion || ''}`.trim() : null;
      info.mobile = h.mobile ?? uad.mobile ?? false;
    } catch {
      // fall back to the user agent string
    }
  }
  const ua = navigator.userAgent;
  if (!info.browser) {
    const m =
      ua.match(/Firefox\/([\d.]+)/) ||
      ua.match(/Edg\/([\d.]+)/) ||
      ua.match(/OPR\/([\d.]+)/) ||
      ua.match(/Chrome\/([\d.]+)/) ||
      ua.match(/Version\/([\d.]+).*Safari/);
    if (m) {
      const name = ua.includes('Firefox')
        ? 'Firefox'
        : ua.includes('Edg/')
          ? 'Edge'
          : ua.includes('OPR/')
            ? 'Opera'
            : ua.includes('Chrome')
              ? 'Chrome'
              : 'Safari';
      info.browser = `${name} ${m[1]}`;
    }
  }
  if (!info.os) {
    if (ua.includes('iPhone') || ua.includes('iPad')) info.os = 'iOS';
    else if (ua.includes('Mac OS X')) info.os = 'macOS';
    else if (ua.includes('Windows')) info.os = 'Windows';
    else if (ua.includes('Android')) info.os = 'Android';
    else if (ua.includes('Linux')) info.os = 'Linux';
  }
  return info;
}
