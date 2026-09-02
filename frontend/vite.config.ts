import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_PROXY_TARGET || (mode === 'test' ? 'http://localhost:5002' : 'http://localhost:5001');
  const serverPort = parseInt(env.PORT || (mode === 'test' ? '5174' : '5173'), 10);

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: serverPort,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/socket.io': {
          target: proxyTarget,
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
  };
});
