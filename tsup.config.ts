import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  minify: true,
  treeshake: true,
  sourcemap: false,
  external: ['react', 'react-native', 'react-native-webview'],
});
