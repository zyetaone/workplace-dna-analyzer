# AGENTS.md - Development Guidelines for PPT Quiz App

## Commands

- `npm run dev` - Start dev server (port 5173)
- `npm run test` - Run all tests | `npm run test -- filename` - Run single test
- `npm run lint` - Format & lint | `npm run typecheck` - TypeScript check
- `npm run build` - Production build | `npm run db:studio` - Database GUI

## Code Style

- **Svelte 5**: Use `$state`, `$derived`, `$effect` runes; `$props()` for props
- **Imports**: `$lib/` for internal, `./` for relative; group external → internal → types
- **Naming**: camelCase vars/functions, PascalCase components, kebab-case files
- **TypeScript**: Strict typing; use Valibot schemas for validation
- **Formatting**: Tabs, single quotes, 100 char width (Prettier)

## Architecture

- SvelteKit 5 with runes, SQLite + Drizzle ORM, TailwindCSS
- Component variants pattern: `<Component variant="simple|enhanced" />`
- Use `<svelte:boundary>` for errors, `$derived.by()` for expensive computations
- Remote functions: `query` for reads, `command` for writes
- Test with Vitest + @testing-library/svelte, 80% coverage target
- Performance: <16ms render time, <50MB memory, track with built-in utils

## Pre-commit: All tests pass, lint clean, TypeScript check passes
