import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  build: {
    outDir: 'dist-electron',
    emptyOutDir: false,
    target: 'node24',
    ssr: true,
    lib: {
      entry: {
        preload: path.resolve(import.meta.dirname, 'src/preload/preload.ts'),
      },
      formats: ['cjs'],
    },
    rollupOptions: {
      external: [
        'electron',
        'node:path',
        'node:fs',
        'node:os',
        'node:events',
      ],
      output: {
        entryFileNames: '[name].cjs',
      },
    },
  },
});
