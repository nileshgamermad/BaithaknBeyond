import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const resolveFromRoot = (relativePath) => fileURLToPath(new URL(relativePath, import.meta.url));

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: '/',
  build: {
    rollupOptions: {
      input: {
        main: resolveFromRoot('index.html'),
        collections: resolveFromRoot('collections/index.html'),
        tags: resolveFromRoot('tags/index.html'),
        triveniSangam: resolveFromRoot('posts/triveni-sangam.html'),
        allahabadFort: resolveFromRoot('posts/allahabad-fort.html'),
        netramKachori: resolveFromRoot('posts/netram-kachori.html'),
        chowkStreetFood: resolveFromRoot('posts/chowk-street-food.html'),
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://baithakn-beyond-backend.onrender.com',
        changeOrigin: true,
      },
    },
  },
}));
