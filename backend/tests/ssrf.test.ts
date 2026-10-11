import { describe, it, expect } from 'vitest';
import { validateOutboundUrl } from '../src/utils/ssrf';

describe('SSRF Protection', () => {
  it('blocks dangerous schemes like file, ftp, javascript', async () => {
    await expect(validateOutboundUrl('file:///etc/passwd')).rejects.toThrow();
    await expect(validateOutboundUrl('ftp://example.com/file')).rejects.toThrow();
    await expect(validateOutboundUrl('javascript:alert(1)')).rejects.toThrow();
  });

  it('blocks loopback IP addresses', async () => {
    await expect(validateOutboundUrl('http://127.0.0.1')).rejects.toThrow('Destination IP address is not allowed');
    await expect(validateOutboundUrl('http://127.0.1.10')).rejects.toThrow('Destination IP address is not allowed');
    await expect(validateOutboundUrl('http://localhost:3000')).rejects.toThrow();
  });

  it('blocks private IPv4 RFC 1918 addresses', async () => {
    await expect(validateOutboundUrl('http://10.0.0.1')).rejects.toThrow('Destination IP address is not allowed');
    await expect(validateOutboundUrl('http://172.16.0.1')).rejects.toThrow('Destination IP address is not allowed');
    await expect(validateOutboundUrl('http://192.168.1.1')).rejects.toThrow('Destination IP address is not allowed');
  });

  it('blocks cloud metadata endpoints', async () => {
    await expect(validateOutboundUrl('http://169.254.169.254/latest/meta-data')).rejects.toThrow();
    await expect(validateOutboundUrl('http://metadata.google.internal')).rejects.toThrow();
  });

  it('allows safe public URLs', async () => {
    // DNS check for public domains
    await expect(validateOutboundUrl('https://httpbin.org/get')).resolves.toBeUndefined();
    await expect(validateOutboundUrl('https://api.github.com')).resolves.toBeUndefined();
  });
});
