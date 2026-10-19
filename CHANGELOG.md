# Changelog

## [1.0.0-beta.1] - 2026-10-19

### Added

- **React Native Components (`@tingee/sdk-ui-react-native`)**:
  - Cung cấp `<TingeeBankLinkModal />` và `<TingeeBankLinkView />` cho luồng Liên kết Ngân hàng (Bank Link).
  - Cung cấp `<TingeeCheckoutModal />` và `<TingeeCheckoutView />` cho luồng Cổng Thanh toán (Payment Gateway Checkout).
- **React Native Hooks**:
  - Cung cấp `useTingeeBankLink` và `useTingeeCheckout` hỗ trợ cả callback truyền thống (`open`) và Promise (`openAsync`).
- **Mobile WebView Bridge & Deep Link**:
  - Tự động tiêm JS Bridge bắt sự kiện `postMessage` từ `window.parent` / `window` trong WebView về React Native.
  - Tự động xử lý Deep Link mở ứng dụng ngân hàng (`Linking.openURL`) cho iOS & Android.
