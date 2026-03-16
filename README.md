# Kōdo Website

The official website for [Kōdo](https://github.com/rfunix/kodo) — the programming language designed for AI agents.

Built with [Astro](https://astro.build) + [Starlight](https://starlight.astro.build) + [Tailwind CSS](https://tailwindcss.com).

## Structure

```
/                       Custom landing page (7 sections)
/getting-started/       Installation & hello world
/tour/                  Quick tour of Kōdo features
/guide/                 25 language guide pages
/reference/             Design spec, grammar, error index
```

## Development

```bash
npm install
npm run dev        # Dev server at localhost:4321
npm run build      # Build to ./dist/
npm run preview    # Preview production build
```

## Stack

| Technology | Purpose |
|-----------|---------|
| Astro 6 | Static site generator (zero JS by default) |
| Starlight | Documentation framework with search, sidebar, dark mode |
| Tailwind CSS 4 | Utility-first styling |
| Shiki | Syntax highlighting with custom Kōdo grammar |
| Pagefind | Client-side search index |

## Syncing docs from the compiler repo

The guide pages in `src/content/docs/guide/` are imported from `docs/guide/` in the main Kōdo repository. To update:

1. Copy the `.md` files from `kodo/docs/guide/` to `src/content/docs/guide/`
2. Ensure each file has the proper YAML frontmatter (title, sidebar order)
3. Build and verify

## License

MIT
