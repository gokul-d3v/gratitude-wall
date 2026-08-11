import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5001',
        ws: true,
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err: any) => {
            if (err?.code === 'EPIPE' || err?.code === 'ECONNRESET') {
              return; // Ignore normal websocket disconnect errors
            }
          });
          proxy.on('proxyReqWs', (_proxyReq, _req, socket: any) => {
            socket.on('error', (err: any) => {
              if (err?.code === 'EPIPE' || err?.code === 'ECONNRESET') {
                return; // Ignore normal client socket reset errors
              }
            });
          });
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          state: ['zustand', 'axios'],
          realtime: ['socket.io-client'],
        },
      },
    },
  },
});
