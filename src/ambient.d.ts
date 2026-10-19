declare module 'react-native' {
  import type React from 'react';

  export const View: React.ComponentType<any>;
  export const Text: React.ComponentType<any>;
  export const Modal: React.ComponentType<any>;
  export const SafeAreaView: React.ComponentType<any>;
  export const TouchableOpacity: React.ComponentType<any>;
  export const ActivityIndicator: React.ComponentType<any>;

  export const Linking: {
    openURL(url: string): Promise<any>;
    canOpenURL(url: string): Promise<boolean>;
  };

  export const StyleSheet: {
    create<T extends Record<string, any>>(styles: T): T;
    hairlineWidth: number;
    absoluteFillObject: Record<string, any>;
  };
}

declare module 'react-native-webview' {
  import type React from 'react';
  export const WebView: React.ComponentType<any>;
  export default WebView;
}
