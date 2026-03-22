import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: '/',
  server: {
    proxy: {
      '/api': {
        target: 'https://baithakn-beyond-backend.onrender.com',
        changeOrigin: true,
      },
    },
  },
}));
