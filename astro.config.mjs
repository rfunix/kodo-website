// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';

const kodoGrammar = JSON.parse(
  fs.readFileSync(new URL('./src/grammars/kodo.tmLanguage.json', import.meta.url), 'utf-8')
);

export default defineConfig({
  site: 'https://kodo-lang.dev',
  integrations: [
    starlight({
      title: 'Kōdo',
      logo: {
        src: './src/assets/kodo.png',
        alt: 'Kōdo Logo',
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/rfunix/kodo' },
      ],
      customCss: ['./src/styles/global.css'],
      favicon: '/favicon.svg',
      head: [
        {
          tag: 'meta',
          attrs: {
            name: 'description',
            content: 'Kōdo — The programming language designed for AI agents. Contracts verified by Z3, compiler-enforced authorship tracking, intent-driven code generation.',
          },
        },
        {
          tag: 'meta',
          attrs: { property: 'og:image', content: '/kodo.png' },
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/rfunix/kodo-website/edit/main/',
      },
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Installation', slug: 'getting-started' },
            { label: 'A Tour of Kōdo', slug: 'tour' },
          ],
        },
        {
          label: 'Language Guide',
          items: [
            { label: 'Language Basics', slug: 'guide/language-basics' },
            { label: 'Data Types', slug: 'guide/data-types' },
            { label: 'Pattern Matching', slug: 'guide/pattern-matching' },
            { label: 'Error Handling', slug: 'guide/error-handling' },
            { label: 'Ownership', slug: 'guide/ownership' },
            { label: 'Generics', slug: 'guide/generics' },
            { label: 'Traits', slug: 'guide/traits' },
            { label: 'Methods', slug: 'guide/methods' },
            { label: 'Closures', slug: 'guide/closures' },
            { label: 'Iterators', slug: 'guide/iterators' },
            { label: 'String Interpolation', slug: 'guide/string-interpolation' },
            { label: 'Modules & Imports', slug: 'guide/modules-and-imports' },
            { label: 'Functional Programming', slug: 'guide/functional' },
          ],
        },
        {
          label: 'Advanced',
          items: [
            { label: 'Contracts', slug: 'guide/contracts' },
            { label: 'Agent Traceability', slug: 'guide/agent-traceability' },
            { label: 'Concurrency', slug: 'guide/concurrency' },
            { label: 'Actors', slug: 'guide/actors' },
            { label: 'HTTP & Networking', slug: 'guide/http' },
            { label: 'MCP Server', slug: 'guide/mcp-server' },
            { label: 'Testing', slug: 'guide/testing' },
            { label: 'Real-World Examples', slug: 'guide/real-world-examples' },
          ],
        },
        {
          label: 'Tools',
          items: [
            { label: 'CLI Reference', slug: 'guide/cli-reference' },
            { label: 'CLI Tools', slug: 'guide/cli-tools' },
          ],
        },
        {
          label: 'Standard Library',
          items: [
            { label: 'Stdlib Reference', slug: 'guide/stdlib-reference' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Language Design', slug: 'reference/design' },
            { label: 'Grammar (EBNF)', slug: 'reference/grammar' },
            { label: 'Error Index', slug: 'reference/errors' },
          ],
        },
      ],
      expressiveCode: {
        shiki: {
          langs: [kodoGrammar],
        },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
