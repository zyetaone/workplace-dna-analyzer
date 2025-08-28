# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A SvelteKit 5 application for interactive workplace preference analysis. Presenters create sessions with QR codes for participant access, featuring real-time analytics and preference scoring. No authentication required - fully open access with cookie-based participant tracking.

## Technology Stack

- **Framework**: SvelteKit 5 with Svelte 5 runes (`$state`, `$derived`, `$effect`)
- **State Management**: Class-based reactive state with unified session store
- **Remote Functions**: SvelteKit experimental remote functions with `query` and `command` wrappers
- **Database**: SQLite with Drizzle ORM (WAL2 mode enabled)
- **Validation**: Valibot schemas for all remote function inputs
- **Styling**: TailwindCSS with custom UI components
- **Charts**: Chart.js and D3.js with reusable configuration utilities
- **Build**: Vite with SvelteKit adapter-node

## Development Commands

```bash
# Development
npm run dev              # Start dev server with --host (port 5173)
npm run preview          # Preview production build with --host
npm run build            # Build for production
npm start                # Start production server

# Database operations  
npm run db:generate      # Generate Drizzle migrations
npm run db:migrate       # Apply migrations  
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Drizzle Studio GUI

# Project management
npm run prepare          # SvelteKit sync (auto-run on install)
```

## Architecture Overview

### Route Structure
- **`/`** - Landing page
- **`/admin`** - Admin dashboard for session management (no login required)
- **`/admin/[code]`** - Session analytics dashboard
- **`/[code]`** - Participant join page (cookie-tracked)
- **`/[code]/quiz`** - Quiz interface
- **`/[code]/complete`** - Quiz completion with scores

### Key Files
```
src/
├── lib/
│   ├── stores/sessions.svelte.ts          # Unified session store (central state)
│   ├── components/
│   │   ├── ui/                            # Reusable UI components
│   │   │   ├── StatsCard.svelte
│   │   │   └── ConfirmationDialog.svelte
│   │   ├── charts/                        # Chart components (Chart.js & D3)
│   │   │   ├── Chart.svelte
│   │   │   ├── D3RadarChart.svelte
│   │   │   ├── D3BarChart.svelte
│   │   │   ├── D3DonutChart.svelte
│   │   │   └── WordCloud.svelte
│   │   └── LoadingSpinner.svelte
│   ├── server/db/                         # Database layer (Drizzle + SQLite)
│   └── utils/                             # Utilities (chart config, analytics)
└── routes/
    ├── admin/
    │   ├── admin.remote.ts                # Admin remote functions
    │   ├── admin.svelte.ts                # Admin dashboard state
    │   └── [code]/
    │       └── session-analytics.svelte.ts # SessionAnalyticsState class
    └── [code]/
        ├── presenter.svelte.ts            # Participant state management
        └── *.svelte                       # Clean component pages
```

## Remote Functions Pattern

All server operations use SvelteKit's experimental remote functions:

```typescript
// Example: presenter.remote.ts
import { query, command } from '$app/server';
import * as v from 'valibot';

export const getSessionAnalytics = query(
  v.object({ sessionId: v.string() }),
  async ({ sessionId }) => {
    // Query database and return data
  }
);

export const createSession = command(
  v.object({ title: v.string() }),
  async ({ title }) => {
    // Create session and return result
  }
);
```

## Database Schema

```typescript
// Sessions table - no authentication required
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  code: text('code').notNull().unique(),         // 6-char session code (uppercase)
  name: text('name').notNull(),                  // Session title/name
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  endedAt: text('ended_at')                      // When session was manually ended
});

// Participants table - cookie-based anonymous tracking
export const participants = sqliteTable('participants', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  sessionId: text('session_id').notNull().references(() => sessions.id),
  cookieId: text('cookie_id').unique(),          // Anonymous cookie tracking
  name: text('name'),                            // Optional until proper join
  generation: text('generation'),               // Baby Boomer, Gen X, Millennial, Gen Z
  responses: text('responses', { mode: 'json' }).$type<Record<number, any>>().default({}),
  preferenceScores: text('preference_scores', { mode: 'json' }).$type<{
    collaboration: number;
    formality: number; 
    tech: number;
    wellness: number;
  }>(),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  joinedAt: text('joined_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt: text('completed_at')
});

// Type exports
export type Session = typeof sessions.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type SessionWithCounts = Session & {
  activeCount: number;
  completedCount: number;
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

## Key Patterns

### Svelte 5 Patterns in Practice

#### Unified Store Usage
```svelte
<script lang="ts">
  import { sessionsStore } from '$lib/stores/sessions.svelte';
  
  // Get session analytics state
  const sessionState = sessionsStore.getSession(code);
  
  // Reactive access to computed properties
  $: analytics = sessionState.analytics;
  $: chartConfigs = sessionState.chartConfigs;
  $: sessionInfo = sessionState.sessionInfo;
  
  // Actions with optimistic updates
  async function removeParticipant(id: string) {
    const result = await sessionState.removeParticipant(id);
    if (!result.success) {
      // Error handled automatically with rollback
      showToast(result.error, 'error');
    }
  }
</script>
```

#### Component Props with Snippets
```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  
  interface StatsCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    loading?: boolean;
    icon?: Snippet;
  }
  
  let { title, value, subtitle, loading = false, icon }: StatsCardProps = $props();
</script>

<div class="stats-card">
  {#if icon}
    {@render icon()}
  {/if}
  <h3>{title}</h3>
  <p class="value">{loading ? '...' : value}</p>
  {#if subtitle}
    <p class="subtitle">{subtitle}</p>
  {/if}
</div>
```

#### Real-time State Updates
```svelte
<script lang="ts">
  import { getSessionStore } from '$lib/stores/sessions.svelte';
  
  const { code } = $props<{ code: string }>();
  const sessionState = getSessionStore(code);
  
  // Auto-refresh every 5 seconds
  $effect(() => {
    const interval = setInterval(() => {
      if (!sessionState.loading) {
        sessionState.refresh();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  });
  
  // Load data on mount
  $effect(async () => {
    await sessionState.loadAnalytics(code);
  });
</script>
```

#### Advanced Derived State
```svelte
<script lang="ts">
  let participants = $state<Participant[]>([]);
  
  // Complex derived computations
  let analytics = $derived.by(() => {
    const completed = participants.filter(p => p.completed);
    const total = participants.length;
    
    return {
      completionRate: total > 0 ? Math.round((completed.length / total) * 100) : 0,
      averageScore: completed.length > 0 
        ? completed.reduce((sum, p) => sum + p.totalScore, 0) / completed.length 
        : 0,
      generationBreakdown: groupBy(participants, 'generation')
    };
  });
</script>
```

## Modern Svelte 5 State Management

### Class-Based Reactive State
All state is managed through TypeScript classes using Svelte 5 runes:
- `$state` for reactive data
- `$derived` for computed properties  
- `$effect` for side effects with proper cleanup

### Unified Session Store
Single source of truth at `/lib/stores/sessions.svelte.ts`:
- Manages multiple session instances via `SessionsStore` class
- Real-time updates between admin and participant views
- Memory-efficient with automatic cleanup
- Uses `Map<string, SessionAnalyticsState>` for session state management

### SessionAnalyticsState Class
Each session has its own reactive state instance:
```typescript
export class SessionAnalyticsState {
  // Core reactive state
  session = $state<Session | null>(null);
  participants = $state<Participant[]>([]);
  loading = $state(false);
  error = $state<string | null>(null);
  
  // Computed analytics using $derived
  analytics = $derived({
    activeCount: this.participants.length,
    completedCount: this.participants.filter(p => p.completed).length,
    responseRate: this.calculateResponseRate(),
    preferenceScores: this.calculateAverageScores(),
    workplaceDNA: this.getWorkplaceDNA()
  });
  
  // Chart configurations
  chartConfigs = $derived({
    generation: createGenerationChartConfig(this.analytics.generationDistribution),
    radar: createPreferenceRadarConfig(this.analytics.preferenceScores),
    bar: createChartConfig(this.analytics.preferenceScores)
  });
}
```

### Error Handling & Recovery
- Runtime state validation
- Optimistic updates with rollback on failure
- Graceful error boundaries
- Automatic retry mechanisms

## State Management Best Practices

### When to Use $state vs $derived
- `$state`: For mutable reactive data (user input, loading states, arrays)
- `$derived`: For computed values that depend on other state
- `$derived.by()`: For expensive computations that need caching

### Proper Cleanup in $effect
```typescript
$effect(() => {
  const subscription = websocket.subscribe(handleUpdate);
  const timer = setInterval(refresh, 5000);
  
  // Always return cleanup function
  return () => {
    subscription.unsubscribe();
    clearInterval(timer);
  };
});
```

### Memory Management Strategies
- Use `sessionsStore.clearSession(code)` when navigating away
- Implement automatic cleanup for inactive sessions
- Avoid storing large objects in reactive state unnecessarily

### Performance Optimization Techniques
- Use `$derived.by()` for expensive computations
- Implement optimistic updates with rollback
- Batch multiple state updates when possible
- Use memoization for chart configurations

## Development Best Practices

- Use remote functions for all server operations
- Validate all inputs with Valibot schemas
- Handle errors gracefully with optimistic updates and rollback
- Use server-side data loading for initial renders
- Keep client state minimal with unified state management
- Prefer derived state over manual updates
- Always implement proper cleanup in effects
- Use TypeScript interfaces for all component props
- Leverage Svelte 5 snippets for reusable UI patterns