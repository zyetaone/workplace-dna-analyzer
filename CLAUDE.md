# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A SvelteKit application for interactive workplace preference analysis that helps organizations understand their team's workplace DNA through real-time quizzes and AI-powered insights. The system supports presenter-led sessions with attendees joining via QR codes to complete preference surveys.

## Core Architecture

### Technology Stack
- **Framework**: SvelteKit 5 with Svelte 5 runes (`$state`, `$derived`, `$effect`, `$effect.root`)
- **Database**: SQLite with Drizzle ORM
- **Real-time**: Server-Sent Events (SSE) for live updates
- **State Management**: Unified session state store with reactive analytics
- **Validation**: Valibot schemas with SvelteKit remote functions (query/command)
- **Styling**: TailwindCSS
- **Charts**: Chart.js with reusable configuration utilities
- **Build**: Vite with SvelteKit adapter-node

### Key Architectural Patterns

**Unified State Management** (`src/lib/stores/sessionState.svelte.ts`)
- Single source of truth for session data and analytics
- Reactive computed analytics with `$derived`
- SSE event handling integrated into store
- Optimized with consolidated effects using `$effect.root`

**Remote Functions Pattern**
- Clear client/server separation with `.remote.ts` files
- Type-safe RPC with Valibot validation
- Consolidated session fetching with backwards compatibility

**Chart Utilities** (`src/lib/utils/chart-config.ts`)
- Reusable chart configuration factories
- Common color schemes and labels
- Tooltip formatters for percentages and scores
- DRY principle applied to eliminate ~150 lines of duplication

**Simplified Hooks**
- Minimal `hooks.server.ts` (50 lines, reduced from 131)
- Minimal `hooks.client.ts` (16 lines, reduced from 48)
- Removed unused CORS and session handlers
- Use `<svelte:boundary>` for component-level error handling

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
│   │   ├── sessionState.svelte.ts     # Unified reactive state
│   │   └── sse.svelte.ts              # SSE client management
│   ├── server/
│   │   ├── db/
│   │   │   ├── index.ts               # Database client
│   │   │   └── schema.ts              # Drizzle schema
│   │   └── sse-manager.ts             # SSE management
│   ├── utils/
│   │   └── chart-config.ts            # Reusable chart utilities
│   └── components/
│       ├── charts/
│       │   ├── Chart.svelte           # Chart wrapper
│       │   └── WordCloud.svelte       # D3 word cloud
│       └── QRCode.svelte              # QR code generator
└── routes/
    └── session/
        └── [sessionId]/
            ├── presenter/
            │   ├── +page.svelte       # Dashboard (uses chart utils)
            │   └── presenter.remote.ts # Consolidated functions
            └── attendee/
                ├── +page.svelte       # Quiz interface
                └── attendee.remote.ts # Attendee operations
```

## Remote Functions API

### Attendee Operations (`attendee.remote.ts`)
- `joinSession({ sessionId, name, generation })` - Join with validation
- `saveResponse({ sessionId, attendeeId, questionId, answer })` - Save answer
- `completeQuiz({ sessionId, attendeeId })` - Submit and calculate scores
- `loadAttendeeData({ sessionId, attendeeId })` - Fetch current state

### Presenter Operations (`presenter.remote.ts`)
- `createSession({ name })` - Initialize with unique ID
- `fetchSessionData({ identifier, byCode?, includeAttendees? })` - Unified fetching
- `getSession(sessionId)` - Backwards compatible alias
- `getSessionByCode(code)` - Backwards compatible alias
- `generateAIInsights({ sessionId, focusArea })` - AI analysis (requires OPENAI_API_KEY)
- `endSession({ sessionId })` - Mark as ended
- `deleteAttendee({ sessionId, attendeeId })` - Remove participant

## Recent Optimizations (August 2024)

### Code Reduction: ~200 lines eliminated
1. **Consolidated Remote Functions**: 3 functions → 1 unified `fetchSessionData`
2. **Simplified Hooks**: 60-67% reduction in hooks code
3. **SSE Effects Consolidated**: 3 effects → 1 using `$effect.root`
4. **Chart Utilities Extracted**: Eliminated ~150 lines of duplication
5. **DRY Principles Applied**: Reusable patterns throughout

### Performance Optimizations
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

### Svelte 5 Patterns

- **State**: Use `$state` for reactive values
- **Computed**: Use `$derived` for derived values
- **Effects**: Use `$effect` sparingly
- **Props**: Use `$props()` for component properties
- **DOM Refs**: Use `bind:this` for DOM element references (not `{@attach}`)
- **Two-way Binding**: Use `bind:value` for form inputs

### Snippets Pattern
Use Svelte 5 snippets (`{#snippet}`) for repeated template patterns within components:
```svelte
{#snippet chartContainer(title: string, config: ChartConfiguration)}
  <div class="bg-white rounded-lg shadow-lg p-8">
    <h2 class="text-2xl font-semibold text-gray-800 mb-4">{title}</h2>
    <ChartComponent {config} />
  </div>
{/snippet}

<!-- Usage -->
{@render chartContainer("Chart Title", chartConfig)}
```

**When to use snippets vs components:**
- **Snippets**: For repeated patterns within the same component (keeps code DRY)
- **Components**: For reusable functionality across multiple files
- Keep snippets inline in the component where they're used for better readability

### Attachment Pattern (`{@attach}`)
For advanced DOM behaviors that need lifecycle management:
```svelte
function behaviorAttachment(node: HTMLElement) {
  // Setup logic
  return () => {
    // Cleanup logic
  };
}

<div {@attach behaviorAttachment}></div>
```
Note: `bind:this` is still the correct pattern for simple DOM references.

### General Best Practices
- **Types**: Explicit types, avoid `any`
- **Validation**: Valibot schemas for all inputs
- **Errors**: Proper error boundaries
- **Parallel Ops**: Use `Promise.all` for concurrent queries