import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  const backendTarget = process.env.VITE_BACKEND_URL || 'http://localhost:8080/lms-api';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('error', (err, req, res) => {
              if (res && 'writeHead' in res && !res.headersSent) {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(
                  JSON.stringify({
                    success: false,
                    message:
                      'Java Tomcat Backend unreachable at ' +
                      backendTarget +
                      '. Please start Apache Tomcat 10+ with target/lms-api.war deployed.',
                  })
                );
              }
            });
          },
        },
      },
      // HMR is disabled in AI Studio iframe environment.
      hmr: false,
      watch: null,
    },
  };
});
