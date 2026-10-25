import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages hosts project sites under /storybook-3d/.
// Vercel and local development keep the root path.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'pages' ? '/storybook-3d/' : '/',
  server: { host: '0.0.0.0' },
}));
