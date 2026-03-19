import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import { cloudflare } from "@cloudflare/vite-plugin";

const base = process.env.BASE_PATH
  ? process.env.BASE_PATH.replace(/\/?$/, '/')
  : '/BaithaknBeyond/';

export default defineConfig({
  plugins: [react(), cloudflare()],
  base,
});