# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A SvelteKit 5 application for interactive workplace preference analysis. The system features simplified routing with participants joining via session codes and presenters managing sessions through an admin dashboard. No authentication required - fully open access.

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
- `getSessionSummary` - Get basic session info (query)
- `getSessionAnalytics` - Full session data with participants (query)
- `updateSession` - Toggle session active state (command)
- `endSession` - Mark session as ended (command)
- `deleteParticipant` - Remove participant (command)
- `generateAIInsights` - Generate session insights (query)
- `joinSession` - Join as participant (command)

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
npm run dev              # Start dev server (port 5173)
npm run build           # Build for production
npm run preview         # Preview production build

# Database
npm run db:generate     # Generate Drizzle migrations
npm run db:migrate      # Apply migrations
npm run db:push        # Push schema changes
npm run db:studio      # Open Drizzle Studio
```

## Database Schema

```typescript
// Sessions
{
  id: string (UUID)
  code: string (6 chars, uppercase)
  name: string
  slug: string (same as code)
  presenterId: string (default: 'default-admin')
  isActive: boolean
  createdAt: string
  endedAt: string?
}

// Participants
{
  id: string (UUID)
  sessionId: string
  cookieId: string (for tracking)
  name: string
  generation: string
  responses: JSON
  preferenceScores: JSON
  completed: boolean
  joinedAt: string
  completedAt: string?
}
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
DATABASE_URL=./local.db              # SQLite file path
PUBLIC_APP_URL=http://localhost:5173 # Application URL
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