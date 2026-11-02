import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { privateHandwritingPlugin } from './scripts/private-handwriting-plugin';

// The GitHub Pages project URL is /storybook-3d/; local and EC2 keep /.
export default defineConfig(({mode})=>({
  plugins:[react(),privateHandwritingPlugin()],
  base:mode==='pages'?'/storybook-3d/':'/',
  server:{host:'0.0.0.0'},
}));
