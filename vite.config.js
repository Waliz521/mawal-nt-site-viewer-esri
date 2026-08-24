import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createWmsProxyMiddleware } from './server/wms-proxy.mjs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'ntg-wms-proxy',
      configureServer(server) {
        server.middlewares.use('/api/wms-proxy', createWmsProxyMiddleware());
      },
    },
  ],
  optimizeDeps: {
    include: ['luxon'],
    // Keep the whole ArcGIS/Calcite/Lit graph unbundled so exactly one copy of
    // Lit is loaded — mixing prebundled and raw Lit breaks Calcite directives.
    exclude: [
      '@arcgis/core',
      '@esri/calcite-components',
      'lit',
      'lit-html',
      'lit-element',
      '@lit/reactive-element',
    ],
  },
  resolve: {
    dedupe: ['lit', 'lit-html', 'lit-element', '@lit/reactive-element', 'luxon'],
  },
  build: {
    outDir: process.env.VERCEL_BUILD_OUTDIR || 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
    target: 'esnext',
  },
  server: {
    port: 5174,
  },
});
