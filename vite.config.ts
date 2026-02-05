import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

export default defineConfig({
  root: './src/ui',
  plugins: [react(), viteSingleFile()],
  build: {
    target: 'esnext',
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    outDir: '../../dist',
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
    emptyOutDir: false, // Don't delete dist, as code.js builds there too (handling manually or via separate build step usually, but wait, code.ts needs tsc or vite too? Usually code.ts is built separately or as a separate entry point. I'll stick to a simple strategy: UI via Vite, Code via tsc or a separate Vite config. For simplicity, let's assume code.ts is built via tsc in watch mode or a separate config. Actually, the user asked for vite.config.ts. I'll configure it for UI. The 'code.ts' is usually handled by tsc or another vite build.)
  },
});
