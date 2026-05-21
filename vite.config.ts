import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'dev-token-proxy',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/api/get-dev-token') {
            try {
              const devSecret = "NAOUfmUyQY9J0/xJUbN9vOQQ9VsGG7Vvy0XoYs57Ah8=";
              const response = await fetch('https://us-central1-casanova-ai-dev.cloudfunctions.net/miscAuth/auth/dev/id-token', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Dev-Auth-Secret': devSecret,
                },
                body: JSON.stringify({ uid: 'dev-peter' }),
              });
              
              if (response.ok) {
                const data = await response.json();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data));
              } else {
                res.writeHead(response.status, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to fetch token from backend' }));
              }
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
            return;
          }
          next();
        });
      }
    }
  ],
  server: {
    proxy: {
      '/api-rizz': {
        target: 'https://us-central1-casanova-ai-dev.cloudfunctions.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-rizz/, ''),
      },
    },
  },
});
