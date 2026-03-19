import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';

const kodoGrammar = JSON.parse(
  fs.readFileSync(new URL('./src/grammars/kodo.tmLanguage.json', import.meta.url), 'utf-8')
);

export default defineConfig({
  site: 'https://kodo-lang.dev',
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-dark',
        dark: 'github-dark',
      },
      langs: [kodoGrammar],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
