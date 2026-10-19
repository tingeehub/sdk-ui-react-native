import { useCallback, useMemo, useRef, useState } from 'react';
import type {
  TingeeBankLinkSuccessPayload,
  TingeeBaseConfig,
  TingeeCancelledPayload,
  TingeeCheckoutSuccessPayload,
  TingeeErrorPayload,
  TingeeFailedPayload,
  TingeeModalProps,
  TingeeResultPayload,
  UseTingeeReturn,
} from '../types';

function useTingeeController<TSuccess = Record<string, unknown>>(
  defaultOptions?: TingeeBaseConfig<TSuccess>
): UseTingeeReturn<TSuccess> {
  const [visible, setVisible] = useState(false);
  const [url, setUrl] = useState('');
  const [overrides, setOverrides] = useState<
    Partial<TingeeBaseConfig<TSuccess>> | undefined
  >(undefined);

  const pendingResolverRef = useRef<
    ((res: TingeeResultPayload<TSuccess>) => void) | null
  >(null);

  const close = useCallback(() => {
    setVisible(false);
  }, []);

  const open = useCallback(
    (sessionUrl: string, callOverrides?: Partial<TingeeBaseConfig<TSuccess>>) => {
      setOverrides(callOverrides);
      setUrl(sessionUrl);
      setVisible(true);
    },
    []
  );

  const openAsync = useCallback(
    (
      sessionUrl: string,
      callOverrides?: Partial<TingeeBaseConfig<TSuccess>>
    ): Promise<TingeeResultPayload<TSuccess>> => {
      return new Promise((resolve) => {
        pendingResolverRef.current = resolve;
        open(sessionUrl, callOverrides);
      });
    },
    [open]
  );

  const mergedConfig = useMemo(
    () => ({
      ...defaultOptions,
      ...overrides,
    }),
    [defaultOptions, overrides]
  );

  const modalProps: TingeeModalProps<TSuccess> = useMemo(
    () => ({
      ...mergedConfig,
      visible,
      url,
      onSuccess: (data: TSuccess) => {
        setVisible(false);
        mergedConfig.onSuccess?.(data);
        if (pendingResolverRef.current) {
          pendingResolverRef.current(data);
          pendingResolverRef.current = null;
        }
      },
      onFailed: (err: TingeeFailedPayload) => {
        setVisible(false);
        mergedConfig.onFailed?.(err);
        if (pendingResolverRef.current) {
          pendingResolverRef.current(err);
          pendingResolverRef.current = null;
        }
      },
      onCancelled: (data: TingeeCancelledPayload) => {
        setVisible(false);
        mergedConfig.onCancelled?.(data);
        if (pendingResolverRef.current) {
          pendingResolverRef.current(data);
          pendingResolverRef.current = null;
        }
      },
      onError: (err: TingeeErrorPayload) => {
        mergedConfig.onError?.(err);
        if (pendingResolverRef.current) {
          pendingResolverRef.current(err);
          pendingResolverRef.current = null;
        }
      },
      onClose: () => {
        setVisible(false);
        mergedConfig.onClose?.();
      },
    }),
    [mergedConfig, visible, url]
  );

  return {
    visible,
    isOpen: visible,
    url,
    open,
    openAsync,
    close,
    modalProps,
  };
}

/**
 * React Native Hook tích hợp Tingee Bank Link (Liên kết ngân hàng)
 */
export function useTingeeBankLink(
  options?: TingeeBaseConfig<TingeeBankLinkSuccessPayload>
): UseTingeeReturn<TingeeBankLinkSuccessPayload> {
  return useTingeeController<TingeeBankLinkSuccessPayload>(options);
}

/**
 * React Native Hook tích hợp Tingee Payment Gateway Checkout (Cổng thanh toán)
 */
export function useTingeeCheckout(
  options?: TingeeBaseConfig<TingeeCheckoutSuccessPayload>
): UseTingeeReturn<TingeeCheckoutSuccessPayload> {
  return useTingeeController<TingeeCheckoutSuccessPayload>(options);
}
