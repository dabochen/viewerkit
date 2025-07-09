import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  minify: false,
  target: 'node18',
  external: [
    'vscode',
    'react',
    'react-dom'
  ],
  banner: {
    js: '// ViewerKit SDK - https://github.com/viewerkit/viewerkit-sdk'
  }
}); 