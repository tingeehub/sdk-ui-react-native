import { describe, expect, it } from 'vitest';
import {
  buildTingeeEmbedUrl,
  isExternalDeepLink,
  parseTingeeMessage,
  resolveBankLinkBaseUrl,
  resolveCheckoutBaseUrl,
} from '../src/bridge';

describe('@tingee/sdk-ui-react-native bridge & URL utilities', () => {
  it('resolves Bank Link & Checkout base URLs for prod and uat', () => {
    expect(resolveBankLinkBaseUrl('prod')).toBe('https://bank-link.tingee.vn');
    expect(resolveBankLinkBaseUrl('uat')).toBe('https://uat-bank-link.tingee.vn');
    expect(resolveCheckoutBaseUrl('prod')).toBe('https://pay.tingee.vn');
    expect(resolveCheckoutBaseUrl('uat')).toBe('https://uat-pay.tingee.vn');
  });

  it('builds embed/modal URL with theme and primaryColor parameters', () => {
    const url = buildTingeeEmbedUrl('https://bank-link.tingee.vn?token=abc123', {
      baseUrl: 'https://bank-link.tingee.vn',
      mode: 'modal',
      theme: { primaryColor: '#1E88E5' },
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('token')).toBe('abc123');
    expect(parsed.searchParams.get('mode')).toBe('modal');
    expect(parsed.searchParams.get('primaryColor')).toBe('#1E88E5');
  });

  it('detects external deep links for banking apps and ignores http/https', () => {
    expect(isExternalDeepLink('https://bank-link.tingee.vn?token=123')).toBe(false);
    expect(isExternalDeepLink('http://localhost:3000')).toBe(false);
    expect(isExternalDeepLink('bidvsmartbanking://pay?qr=123')).toBe(true);
    expect(isExternalDeepLink('vcbdigibank://open')).toBe(true);
    expect(isExternalDeepLink('intent://pay#Intent;scheme=vietqr;end')).toBe(true);
  });

  it('parses postMessage JSON payloads from Tingee WebView', () => {
    const raw = JSON.stringify({
      status: 'success',
      bankName: 'BIDV',
      vaAccountNumber: '99887766',
      shopId: 123,
    });
    const parsed = parseTingeeMessage(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.__normalizedStatus).toBe('success');
    expect(parsed?.bankName).toBe('BIDV');
    expect(parsed?.vaAccountNumber).toBe('99887766');
  });
});
