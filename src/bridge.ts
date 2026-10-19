import type { TingeeEnvironment, TingeeTheme } from './types';

export const BANK_LINK_URLS: Record<TingeeEnvironment, string> = {
  prod: 'https://bank-link.tingee.vn',
  uat: 'https://uat-bank-link.tingee.vn',
};

export const CHECKOUT_URLS: Record<TingeeEnvironment, string> = {
  prod: 'https://pay.tingee.vn',
  uat: 'https://uat-pay.tingee.vn',
};

export function resolveBankLinkBaseUrl(
  env: TingeeEnvironment = 'prod',
  customBaseUrl?: string
): string {
  if (customBaseUrl && customBaseUrl.trim()) {
    return customBaseUrl.trim().replace(/\/+$/, '');
  }
  return BANK_LINK_URLS[env] || BANK_LINK_URLS.prod;
}

export function resolveCheckoutBaseUrl(
  env: TingeeEnvironment = 'prod',
  customBaseUrl?: string
): string {
  if (customBaseUrl && customBaseUrl.trim()) {
    return customBaseUrl.trim().replace(/\/+$/, '');
  }
  return CHECKOUT_URLS[env] || CHECKOUT_URLS.prod;
}

export interface BuildEmbedUrlOptions {
  baseUrl: string;
  mode?: 'modal' | 'embed';
  theme?: TingeeTheme;
}

export function buildTingeeEmbedUrl(
  rawUrl: string,
  options: BuildEmbedUrlOptions
): string {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    throw new Error('[Tingee SDK] URL không được để trống.');
  }

  const trimmed = rawUrl.trim();
  const fullUrl = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `${options.baseUrl.replace(/\/+$/, '')}/${trimmed.replace(/^\/+/, '')}`;

  let parsed: URL;
  try {
    parsed = new URL(fullUrl);
  } catch {
    throw new Error(`[Tingee SDK] URL không hợp lệ: ${rawUrl}`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`[Tingee SDK] Giao thức không hợp lệ: ${parsed.protocol}`);
  }

  parsed.searchParams.set('mode', options.mode || 'modal');

  if (options.theme) {
    if (typeof options.theme === 'string') {
      parsed.searchParams.set('theme', options.theme);
    } else if (typeof options.theme === 'object') {
      if (typeof options.theme.primaryColor === 'string' && options.theme.primaryColor) {
        parsed.searchParams.set('primaryColor', options.theme.primaryColor);
      }
      try {
        parsed.searchParams.set('theme', JSON.stringify(options.theme));
      } catch {
        // Ignore circular references
      }
    }
  }

  return parsed.toString();
}

/**
 * Kiểm tra xem URL điều hướng có phải là Deep Link mở ứng dụng ngân hàng / bên ngoài không
 */
export function isExternalDeepLink(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('about:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return false;
  }
  return /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
}

/**
 * Script tiêm vào React Native WebView để tự động chuyển tiếp mọi sự kiện
 * `window.parent.postMessage`, `window.opener.postMessage` và `window.postMessage`
 * từ trang Tingee về `window.ReactNativeWebView.postMessage`.
 */
export const TINGEE_WEBVIEW_INJECTED_JS = `
(function() {
  if (window.__tingeeRNBridgeInstalled) return true;
  window.__tingeeRNBridgeInstalled = true;

  var lastPayload = '';
  var lastTime = 0;

  function replyTingeeConfig() {
    try {
      var params = new URLSearchParams(window.location.search);
      var rawTheme = params.get('theme');
      var parsedTheme = null;
      if (rawTheme) {
        try {
          parsedTheme = JSON.parse(rawTheme);
        } catch (e) {
          parsedTheme = rawTheme;
        }
      }
      window.postMessage({
        type: 'TINGEE_CONFIG',
        payload: {
          displayMode: 'mobile',
          isDesktopParent: false,
          isMobileParent: true,
          parentViewport: {
            width: window.innerWidth || 375,
            height: window.innerHeight || 812
          },
          immediateResult: false,
          isEmbedded: true,
          theme: parsedTheme
        }
      }, '*');
    } catch (e) {}
  }

  function forwardToNative(data) {
    try {
      if (!data) return;
      var parsed = typeof data === 'string' ? JSON.parse(data) : data;
      if (!parsed || typeof parsed !== 'object') return;

      if (parsed.type === 'TINGEE_READY') {
        replyTingeeConfig();
        return;
      }
      if (parsed.type === 'TINGEE_CONFIG') return;

      if (!parsed.status && !parsed.type && !parsed.action && !parsed.event) return;

      var serialized = JSON.stringify(parsed);
      var now = Date.now();
      if (serialized === lastPayload && now - lastTime < 300) return;
      lastPayload = serialized;
      lastTime = now;

      if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
        window.ReactNativeWebView.postMessage(serialized);
      }
    } catch (err) {}
  }

  window.addEventListener('message', function(event) {
    if (event && event.data) {
      forwardToNative(event.data);
    }
  });

  try {
    var bridgeTarget = {
      postMessage: function(data) {
        forwardToNative(data);
      }
    };
    Object.defineProperty(window, 'parent', {
      get: function() { return bridgeTarget; },
      configurable: true
    });
    if (!window.opener) {
      Object.defineProperty(window, 'opener', {
        get: function() { return bridgeTarget; },
        configurable: true
      });
    }
  } catch (e) {}

  function disableIosInputZoom() {
    try {
      var doc = document;
      if (!doc || !doc.head) return;

      var viewportContent = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no';
      var meta = doc.querySelector('meta[name="viewport"]');
      if (meta) {
        if (meta.getAttribute('content') !== viewportContent) {
          meta.setAttribute('content', viewportContent);
        }
      } else {
        meta = doc.createElement('meta');
        meta.name = 'viewport';
        meta.content = viewportContent;
        doc.head.appendChild(meta);
      }

      if (!doc.getElementById('__tingee_ios_no_zoom_style')) {
        var style = doc.createElement('style');
        style.id = '__tingee_ios_no_zoom_style';
        style.innerHTML = 'input, select, textarea { font-size: 16px !important; -webkit-text-size-adjust: 100%; }';
        doc.head.appendChild(style);
      }
    } catch (e) {}
  }

  disableIosInputZoom();
  document.addEventListener('DOMContentLoaded', disableIosInputZoom);
  window.addEventListener('load', disableIosInputZoom);
  document.addEventListener('focusin', disableIosInputZoom, true);
  document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
  }, { passive: false });
})();
true;
`;

export function parseTingeeMessage(rawData: unknown): Record<string, unknown> | null {
  if (!rawData) return null;
  let data: unknown = rawData;

  if (typeof rawData === 'string') {
    const trimmed = rawData.trim();
    if (!trimmed.startsWith('{')) return null;
    try {
      data = JSON.parse(trimmed);
    } catch {
      return null;
    }
  }

  if (!data || typeof data !== 'object') return null;
  let record = data as Record<string, unknown>;

  if (
    (record.type === 'TINGEE_BANK_LINK_RESULT' ||
      record.type === 'TINGEE_PAYMENT_RESULT') &&
    record.data &&
    typeof record.data === 'object'
  ) {
    const innerData = record.data as Record<string, unknown>;
    if (innerData.action === 'account-config-register') {
      return null;
    }
    record = innerData;
  }

  const rawStatus = String(
    record.status || record.event || record.action || ''
  ).toLowerCase();

  if (!rawStatus) return null;
  return {
    ...record,
    __normalizedStatus: rawStatus,
  };
}
