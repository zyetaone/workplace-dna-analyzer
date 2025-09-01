# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development

```bash
npm run dev              # Start dev server (port 5173, network accessible)
npm run build            # Build production with @sveltejs/adapter-node
npm run preview          # Preview production build locally
npm start                # Run production server
```

### Database Management

```bash
npm run db:generate      # Generate Drizzle migrations from schema changes
npm run db:migrate       # Apply migrations to SQLite database
npm run db:push          # Push schema directly (dev only, bypasses migrations)
npm run db:studio        # Open Drizzle Studio GUI for database inspection
```

### Code Quality

```bash
npm run lint             # Run Prettier check + ESLint
npm run format           # Auto-format with Prettier
npm run typecheck        # Run svelte-check for TypeScript validation
npm run test             # Run Vitest test suite
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
```

## Architecture Overview

### Technology Stack

- **Framework**: SvelteKit 2 with Svelte 5 (runes: `$state`, `$derived`, `$effect`)
- **Database**: SQLite + Drizzle ORM (schema in `src/lib/server/db/schema.ts`)
- **Validation**: Valibot for runtime validation schemas
- **Styling**: TailwindCSS v4 with custom component system
- **Testing**: Vitest + @testing-library/svelte
- **Data Updates**: SvelteKit remote functions with polling/invalidation

### Project Structure

```
src/
├── routes/                     # SvelteKit pages + API endpoints
│   ├── (admin)/               # Admin dashboard routes
│   ├── (participant)/         # Participant-facing routes
│   └── *.remote.ts            # Remote functions (query/command pattern)
├── lib/
│   ├── modules/               # Feature modules (session, quiz, analytics, activities)
│   │   └── */components/      # Module-specific components
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   └── charts/            # D3.js/Chart.js visualizations
│   ├── server/
│   │   ├── db/                # Database layer
│   │   │   ├── schema.ts      # Drizzle schema definitions
│   │   │   └── helpers.ts     # Database helper functions
│   │   ├── schemas/           # Valibot validation schemas
│   │   └── response.ts        # RemoteResponse utility
│   ├── schemas/               # Client-side validation schemas
│   ├── states/                # Global state management (*.svelte.ts)
│   └── utils/                 # Shared utilities
```

### Key Patterns

#### Remote Functions (SvelteKit's RPC-like Pattern)

```typescript
// In *.remote.ts files
import { query, command } from '$app/server';

// Query for read operations
export const getSessionInfo = query(GetSessionInfoSchema, async (input) => {
	// Database read operations
	return RemoteResponse.success(data);
});

// Command for mutations
export const createSession = command(CreateSessionSchema, async (input) => {
	// Database write operations
	return RemoteResponse.success(result);
});

// Client usage
import { getSessionInfo } from './app.remote';
const result = await getSessionInfo({ code: 'ABC123' });
```

#### Svelte 5 Runes State Management

```typescript
// State management with runes
class SessionState {
	session = $state<Session | null>(null);
	participants = $state<Participant[]>([]);

	// Derived values
	participantCount = $derived(this.participants.length);

	// Effects for polling/refresh
	constructor() {
		$effect(() => {
			const interval = setInterval(() => this.refresh(), 5000);
			return () => clearInterval(interval); // ALWAYS return cleanup function
		});
	}

	async refresh() {
		// Call remote functions to get fresh data
		const result = await getSessionInfo({ code: this.session?.code });
		if (result.success) this.session = result.data;
	}
}
```

#### Database Schema (Drizzle ORM)

```typescript
// SQLite schema with Drizzle
export const sessions = sqliteTable('sessions', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => generateId()),
	code: text('code').notNull().unique(),
	name: text('name').notNull(),
	isActive: integer('is_active', { mode: 'boolean' }).default(true),
	createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});
```

#### Validation with Valibot

```typescript
import * as v from 'valibot';

export const SessionSchema = v.object({
	code: v.pipe(v.string(), v.length(6), v.regex(/^[A-Z]{3}\d{3}$/)),
	name: v.pipe(v.string(), v.minLength(1), v.maxLength(100))
});
```

## Critical Development Notes

### Data Updates & Reactivity

- **No SSE/WebSockets needed** - SvelteKit handles updates via remote functions
- Use polling with `setInterval` in `$effect` blocks for live updates
- Call `invalidate()` or `invalidateAll()` to refresh load functions
- Remote functions provide RPC-like communication with the server
- Suitable for all scale requirements with proper caching

### Module System

The codebase uses a feature-based module structure in `src/lib/modules/`:

- `session/` - Session management components
- `quiz/` - Quiz-taking interface
- `analytics/` - Analytics and reporting
- `activities/` - Activity system components

Each module contains its own components subfolder.

### State Management

- Global app state in `src/lib/states/app.svelte.ts`
- Module-specific stores in module directories
- Always use Svelte 5 runes (`$state`, `$derived`, `$effect`)
- Cleanup functions are mandatory in `$effect` blocks

### Database Operations

- All database operations go through Drizzle ORM
- Helper functions in `src/lib/server/db/helpers.ts`
- Use transactions for multi-table operations
- SQLite database file: `local.db`

### Testing Strategy

- Unit tests for utilities and scoring logic
- Component tests using @testing-library/svelte
- Test files colocated with source (`.test.ts`)
- Run single test: `npm run test -- path/to/test.test.ts`

### Error Handling

- Use `RemoteResponse` utility for consistent API responses
- Validate all inputs with Valibot schemas
- Handle network errors with retry logic in remote function calls
- Log errors but don't expose internal details to clients

### Performance Considerations

- Lazy load route components
- Use `$derived` for computed values instead of recalculating
- Implement proper cleanup in all `$effect` blocks
- Batch database operations where possible

## Common Tasks

### Adding a New Feature Module

1. Create directory in `src/lib/modules/[feature-name]/`
2. Add components in `src/lib/modules/[feature-name]/components/`
3. Create remote functions in `src/routes/[feature].remote.ts`
4. Add validation schemas in `src/lib/schemas/[feature].ts`

### Creating a Remote Function

1. Define input/output schemas with Valibot
2. Implement in `*.remote.ts` using `query` or `command`
3. Use `RemoteResponse.success()` or `RemoteResponse.error()`
4. Import and call from client components

### Modifying Database Schema

1. Edit `src/lib/server/db/schema.ts`
2. Run `npm run db:generate` to create migration
3. Run `npm run db:migrate` to apply
4. Update TypeScript types if needed

### Running Tests

```bash
npm run test -- --run          # Run once
npm run test:watch              # Watch mode
npm run test:coverage           # With coverage
npm run test -- file.test.ts    # Specific file
```

## Important Constraints

1. **Remote functions for all server communication** - No manual fetch() calls
2. **SQLite limitations** - No concurrent writes, use transactions wisely
3. **Svelte 5 runes only** - No legacy stores or reactive statements
4. **Always validate inputs** - Use Valibot schemas at API boundaries
5. **TypeScript strict mode** - Explicit types required
6. **Component naming** - PascalCase for components, camelCase for utilities
7. **No console.log in production** - Use proper logging utilities
