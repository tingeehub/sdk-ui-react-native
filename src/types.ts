import type React from 'react';

export type TingeeEnvironment = 'prod' | 'uat';

export interface TingeeThemeConfig {
  primaryColor?: string;
  [key: string]: unknown;
}

export type TingeeTheme = string | TingeeThemeConfig | null;

export interface TingeeBankLinkSuccessPayload {
  status: 'success';
  bankName?: string;
  merchantAccountNumberId?: number | string;
  vaAccountNumber?: string;
  shopId?: number | string;
  [key: string]: unknown;
}

export interface TingeeCheckoutSuccessPayload {
  status: 'success';
  orderCode?: string;
  transactionId?: string | number;
  amount?: number;
  bankName?: string;
  [key: string]: unknown;
}

export interface TingeeFailedPayload {
  status: 'failed';
  errorCode?: string;
  errorMessage?: string;
  [key: string]: unknown;
}

export interface TingeeCancelledPayload {
  status: 'cancelled';
  errorCode?: string;
  errorMessage?: string;
  [key: string]: unknown;
}

export interface TingeeErrorPayload {
  status: 'error';
  code?: string;
  message: string;
}

export type TingeeResultPayload<TSuccess = TingeeBankLinkSuccessPayload> =
  | TSuccess
  | TingeeFailedPayload
  | TingeeCancelledPayload
  | TingeeErrorPayload;

export interface TingeeCallbacks<TSuccess = Record<string, unknown>> {
  onSuccess?: (data: TSuccess) => void;
  onFailed?: (error: TingeeFailedPayload) => void;
  onCancelled?: (data: TingeeCancelledPayload) => void;
  onError?: (error: TingeeErrorPayload) => void;
  onClose?: () => void;
}

export interface TingeeBaseConfig<TSuccess = Record<string, unknown>>
  extends TingeeCallbacks<TSuccess> {
  /**
   * Môi trường tích hợp ('prod' | 'uat'). Mặc định: 'prod'
   */
  environment?: TingeeEnvironment;
  /**
   * Base URL tùy chỉnh nếu không dùng mặc định theo environment
   */
  baseUrl?: string;
  /**
   * Cấu hình giao diện / màu sắc chủ đạo (ví dụ: { primaryColor: '#1E88E5' })
   */
  theme?: TingeeTheme;
  /**
   * Tự động mở các liên kết ngoài / Deep Link app ngân hàng qua Linking.openURL. Mặc định: true
   */
  enableDeepLink?: boolean;
}

export interface TingeeViewProps<TSuccess = Record<string, unknown>>
  extends TingeeBaseConfig<TSuccess> {
  /**
   * Đường dẫn session URL trả về từ API Backend của bạn
   */
  url: string;
  /**
   * Style cho container bọc ngoài WebView
   */
  style?: Record<string, unknown>;
  /**
   * Hiển thị loading spinner khi trang đang tải. Mặc định: true
   */
  showLoading?: boolean;
  /**
   * Màu của loading indicator. Mặc định: '#1E88E5'
   */
  loadingColor?: string;
}

export interface TingeeModalProps<TSuccess = Record<string, unknown>>
  extends TingeeViewProps<TSuccess> {
  /**
   * Trạng thái hiển thị của Modal
   */
  visible: boolean;
  /**
   * Tiêu đề hiển thị trên thanh Header của Modal (nếu truyền showHeader = true)
   */
  title?: string;
  /**
   * Hiển thị thanh Header kèm nút Đóng (X) phía trên Modal. Mặc định: true
   */
  showHeader?: boolean;
  /**
   * Hiệu ứng mở Modal ('slide' | 'fade' | 'none'). Mặc định: 'slide'
   */
  animationType?: 'slide' | 'fade' | 'none';
  /**
   * Cho phép đóng Modal khi nhấn nút Back cứng trên Android. Mặc định: true
   */
  closeOnBackButton?: boolean;
  /**
   * Tự động đóng Modal khi nhận được kết quả (onSuccess / onFailed / onCancelled). Mặc định: true
   */
  autoCloseOnResult?: boolean;
}

export type TingeeBankLinkViewProps = TingeeViewProps<TingeeBankLinkSuccessPayload>;
export type TingeeBankLinkModalProps = TingeeModalProps<TingeeBankLinkSuccessPayload>;

export type TingeeCheckoutViewProps = TingeeViewProps<TingeeCheckoutSuccessPayload>;
export type TingeeCheckoutModalProps = TingeeModalProps<TingeeCheckoutSuccessPayload>;

export interface UseTingeeReturn<TSuccess = Record<string, unknown>> {
  /**
   * Trạng thái Modal đang mở hay đóng
   */
  visible: boolean;
  /**
   * Alias của visible (đồng bộ với Web SDK)
   */
  isOpen: boolean;
  /**
   * Session URL hiện tại đang mở
   */
  url: string;
  /**
   * Mở Modal với session URL
   */
  open: (url: string, overrides?: Partial<TingeeBaseConfig<TSuccess>>) => void;
  /**
   * Mở Modal và trả về Promise kết quả
   */
  openAsync: (
    url: string,
    overrides?: Partial<TingeeBaseConfig<TSuccess>>
  ) => Promise<TingeeResultPayload<TSuccess>>;
  /**
   * Đóng Modal chủ động
   */
  close: () => void;
  /**
   * Props truyền trực tiếp vào <TingeeBankLinkModal {...modalProps} /> hoặc <TingeeCheckoutModal {...modalProps} />
   */
  modalProps: TingeeModalProps<TSuccess>;
}

export type TingeeBankLinkComponent = React.FC<TingeeBankLinkViewProps>;
export type TingeeBankLinkModalComponent = React.FC<TingeeBankLinkModalProps>;
export type TingeeCheckoutComponent = React.FC<TingeeCheckoutViewProps>;
export type TingeeCheckoutModalComponent = React.FC<TingeeCheckoutModalProps>;
