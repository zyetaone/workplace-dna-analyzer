# AGENTS.md - Development Guidelines for PPT Quiz App

## Build/Lint/Test Commands

**Development:**

- `npm run dev` - Start dev server (port 5173 with --host)
- `npm run build` - Build for production
- `npm run preview` - Preview production build with --host
- `npm start` - Start production server

**Code Quality:**

- `npm run lint` - Run Prettier + ESLint
- `npm run format` - Format code with Prettier
- `npx svelte-check --tsconfig ./tsconfig.json` - TypeScript type checking

**Database:**

- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Apply database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio GUI

**Testing:** No test framework configured - add tests with Vitest or similar when needed.

## Code Style Guidelines

### Svelte 5 Patterns

- Use `$state`, `$derived`, `$effect` runes for reactive state
- Use `$props()` for component props
- Use `{@render children?.()}` for component children
- Use `<svelte:boundary>` for error boundaries
- Use `{@attach ...}` for reactive DOM interactions

### Imports & File Structure

- Internal imports: `$lib/` (e.g., `$lib/components/ui/Button.svelte`)
- Relative imports: `./` or `../` for local files
- Group imports: external libs, then internal libs, then types
- Use index.ts files for clean component exports

### Naming Conventions

- **Variables/Functions**: camelCase (`generateId`, `formatDate`)
- **Components/Types**: PascalCase (`Button`, `SessionAnalytics`)
- **Files**: kebab-case for routes, camelCase for utilities
- **Constants**: UPPER_SNAKE_CASE for config values

### TypeScript

- Strict TypeScript enabled
- Define interfaces/types in dedicated files
- Use Valibot schemas for runtime validation
- Export types alongside implementations

### Error Handling

- Use `<svelte:boundary>` for runtime errors
- Reactive error states with `{#if error}`
- Graceful fallbacks for failed operations
- Proper cleanup in `$effect` with return functions

### Styling

- TailwindCSS for styling
- Custom CSS variables for theming
- Responsive design patterns
- Dark theme as default

### Formatting (Prettier)

- Use tabs (not spaces)
- Single quotes for strings
- No trailing commas
- 100 character line width
- Svelte plugin enabled

### Remote Functions

- Use `query` for read operations
- Use `command` for write operations
- Validate inputs with Valibot schemas
- Handle errors gracefully with fallbacks

### Database

- Drizzle ORM with SQLite
- Use transactions for multi-step operations
- Proper foreign key relationships
- JSON columns for complex data

### Performance

- Use `$derived.by()` for expensive computations
- Implement proper cleanup in effects
- Lazy load heavy components
- Optimize bundle size

## Development Workflow

1. Run `npm run dev` for development
2. Use `npm run lint` before commits
3. Run `npm run build` to verify production build
4. Use `npm run db:studio` for database management
5. Follow conventional commit messages

## Architecture Notes

- SvelteKit 5 with modern runes
- SQLite database with Drizzle ORM
- No authentication required
- Cookie-based participant tracking
- Real-time analytics with reactive state
- AI integration ready (OpenAI API)</content>
  </xai:function_call
