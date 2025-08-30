# Project Navigation Guide

## 🗺️ Where to Find What

### For Quick Changes

#### Change UI Text/Labels
- Components: `src/routes/(components)/`
- Pages: `src/routes/[route]/+page.svelte`
- Shared UI: `src/lib/components/ui/`

#### Modify Database Schema
- Schema: `src/lib/server/db/schema.ts`
- Run: `npm run db:push` to apply changes

#### Update Styling
- Global: `src/app.css`
- Component: Use Tailwind classes inline
- Theme: `tailwind.config.js`

#### Add New Route
1. Create folder: `src/routes/your-route/`
2. Add `+page.svelte` for UI
3. Add `+page.server.ts` for data loading
4. Or use `*.remote.ts` for server functions

### Core File Map

```
src/
├── lib/
│   ├── server/          # Backend code
│   │   ├── db/         # Database
│   │   │   ├── schema.ts      # ⭐ Database schema
│   │   │   └── index.ts       # DB connection
│   │   ├── auth.ts            # ⭐ Authentication
│   │   └── services/          # External services
│   │
│   ├── components/      # Reusable components
│   │   ├── ui/         # ⭐ UI components
│   │   ├── charts/     # Visualizations
│   │   └── shared/     # Common components
│   │
│   ├── state/          # State management
│   │   └── quizState.svelte.ts # ⭐ Main state
│   │
│   └── utils/          # Utilities
│       ├── validation.ts      # Valibot schemas
│       └── attachments.ts     # Svelte 5 utils
│
├── routes/             # ⭐ Pages & API
│   ├── +page.svelte           # Landing page
│   ├── login/                 # Login page
│   ├── admin/                 # Admin dashboard
│   ├── [code]/               # Session pages
│   │   ├── +page.svelte      # Join page
│   │   ├── quiz/             # Quiz interface
│   │   └── complete/         # Results
│   │
│   └── *.remote.ts           # ⭐ Server functions
│       ├── auth.remote.ts    # Auth operations
│       ├── data.remote.ts    # Data operations
│       └── ai.remote.ts      # AI operations
│
├── hooks.server.ts     # ⭐ Middleware/Auth
├── app.d.ts           # TypeScript types
├── app.html           # HTML template
└── app.css            # Global styles
```

### Common Tasks

#### 1. Add New Component
```bash
# Create component
touch src/lib/components/ui/MyComponent.svelte

# Export it
echo "export { default as MyComponent } from './MyComponent.svelte';" >> src/lib/components/ui/index.ts

# Use it
import { MyComponent } from '$lib/components';
```

#### 2. Add Server Function
```typescript
// src/routes/myfeature.remote.ts
import { command } from '$app/server';
import * as v from 'valibot';

export const doSomething = command(
  v.object({ input: v.string() }),
  async ({ input }) => {
    // Server logic
    return { result: input.toUpperCase() };
  }
);

// Use in component
import { doSomething } from './myfeature.remote';
const result = await doSomething({ input: 'test' });
```

#### 3. Add Protected Route
```typescript
// src/routes/admin/newpage/+page.server.ts
import { requireAuth } from '$lib/server/auth';

export async function load(event) {
  const user = await requireAuth(event);
  // Page will auto-redirect if not authenticated
  
  return {
    user
  };
}
```

#### 4. Add Database Table
```typescript
// src/lib/server/db/schema.ts
export const myTable = sqliteTable('my_table', {
  id: text('id').primaryKey(),
  data: text('data', { mode: 'json' })
});

// Run migration
npm run db:push
```

### Configuration Files

#### Environment Variables
```env
# .env or .env.local
DATABASE_URL=./local.db
PUBLIC_APP_URL=http://localhost:5173
OPENAI_API_KEY=sk-...
```

#### Build Configuration
- `vite.config.ts` - Vite settings
- `svelte.config.js` - SvelteKit config
- `tsconfig.json` - TypeScript config
- `tailwind.config.js` - Tailwind CSS
- `drizzle.config.ts` - Database config

### Testing & Development

#### Commands
```bash
npm run dev        # Start dev server
npm run build      # Build production
npm run preview    # Preview build
npm test          # Run tests
npm run db:studio  # Database GUI
```

#### Key URLs
- Dev: http://localhost:5173
- Admin: http://localhost:5173/admin
- Session: http://localhost:5173/ABC1
- DB Studio: http://localhost:4983

### Documentation References

#### Architecture
- Overview: `docs/SYSTEM_ARCHITECTURE.md`
- Diagrams: `docs/VISUAL_ARCHITECTURE.md`
- Journey: `docs/IMPLEMENTATION_JOURNEY.md`

#### Features
- Auth: `docs/LUCIA_AUTH_MIGRATION.md`
- Real-time: `docs/REALTIME_COMMUNICATION_GUIDE.md`
- Sessions: `docs/SESSION_MANAGEMENT_README.md`

#### Development
- Roadmap: `docs/ROADMAP.md`
- AI Setup: `docs/AI_REMOTE_USAGE.md`
- Models: `docs/MODELS_AND_SCHEMA.md`

### Quick Debug Tips

#### Check Database
```bash
# Open database GUI
npm run db:studio

# Or use SQLite CLI
sqlite3 local.db
.tables
.schema sessions
SELECT * FROM sessions;
```

#### Check Auth
```typescript
// In any +page.server.ts
export async function load({ locals }) {
  console.log('User:', locals.user);
  console.log('Session:', locals.session);
}
```

#### Check Logs
```bash
# Dev server logs
npm run dev

# Build errors
npm run build

# Type errors
npm run typecheck
```

### File Naming Conventions

- Components: `PascalCase.svelte`
- Utilities: `camelCase.ts`
- Routes: `lowercase-with-dashes/`
- Remote functions: `feature.remote.ts`
- Documentation: `UPPERCASE_WITH_UNDERSCORES.md`

### Import Aliases

```typescript
$lib/         # src/lib/
$app/         # SvelteKit app modules
```

### Need Help?

1. Check memories: `.memories/`
2. Read docs: `docs/README.md`
3. Search code: Use Serena's `search_for_pattern`
4. Check examples: `src/routes/(components)/`