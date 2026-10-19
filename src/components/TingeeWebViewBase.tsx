import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import {
  buildTingeeEmbedUrl,
  isExternalDeepLink,
  parseTingeeMessage,
  resolveBankLinkBaseUrl,
  resolveCheckoutBaseUrl,
  TINGEE_WEBVIEW_INJECTED_JS,
} from '../bridge';
import type {
  TingeeBankLinkModalProps,
  TingeeBankLinkSuccessPayload,
  TingeeBankLinkViewProps,
  TingeeCheckoutModalProps,
  TingeeCheckoutSuccessPayload,
  TingeeCheckoutViewProps,
  TingeeModalProps,
  TingeeViewProps,
} from '../types';

interface InternalViewProps<TSuccess> extends TingeeViewProps<TSuccess> {
  sdkType: 'bank-link' | 'checkout';
  mode: 'modal' | 'embed';
  onResultHandled?: () => void;
}

function TingeeBaseWebView<TSuccess = Record<string, unknown>>(
  props: InternalViewProps<TSuccess>
) {
  const {
    url,
    sdkType,
    mode,
    environment = 'prod',
    baseUrl,
    theme,
    enableDeepLink = true,
    style,
    showLoading = true,
    loadingColor = '#1E88E5',
    onSuccess,
    onFailed,
    onCancelled,
    onError,
    onClose,
    onResultHandled,
  } = props;

  const [isLoading, setIsLoading] = useState(true);
  const handledRef = useRef(false);

  const resolvedBaseUrl = useMemo(() => {
    return sdkType === 'bank-link'
      ? resolveBankLinkBaseUrl(environment, baseUrl)
      : resolveCheckoutBaseUrl(environment, baseUrl);
  }, [sdkType, environment, baseUrl]);

  const targetUrl = useMemo(() => {
    try {
      handledRef.current = false;
      return buildTingeeEmbedUrl(url, {
        baseUrl: resolvedBaseUrl,
        mode,
        theme,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      onError?.({
        status: 'error',
        code: 'INVALID_URL',
        message,
      });
      return '';
    }
  }, [url, resolvedBaseUrl, mode, theme, onError]);

  const handleMessage = useCallback(
    (event: { nativeEvent?: { data?: string } }) => {
      const parsed = parseTingeeMessage(event?.nativeEvent?.data);
      if (!parsed || handledRef.current) return;

      const status = String(parsed.__normalizedStatus || '');
      const cleanPayload = { ...parsed };
      delete cleanPayload.__normalizedStatus;

      if (status === 'success' || status === 'completed') {
        handledRef.current = true;
        onResultHandled?.();
        onSuccess?.({
          ...cleanPayload,
          status: 'success',
        } as unknown as TSuccess);
        onClose?.();
      } else if (status === 'failed' || status === 'error' || status === 'expired') {
        handledRef.current = true;
        onResultHandled?.();
        onFailed?.({
          status: 'failed',
          errorCode: String(cleanPayload.errorCode || cleanPayload.code || 'FAILED'),
          errorMessage: String(
            cleanPayload.errorMessage || cleanPayload.message || 'Giao dịch thất bại'
          ),
          ...cleanPayload,
        });
        onClose?.();
      } else if (
        status === 'cancelled' ||
        status === 'canceled' ||
        status === 'close' ||
        status === 'closed'
      ) {
        handledRef.current = true;
        onResultHandled?.();
        onCancelled?.({
          status: 'cancelled',
          errorCode: String(cleanPayload.errorCode || 'USER_CLOSED'),
          ...cleanPayload,
        });
        onClose?.();
      }
    },
    [onSuccess, onFailed, onCancelled, onClose, onResultHandled]
  );

  const handleShouldStartLoad = useCallback(
    (request: { url?: string }) => {
      const reqUrl = request?.url || '';
      if (!reqUrl) return true;

      if (enableDeepLink && isExternalDeepLink(reqUrl)) {
        Linking.openURL(reqUrl).catch(() => {
          // Ignore if device doesn't have the target banking app installed
        });
        return false;
      }
      return true;
    },
    [enableDeepLink]
  );

  if (!targetUrl) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        source={{ uri: targetUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={false}
        bounces={false}
        setBuiltInZoomControls={false}
        setDisplayZoomControls={false}
        originWhitelist={['*']}
        injectedJavaScriptBeforeContentLoaded={TINGEE_WEBVIEW_INJECTED_JS}
        injectedJavaScript={TINGEE_WEBVIEW_INJECTED_JS}
        onMessage={handleMessage}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={(syntheticEvent: { nativeEvent?: { description?: string } }) => {
          setIsLoading(false);
          onError?.({
            status: 'error',
            code: 'WEBVIEW_LOAD_ERROR',
            message:
              syntheticEvent?.nativeEvent?.description ||
              'Không thể tải giao diện Tingee SDK.',
          });
        }}
      />
      {showLoading && isLoading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={loadingColor} />
        </View>
      )}
    </View>
  );
}

function TingeeBaseModal<TSuccess = Record<string, unknown>>(
  props: TingeeModalProps<TSuccess> & { sdkType: 'bank-link' | 'checkout' }
) {
  const {
    visible,
    title,
    showHeader = true,
    animationType = 'slide',
    closeOnBackButton = true,
    onCancelled,
    onClose,
    sdkType,
    ...viewProps
  } = props;

  const handleUserCancel = useCallback(() => {
    onCancelled?.({
      status: 'cancelled',
      errorCode: 'USER_CLOSED',
    });
    onClose?.();
  }, [onCancelled, onClose]);

  const defaultTitle =
    title ?? (sdkType === 'bank-link' ? 'Liên kết ngân hàng' : 'Thanh toán Tingee');

  return (
    <Modal
      visible={visible}
      animationType={animationType}
      transparent={false}
      onRequestClose={() => {
        if (closeOnBackButton) {
          handleUserCancel();
        }
      }}
    >
      <SafeAreaView style={styles.modalSafeArea}>
        {showHeader && (
          <View style={styles.header}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {defaultTitle}
            </Text>
            <TouchableOpacity
              onPress={handleUserCancel}
              style={styles.closeButton}
              accessibilityLabel="Đóng"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.modalBody}>
          {visible && Boolean(viewProps.url) && (
            <TingeeBaseWebView<TSuccess>
              {...viewProps}
              sdkType={sdkType}
              mode="modal"
              onCancelled={onCancelled}
              onClose={onClose}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

/**
 * Component nhúng trực tiếp giao diện Liên kết Ngân hàng (Bank Link) vào màn hình React Native
 */
export const TingeeBankLinkView: React.FC<TingeeBankLinkViewProps> = (props) => (
  <TingeeBaseWebView<TingeeBankLinkSuccessPayload>
    {...props}
    sdkType="bank-link"
    mode="embed"
  />
);

/**
 * Component mở Popup Modal Liên kết Ngân hàng (Bank Link) trên React Native
 */
export const TingeeBankLinkModal: React.FC<TingeeBankLinkModalProps> = (props) => (
  <TingeeBaseModal<TingeeBankLinkSuccessPayload> {...props} sdkType="bank-link" />
);

/**
 * Component nhúng trực tiếp giao diện Cổng Thanh toán (Checkout) vào màn hình React Native
 */
export const TingeeCheckoutView: React.FC<TingeeCheckoutViewProps> = (props) => (
  <TingeeBaseWebView<TingeeCheckoutSuccessPayload>
    {...props}
    sdkType="checkout"
    mode="embed"
  />
);

/**
 * Component mở Popup Modal Cổng Thanh toán (Checkout) trên React Native
 */
export const TingeeCheckoutModal: React.FC<TingeeCheckoutModalProps> = (props) => (
  <TingeeBaseModal<TingeeCheckoutSuccessPayload> {...props} sdkType="checkout" />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  modalBody: {
    flex: 1,
  },
});
