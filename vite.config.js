import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const resolveFromRoot = (relativePath) => fileURLToPath(new URL(relativePath, import.meta.url));

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: '/',
  build: {
    // Don't ship source maps in production — saves bandwidth and hides internals
    sourcemap: false,
    // Minify CSS output
    cssMinify: true,
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
      output: {
        // Split heavy dependencies into separate chunks so the browser can
        // cache them independently. A React update only invalidates the
        // react chunk; a Motion-only change only invalidates vendor-motion.
        manualChunks: {
          'vendor-react':  ['react', 'react-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-oauth':  ['@react-oauth/google'],
        },
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
