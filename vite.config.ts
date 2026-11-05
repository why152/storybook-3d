import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {privateHandwritingPlugin} from './scripts/private-handwriting-plugin';
import {templateEditionPlugin} from './scripts/template-edition-plugin';

export default defineConfig(({mode})=>{
  const template=mode==='template';
  return {
    plugins:[react(),templateEditionPlugin(template),...(template?[]:[privateHandwritingPlugin()])],
    // Each delivered edition can be hosted under any independent URL prefix.
    base:template?'./':mode==='pages'?'/storybook-3d/':'/',
    publicDir:template?false:'public',
    server:{host:'0.0.0.0'},
  };
});
