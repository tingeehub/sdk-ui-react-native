# Changelog

## [1.0.1] - 2026-11-13

### Fixed

- Quét QR bằng camera trong giao diện Liên kết ngân hàng không hiển thị / không phát được trên iOS: WebView bật mặc định `allowsInlineMediaPlayback`, `mediaPlaybackRequiresUserAction={false}` và `mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"` (có thể ghi đè qua `webViewProps`).

### Docs

- Bổ sung hướng dẫn khai báo quyền Camera & Thư viện ảnh cho iOS, Android và Expo.

## [1.0.0] - 2026-11-10

Bản phát hành chính thức (stable) đầu tiên.

### Added

- **Tùy biến giao diện nâng cao**:
  - `theme` hỗ trợ thêm `primaryHoverColor`, `primarySoftColor` và biến CSS tùy ý dạng `'--*'`.
  - Prop `customCss`: tiêm CSS tùy chỉnh sâu (`<style>`) vào WebView.
  - Prop `injectedJavaScript`: thực thi JavaScript tùy chỉnh trong WebView sau khi tải trang.
  - Prop `webViewProps`: truyền props bổ sung xuống `<WebView />` của `react-native-webview`.
- Export hàm tiện ích `buildTingeeInjectedJs`.
- Hook `open(url, options)` / `openAsync(url, options)` hỗ trợ truyền cấu hình động (theme, customCss, injectedJavaScript) ở mỗi lần mở.

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
