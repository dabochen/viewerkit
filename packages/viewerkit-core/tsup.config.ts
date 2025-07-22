import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'hooks/index': 'src/hooks/index.ts',
    'ui/index': 'src/ui/index.ts',
    'templates/markdown/index': 'src/templates/markdown/index.ts'
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', 'vscode'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  }
});
