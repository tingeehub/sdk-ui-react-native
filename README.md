# @tingee/sdk-ui-react-native

Bộ thư viện **Tingee UI SDK** chính thức dành cho **React Native & Expo (iOS / Android)** — giúp tích hợp nhanh giao diện **Liên kết ngân hàng (Bank Link)** và **Cổng thanh toán (Payment Gateway Checkout)** của Tingee ngay trong ứng dụng di động.

📖 **Tài liệu đầy đủ:** [developers.tingee.vn](https://developers.tingee.vn)

---

## Cài đặt

Cài đặt `@tingee/sdk-ui-react-native` cùng với `react-native-webview`:

```bash
npm install @tingee/sdk-ui-react-native react-native-webview
# hoặc dùng yarn / pnpm
yarn add @tingee/sdk-ui-react-native react-native-webview
pnpm add @tingee/sdk-ui-react-native react-native-webview
```

Nếu sử dụng **Expo**:
```bash
npx expo install @tingee/sdk-ui-react-native react-native-webview
```

Nếu sử dụng **React Native CLI (iOS)**, chạy thêm:
```bash
cd ios && pod install
```

---

## Tính năng nổi bật

- **Hỗ trợ cả 2 dịch vụ**: Liên kết ngân hàng (`TingeeBankLinkModal`, `TingeeBankLinkView`, `useTingeeBankLink`) và Cổng thanh toán (`TingeeCheckoutModal`, `TingeeCheckoutView`, `useTingeeCheckout`).
- **Tự động kết nối JS Bridge**: Tự động bắt mọi sự kiện `postMessage` từ giao diện Tingee Web và chuyển thẳng về callback `onSuccess`, `onFailed`, `onCancelled` của React Native.
- **Tự động hỗ trợ Deep Link App Ngân hàng**: Tự động nhận diện và chuyển tiếp các scheme mở ứng dụng ngân hàng (`bidvsmartbanking://`, `vcbdigibank://`, `intent://`, `vietqr://`, ...) qua `Linking.openURL`.
- **Hỗ trợ `async/await` (`openAsync`)**: Mở cửa sổ giao dịch và nhận kết quả trả về qua `Promise`.

---

## 1. Tích hợp Liên kết Ngân hàng (Bank Link)

Trước khi mở giao diện trên Mobile App, Backend của bạn cần gọi API [Tạo phiên liên kết (`/v1/create-bank-link-session`)](https://developers.tingee.vn/docs/bank-link/create-session) để lấy đường dẫn `url`.

### 1.1. Mở dạng Popup Modal với Hook `useTingeeBankLink`

```tsx
import React from 'react';
import { Button, View } from 'react-native';
import {
  useTingeeBankLink,
  TingeeBankLinkModal,
} from '@tingee/sdk-ui-react-native';

export default function BankLinkScreen() {
  const bankLink = useTingeeBankLink({
    environment: 'prod', // 'prod' | 'uat'
    theme: { primaryColor: '#1E88E5' },
    onSuccess: (data) => {
      console.log('Liên kết thành công:', data);
      // { status: 'success', bankName: 'BIDV', merchantAccountNumberId: 456, vaAccountNumber: '1234567890', shopId: 123 }
    },
    onFailed: (err) => {
      console.error('Liên kết thất bại:', err.errorCode, err.errorMessage);
    },
    onCancelled: () => {
      console.log('Khách hàng đã đóng cửa sổ');
    },
  });

  const handleStartLink = async () => {
    const res = await fetch('https://your-backend.com/api/bank-link/session', {
      method: 'POST',
    });
    const { url } = await res.json();

    bankLink.open(url);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
      <Button
        title="Liên kết tài khoản ngân hàng"
        onPress={handleStartLink}
        disabled={bankLink.isOpen}
      />

      <TingeeBankLinkModal
        {...bankLink.modalProps}
        title="Liên kết ngân hàng"
      />
    </View>
  );
}
```

### 1.2. Sử dụng với `async/await` (`openAsync`)

```tsx
const bankLink = useTingeeBankLink();

const handleStartLink = async () => {
  const res = await fetch('https://your-backend.com/api/bank-link/session', {
    method: 'POST',
  });
  const { url } = await res.json();

  const result = await bankLink.openAsync(url);
  if (result.status === 'success') {
    console.log('Số tài khoản VA:', result.vaAccountNumber);
  }
};
```

### 1.3. Nhúng trực tiếp vào màn hình (`<TingeeBankLinkView />`)

```tsx
import React from 'react';
import { View } from 'react-native';
import { TingeeBankLinkView } from '@tingee/sdk-ui-react-native';

export function BankLinkEmbeddedScreen({ sessionUrl }: { sessionUrl: string }) {
  return (
    <View style={{ flex: 1 }}>
      <TingeeBankLinkView
        url={sessionUrl}
        theme={{ primaryColor: '#1E88E5' }}
        onSuccess={(data) => console.log('Thành công:', data)}
        onFailed={(err) => console.error('Thất bại:', err.errorMessage)}
        onCancelled={() => console.log('Đã hủy')}
      />
    </View>
  );
}
```

---

## 2. Tích hợp Cổng Thanh toán (Payment Gateway Checkout)

Trước khi mở giao diện thanh toán, Backend của bạn gọi API [Tạo link thanh toán](https://developers.tingee.vn/docs/payment-gateway/create-payment-link) để lấy `checkoutUrl`.

```tsx
import React from 'react';
import { Button, View } from 'react-native';
import {
  useTingeeCheckout,
  TingeeCheckoutModal,
} from '@tingee/sdk-ui-react-native';

export default function CheckoutScreen() {
  const checkout = useTingeeCheckout({
    environment: 'prod',
    onSuccess: (data) => {
      console.log('Thanh toán thành công:', data);
    },
    onFailed: (err) => {
      console.error('Thanh toán thất bại:', err.errorMessage);
    },
    onCancelled: () => {
      console.log('Khách hàng hủy thanh toán');
    },
  });

  const handlePay = async () => {
    const res = await fetch('https://your-backend.com/api/create-payment', {
      method: 'POST',
    });
    const { checkoutUrl } = await res.json();

    checkout.open(checkoutUrl);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
      <Button title="Thanh toán ngay" onPress={handlePay} />
      <TingeeCheckoutModal {...checkout.modalProps} title="Thanh toán Tingee" />
    </View>
  );
}
```

---

## 3. Danh sách Props & Cấu hình

| Prop | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- |
| `url` | `string` | *(bắt buộc)* | Đường dẫn session URL nhận từ API Backend. |
| `visible` | `boolean` | `false` | *(Chỉ cho Modal)* Điều khiển hiển thị đóng/mở Modal. |
| `environment` | `'prod' \| 'uat'` | `'prod'` | Môi trường tích hợp (`'uat'` cho Sandbox, `'prod'` cho Production). |
| `theme` | `string \| { primaryColor?: string }` | `undefined` | Màu chủ đạo của giao diện (ví dụ: `{ primaryColor: '#1E88E5' }`). |
| `title` | `string` | `'Liên kết ngân hàng'` | *(Chỉ cho Modal)* Tiêu đề thanh Header của Modal. |
| `showHeader` | `boolean` | `true` | *(Chỉ cho Modal)* Hiển thị thanh Header và nút đóng (`✕`). |
| `showLoading` | `boolean` | `true` | Hiển thị vòng xoay loading khi WebView đang tải trang. |
| `enableDeepLink` | `boolean` | `true` | Tự động mở App Ngân hàng khi bấm vào liên kết Deep Link. |
| `onSuccess` | `(data) => void` | — | Callback khi liên kết hoặc thanh toán thành công. |
| `onFailed` | `(error) => void` | — | Callback khi phát sinh lỗi nghiệp vụ hoặc giao dịch hết hạn. |
| `onCancelled` | `(data) => void` | — | Callback khi người dùng chủ động đóng cửa sổ giao dịch. |
| `onClose` | `() => void` | — | Callback luôn được gọi khi cửa sổ Modal đóng lại. |

---

## Hỗ trợ & Liên hệ

- **Tài liệu OpenAPI & SDK:** [https://developers.tingee.vn](https://developers.tingee.vn)
- **Website chính thức:** [https://tingee.vn](https://tingee.vn)
- **Email hỗ trợ kỹ thuật:** [developer@heno.vn](mailto:developer@heno.vn)
- **Telegram:** [https://t.me/tingeesupport](https://t.me/tingeesupport)
- **GitHub:** [https://github.com/tingeehub](https://github.com/tingeehub)
