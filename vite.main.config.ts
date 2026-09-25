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
        main: path.resolve(import.meta.dirname, 'src/main/main.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'electron',
        'node:sqlite',
        'node:path',
        'node:fs',
        'node:os',
        'node:crypto',
        'node:events',
        'node:url',
      ],
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
});
