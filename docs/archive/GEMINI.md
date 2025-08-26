# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A SvelteKit application for interactive workplace preference analysis that helps organizations understand their team's workplace DNA through real-time quizzes and AI-powered insights. The system supports presenter-led sessions with attendees joining via QR codes to complete preference surveys.

## Core Architecture

### Technology Stack
- **Framework**: SvelteKit 5 with Svelte 5 runes (`$state`, `$derived`, `untrack`)
- **Database**: SQLite with WAL2 mode optimization + Drizzle ORM
- **Real-time**: Server-Sent Events (SSE) for live updates
- **State Management**: Unified session state with reactive collections (SvelteMap/SvelteSet)
- **Validation**: Valibot schemas for all remote function inputs
- **Styling**: TailwindCSS with Vite plugin
- **Build**: Vite with SvelteKit adapter-node

### Key Architectural Patterns

**Unified State Management** (`src/lib/stores/session-state.svelte.ts`)
- Single source of truth replacing 7 scattered store files
- Memoization with TTL cache (1-second default) for expensive computations
- Performance optimization using `untrack()` to prevent unnecessary reactivity

**Remote Functions Pattern**
- Clear client/server separation
- Type-safe RPC with automatic validation
- Parallel data fetching with `Promise.all`

**Database Optimizations**
```sql
PRAGMA journal_mode = WAL2;  -- High concurrency mode
PRAGMA busy_timeout = 10000; -- 10-second timeout
PRAGMA cache_size = -64000;   -- 64MB cache
PRAGMA synchronous = NORMAL; -- Balance safety/speed
```

## Development Commands

```bash
# Development
npm run dev              # Start dev server (port 5173)
npm run build           # Build for production
npm run preview         # Preview production build (port 4173)

# Database Management
npm run db:generate     # Generate Drizzle migrations
npm run db:migrate      # Apply migrations
npm run db:push         # Push schema changes directly
npm run db:studio       # Open Drizzle Studio UI

# Production
npm start               # Run production server
```

## Critical File Structure

```
src/
├── lib/
│   ├── stores/
│   │   └── session-state.svelte.ts    # Unified reactive state
│   ├── remote/
│   │   ├── attendee.remote.ts         # Attendee operations
│   │   └── presenter.remote.ts        # Presenter operations
│   ├── server/
│   │   ├── db/
│   │   │   ├── index.ts               # Database client with WAL2
│   │   │   └── schema.ts              # Drizzle schema
│   │   └── realtime/
│   │       └── manager.ts             # SSE management
│   └── utils/
│       └── workplace-dna.ts           # Score calculations
└── routes/
    └── session/
        └── [sessionId]/
            ├── presenter/              # Dashboard with analytics
            └── attendee/               # Quiz interface
```

## Remote Functions API

### Attendee Operations (`attendee.remote.ts`)
- `joinSession(sessionId, name, generation)` - Join with validation
- `saveResponse(sessionId, attendeeId, questionId, answer)` - Save answer
- `completeQuiz(sessionId, attendeeId)` - Submit and calculate scores
- `loadAttendeeData(sessionId, attendeeId)` - Fetch current state

### Presenter Operations (`presenter.remote.ts`)
- `createSession(name)` - Initialize with unique ID
- `getSessionAnalytics(sessionId)` - Parallel fetch all metrics
- `generateAIInsights(sessionId, prompt, mode)` - AI analysis (requires OPENAI_API_KEY)
- `endSession(sessionId)` - Mark as ended
- `deleteAttendee(sessionId, attendeeId)` - Remove participant

## Performance Optimizations

1. **Parallel Operations**: All analytics queries run concurrently
2. **Memoization**: Frequently accessed data cached with 1-second TTL
3. **Reactive Collections**: SvelteMap/SvelteSet for efficient updates
4. **Connection Pooling**: Database connections managed efficiently
5. **SSE Heartbeat**: 30-second ping to maintain connections

## Environment Variables

```env
# Required
DATABASE_URL=./local.db              # SQLite file path or libSQL URL
PUBLIC_APP_URL=http://localhost:5173 # Application URL

# Optional
OPENAI_API_KEY=sk-...               # For AI features
DATABASE_AUTH_TOKEN=...             # For libSQL/Turso
```

## Data Flow

1. **User Action** → Component calls remote function
2. **Validation** → Valibot schema validates input
3. **Optimistic Update** → Immediate UI update
4. **Database Operation** → Parallel queries with Drizzle
5. **State Sync** → Update unified session state
6. **SSE Broadcast** → Notify all connected clients
7. **UI Update** → Reactive updates via Svelte 5 runes

## Testing & Debugging

### Key Areas to Verify
- Session creation and QR generation
- Attendee join flow with validation
- Real-time chart updates via SSE
- Analytics calculation accuracy
- Concurrent user handling (150+ target)
- Mobile responsiveness

### Database Debugging
```bash
npm run db:studio  # Visual database inspector

# Check WAL mode status
sqlite3 local.db "PRAGMA journal_mode;"

# Monitor connections
sqlite3 local.db "PRAGMA database_list;"
```

### SSE Connection Monitoring
- Check Network tab for `/api/sessions/[id]/stream` endpoint
- Verify heartbeat messages every 30 seconds
- Monitor reconnection on connection loss

## Common Issues & Solutions

**Charts Not Updating**
- Verify SSE connection in Network tab
- Check memoization isn't caching stale data
- Ensure `session-state.svelte.ts` data flow

**Database Locks**
- Confirm WAL2 mode: `PRAGMA journal_mode;`
- Check connection pool status
- Monitor with `npm run db:studio`

**High Memory Usage**
- Review memoization cache size
- Verify SSE client cleanup
- Check `untrack()` usage in loops

## Code Conventions

- **State**: Use `$state` for reactive values
- **Computed**: Use `$derived` for derived values
- **Effects**: Use `$effect` sparingly
- **Types**: Explicit types, avoid `any`
- **Validation**: Valibot schemas for all inputs
- **Errors**: Proper error boundaries
- **Parallel Ops**: Use `Promise.all` for concurrent queries