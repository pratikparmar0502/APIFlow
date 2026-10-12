import { Address4, Address6 } from 'ip-address';
import dns from 'dns/promises';

const BLOCKED_SCHEMES = new Set(['file', 'ftp', 'data', 'javascript', 'vbscript']);

// RFC 1918 private ranges + special ranges
const PRIVATE_RANGES_V4 = [
  { start: '10.0.0.0', end: '10.255.255.255' },
  { start: '172.16.0.0', end: '172.31.255.255' },
  { start: '192.168.0.0', end: '192.168.255.255' },
  { start: '127.0.0.0', end: '127.255.255.255' },
  { start: '169.254.0.0', end: '169.254.255.255' }, // link-local
  { start: '0.0.0.0', end: '0.255.255.255' },
  { start: '100.64.0.0', end: '100.127.255.255' }, // CGNAT
  { start: '192.0.0.0', end: '192.0.255.255' },
  { start: '192.0.2.0', end: '192.0.2.255' },
  { start: '192.88.99.0', end: '192.88.99.255' },
  { start: '198.18.0.0', end: '198.19.255.255' },
  { start: '198.51.100.0', end: '198.51.100.255' },
  { start: '203.0.113.0', end: '203.0.113.255' },
  { start: '240.0.0.0', end: '255.255.255.255' },
];

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  '169.254.169.254', // AWS/GCP metadata
  'metadata.azure.com',
]);

const CLOUD_METADATA_DOMAINS = [
  'metadata.google.internal',
  'metadata.azure.com',
  'instance-data',
];

function ipv4ToBigInt(ip: string): bigint {
  try {
    const addr = new Address4(ip);
    return addr.bigInt();
  } catch {
    return -1n;
  }
}

function isPrivateIPv4(ip: string): boolean {
  const num = ipv4ToBigInt(ip);
  if (num === -1n) return true; // parse failure = block
  
  for (const range of PRIVATE_RANGES_V4) {
    const start = ipv4ToBigInt(range.start);
    const end = ipv4ToBigInt(range.end);
    if (num >= start && num <= end) return true;
  }
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  try {
    const addr = new Address6(ip);
    // Block loopback (::1), link-local (fe80::/10), private (fc00::/7), unspecified (::)
    if (addr.isLoopback()) return true;
    if (addr.isLinkLocal()) return true;
    // fc00::/7 - unique local
    const bigInt = addr.bigInt();
    const fc00 = new Address6('fc00::').bigInt();
    const fe00 = new Address6('fe00::').bigInt();
    if (bigInt >= fc00 && bigInt < fe00) return true;
    // Check IPv4-mapped IPv6
    if (addr.is4()) {
      const v4 = addr.to4();
      if (v4) return isPrivateIPv4(v4.correctForm());
    }
    return false;
  } catch {
    return true; // parse failure = block
  }
}

export async function validateOutboundUrl(urlString: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new Error(`Invalid URL: ${urlString}`);
  }

  const scheme = parsed.protocol.replace(':', '').toLowerCase();
  if (BLOCKED_SCHEMES.has(scheme)) {
    throw new Error(`URL scheme "${scheme}" is not allowed`);
  }
  if (scheme !== 'http' && scheme !== 'https') {
    throw new Error(`Only http and https schemes are supported`);
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block known dangerous hostnames
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new Error(`Destination host "${hostname}" is not allowed`);
  }

  // Block cloud metadata domains
  for (const domain of CLOUD_METADATA_DOMAINS) {
    if (hostname === domain || hostname.endsWith('.' + domain)) {
      throw new Error(`Cloud metadata endpoint is not allowed`);
    }
  }

  // If the hostname is already an IP, validate it directly
  if (Address4.isValid(hostname)) {
    if (isPrivateIPv4(hostname)) {
      throw new Error(`Destination IP address is not allowed`);
    }
    return;
  }

  // Detect and reject hex or octal IP obfuscation attempts (e.g. 0x7f.1, 0177.0.0.1, integer IP)
  if (/^0x[0-9a-fA-F]+(\.[0-9a-fA-FxX]+)*$/i.test(hostname) || /^\d+$/.test(hostname)) {
    throw new Error(`Obfuscated IP formats are not allowed`);
  }

  // IPv6 in brackets
  const ipv6Host = hostname.startsWith('[') ? hostname.slice(1, -1) : hostname;
  if (Address6.isValid(ipv6Host)) {
    if (isPrivateIPv6(ipv6Host)) {
      throw new Error(`Destination IPv6 address is not allowed`);
    }
    return;
  }

  // DNS resolution check: resolve all A and AAAA records and block if any resolved address is private
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      throw new Error(`Cannot resolve hostname: ${hostname}`);
    }
    for (const addr of addresses) {
      if (addr.family === 4 && isPrivateIPv4(addr.address)) {
        throw new Error(`DNS resolved to a private IP address: ${addr.address}`);
      }
      if (addr.family === 6 && isPrivateIPv6(addr.address)) {
        throw new Error(`DNS resolved to a private IPv6 address: ${addr.address}`);
      }
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('DNS resolved')) throw e;
    // DNS failure: fail closed
    throw new Error(`Cannot resolve hostname: ${hostname}`);
  }
}
