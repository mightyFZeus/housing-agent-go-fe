import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: 'hidden',
  },
  server: {
    proxy: {
      '/health': {
        target: 'https://housing-agent-go.onrender.com',
        changeOrigin: true,
        timeout: 60000,
        proxyTimeout: 60000,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('connection', 'close')
          })
        },
      },
      '/search': {
        target: 'https://housing-agent-go.onrender.com',
        changeOrigin: true,
        timeout: 60000,
        proxyTimeout: 60000,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('connection', 'close')
          })
        },
      },
    },
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
, 
    tsconfigPaths()
  ],
})
