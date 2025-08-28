# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A SvelteKit 5 application for interactive workplace preference analysis. The system enables presenters to create sessions with QR codes for easy participant access, featuring real-time analytics and AI-powered workplace insights. No authentication required - fully open access with cookie-based participant tracking.

## Technology Stack

- **Framework**: SvelteKit 5 with Svelte 5 runes (`$state`, `$derived`, `$effect`)
- **Remote Functions**: SvelteKit experimental remote functions with `query` and `command` wrappers
- **Database**: SQLite with Drizzle ORM (WAL2 mode enabled)
- **Validation**: Valibot schemas for all remote function inputs
- **Styling**: TailwindCSS
- **Charts**: Chart.js with reusable configuration utilities
- **Build**: Vite with SvelteKit adapter-node

## Route Architecture

### Simplified Routes (No Authentication)
- **`/`** - Landing page
- **`/admin`** - Dashboard for session management (no login required)
- **`/admin/[code]`** - Session analytics dashboard
- **`/[code]`** - Participant join page (cookie-tracked)
- **`/[code]/quiz`** - Quiz interface
- **`/[code]/complete`** - Quiz completion with scores

### Participant Flow
1. Access session via 6-character code: `/ABC123`
2. Enter name (cookie ID auto-generated)
3. Complete quiz questions
4. View personalized results

### Admin Flow  
1. Navigate to `/admin` (open access)
2. Create sessions with auto-generated codes
3. Share codes with participants
4. Monitor real-time analytics at `/admin/[code]`

## Remote Functions Pattern

### Implementation with SvelteKit Remote Functions

All server operations use SvelteKit's experimental remote functions feature:

```javascript
// src/routes/admin/admin.remote.ts
import { query, command } from '$app/server';
import * as v from 'valibot';

// Query for reading data
export const getSessionAnalytics = query(
  v.object({ 
    code: v.string(),
    slug: v.optional(v.string())
  }),
  async (params) => {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.code, params.code));
    
    return { session, participants };
  }
);

// Command for mutations
export const updateSession = command(
  v.object({
    slug: v.string(),
    isActive: v.boolean()
  }),
  async (params) => {
    await db
      .update(sessions)
      .set({ isActive: params.isActive })
      .where(eq(sessions.slug, params.slug));
    
    return { success: true };
  }
);
```

### Client Usage

```svelte
<!-- src/routes/admin/[code]/+page.svelte -->
<script>
  import { getSessionAnalytics, updateSession } from '../admin.remote';
  
  async function loadData() {
    const data = await getSessionAnalytics({ 
      code: sessionCode 
    });
  }
  
  async function toggleSession() {
    await updateSession({ 
      slug: session.slug, 
      isActive: !session.isActive 
    });
  }
</script>
```

### Key Remote Functions

**Admin Operations** (`admin.remote.ts`)
- `getAllSessions` - List all sessions with participant counts (query)
- `createSession` - Create new session with generated code (command)
- `deleteSession` - Delete session and participants (command)
- `getSessionSummary` - Get basic session info (query)
- `getSessionAnalytics` - Full session data with participants (query)
- `updateSession` - Toggle session active state (command)
- `endSession` - Mark session as ended (command)
- `deleteParticipant` - Remove participant (command)
- `generateAIInsights` - Generate session insights based on data (query)

**Participant Operations** (`participant.remote.ts`)
- `joinSession` - Join session as participant (command)
- `submitQuizResponse` - Submit quiz answers (command)
- `getParticipantResults` - Get completion results (query)

## File Structure

```
src/
├── hooks.server.ts                    # Participant tracking only
├── lib/
│   ├── server/
│   │   ├── db/
│   │   │   ├── index.ts              # Database client (WAL2 mode)
│   │   │   └── schema.ts             # Drizzle schema
│   │   └── auth.ts                   # Participant cookie utilities
│   └── components/
│       ├── charts/
│       │   └── Chart.svelte         # Chart.js wrapper
│       ├── ConfirmDialog.svelte     # Confirmation dialogs
│       └── Toast.svelte             # Notifications
└── routes/
    ├── admin/
    │   ├── admin.remote.ts          # Remote functions
    │   ├── +page.svelte             # Session list
    │   ├── +page.server.ts          # Load sessions
    │   └── [code]/
    │       ├── +page.svelte         # Analytics dashboard
    │       └── +page.server.ts     # Load analytics
    └── [code]/
        ├── +page.svelte             # Join session
        ├── +page.server.ts          # Session validation
        ├── quiz/
        │   ├── +page.svelte         # Quiz interface
        │   └── +page.server.ts      # Quiz submission
        └── complete/
            ├── +page.svelte         # Results display
            └── +page.server.ts      # Load scores
```

## Development Commands

```bash
# Development server
npm run dev              # Start dev server with --host (port 5173)
npm run preview          # Preview production build with --host

# Production build
npm run build           # Build for production
npm start               # Start production server (build/index.js)

# Database operations  
npm run db:generate     # Generate Drizzle migrations
npm run db:migrate      # Apply migrations  
npm run db:push         # Push schema changes to database
npm run db:studio       # Open Drizzle Studio GUI
npm run db:setup        # Initialize database setup
npm run setup:admin     # Setup admin user (if authentication added)

# Project management
npm run prepare         # SvelteKit sync (auto-run on install)
```

## Database Schema

```typescript
// Users (for future authentication)
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['presenter', 'admin'] }).default('presenter'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

// Sessions
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  code: text('code').notNull().unique(),         // 6-char uppercase code
  name: text('name').notNull(),
  presenterId: text('presenter_id').notNull(),   // Currently: 'default-admin'
  slug: text('slug').notNull().unique(),         // Same as code
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  endedAt: text('ended_at')
});

// Participants  
export const participants = sqliteTable('participants', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  sessionId: text('session_id').references(() => sessions.id),
  cookieId: text('cookie_id').unique(),          // Anonymous tracking
  name: text('name'),                            // Optional until join
  generation: text('generation'),                
  responses: text('responses', { mode: 'json' }).$type<Record<number, any>>(),
  preferenceScores: text('preference_scores', { mode: 'json' }).$type<{
    collaboration: number;
    formality: number; 
    tech: number;
    wellness: number;
  }>(),
  completed: integer('completed', { mode: 'boolean' }).default(false),
  joinedAt: text('joined_at').default(sql`CURRENT_TIMESTAMP`),
  completedAt: text('completed_at')
});
```

## Key Patterns

### Svelte 5 Runes
```svelte
<script>
  // State management
  let count = $state(0);
  let double = $derived(count * 2);
  
  // Props
  let { data } = $props();
  
  // Effects
  $effect(() => {
    console.log('Count changed:', count);
  });
</script>
```

### Form Actions (Server-side)
```typescript
// +page.server.ts
export const actions = {
  createSession: async ({ request }) => {
    const data = await request.formData();
    const title = data.get('title');
    
    const code = generateCode();
    await db.insert(sessions).values({
      name: title,
      code,
      slug: code,
      presenterId: 'default-admin'
    });
    
    throw redirect(303, `/admin/${code}`);
  }
};
```

### Participant Tracking
```typescript
// hooks.server.ts
export const handle: Handle = async ({ event, resolve }) => {
  const isParticipantRoute = event.url.pathname.match(/^\/[A-Z0-9]{6}/);
  
  if (isParticipantRoute) {
    let participantId = getParticipantId(event);
    if (!participantId) {
      participantId = crypto.randomUUID();
      setParticipantCookie(event.cookies, participantId);
    }
    event.locals.participantId = participantId;
  }
  
  return resolve(event);
};
```

## Environment Variables

```env
# Required
DATABASE_URL=./local.db              # SQLite file path
PUBLIC_APP_URL=http://localhost:5173 # Application URL

# Optional
OPENAI_API_KEY=your-api-key-here     # For AI insights feature
```

## Common Issues & Solutions

### TypeScript Errors with Drizzle
Add type assertions for insert/update operations:
```typescript
await db.update(sessions)
  .set({ isActive: true } as any)
  .where(eq(sessions.id, id));
```

### Remote Function Validation
All remote functions must use query/command wrappers:
```typescript
// ✅ Correct
export const getData = query(schema, async (params) => {});

// ❌ Wrong  
export async function getData(params) {}
```

### Cookie Persistence  
Participant IDs are stored in secure, HttpOnly cookies:
- 7-day expiration
- Auto-generated UUIDs
- Persists across quiz sessions
- Set in `hooks.server.ts` for participant route matching

## Testing Checklist

1. **Session Creation**: Create session at `/admin`
2. **Code Generation**: Verify 6-character codes
3. **Participant Join**: Test `/[CODE]` access
4. **Quiz Flow**: Complete all questions
5. **Score Calculation**: Verify preference scores
6. **Analytics Update**: Check real-time updates
7. **Mobile Experience**: Test responsive design

## Best Practices

- Use remote functions for all server operations
- Validate all inputs with Valibot schemas
- Handle errors gracefully with try/catch
- Use server-side data loading for initial renders
- Keep client state minimal
- Prefer derived state over manual updates
- Use form actions for progressive enhancement