# CLAUDE.md - Complete Development Guide

This file provides comprehensive guidance for working with the PPT Quiz App codebase.

## Project Overview

A SvelteKit 5 application for interactive workplace preference analysis. Presenters create sessions with QR codes for participant access, featuring real-time analytics and preference scoring. No authentication required - fully open access with cookie-based participant tracking.

## Technology Stack

- **Framework**: SvelteKit 5 with Svelte 5 runes (`$state`, `$derived`, `$effect`)
- **State Management**: Simplified reactive state with Svelte 5 runes
- **Remote Functions**: SvelteKit experimental remote functions with `query` and `command` wrappers
- **Database**: SQLite with Drizzle ORM (WAL2 mode enabled)
- **Validation**: Valibot schemas for all remote function inputs
- **Error Handling**: `<svelte:boundary>` for runtime errors, reactive error states
- **Attachments**: `{@attach ...}` for reactive DOM interactions and effects
- **AI Integration**: OpenAI API for workplace insights and recommendations
- **Styling**: TailwindCSS with custom UI components
- **Charts**: Chart.js and D3.js with reusable configuration utilities

## Commands

- **Dev**: `npm run dev` (port 5173 with --host)
- **Build**: `npm run build`
- **Preview**: `npm run preview` (with --host)
- **Start**: `npm start`
- **DB**: `npm run db:generate`, `npm run db:migrate`, `npm run db:push`, `npm run db:studio`
- **Type check**: `npx svelte-check --tsconfig ./tsconfig.json`

## Code Style

- **Svelte 5**: Use `$state`, `$derived`, `$effect` runes
- **Imports**: `$lib/` for internal, relative paths for local
- **Types**: Strict TypeScript (interfaces/types in dedicated files)
- **Naming**: camelCase variables/functions, PascalCase components/types
- **Components**: Use `$props()`, snippets for children, Tailwind CSS
- **Validation**: Valibot schemas for all remote function inputs
- **Error handling**: `<svelte:boundary>` for runtime errors, `{#if error}` for reactive state
- **Attachments**: `{@attach ...}` for reactive DOM interactions and effects
- **State**: Simplified reactive state with proper cleanup
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
        ├── quiz.svelte.ts            # Participant state management
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

## Modern Svelte 5 Features

### {@attach ...} Reactive Attachments

Svelte 5's `{@attach ...}` provides reactive DOM interactions that automatically re-run when dependencies change:

#### Attachment Factory Pattern
```typescript
// Create reusable attachment factories
function tooltip(content: string) {
  return (element: HTMLElement) => {
    // Setup tooltip
    const tooltip = createTooltip(element, content);

    // Return cleanup function
    return () => tooltip.destroy();
  };
}
```

#### Usage in Components
```svelte
<script>
  import { tooltip } from '$lib/utils/attachments';
</script>

<button {@attach tooltip('Click me!')}>
  Hover for tooltip
</button>
```

#### Available Attachment Utilities (`$lib/utils/attachments.ts`)

- **`intersectionObserver(callback, options)`** - Lazy loading, scroll animations
- **`clickOutside(callback)`** - Close dropdowns/modals when clicking outside
- **`focusTrap()`** - Keyboard navigation containment for modals
- **`resizeObserver(callback)`** - Respond to element size changes
- **`autoResize(minHeight)`** - Auto-growing textareas
- **`scrollListener(callback, delay)`** - Debounced scroll events
- **`copyToClipboard(text, onSuccess, onError)`** - Copy text to clipboard
- **`longPress(callback, duration)`** - Long press detection for mobile

### Error Boundaries with `<svelte:boundary>`

Modern error handling using Svelte 5's boundary component:

#### Basic Error Boundary
```svelte
<ErrorBoundary title="Component Error">
  <RiskyComponent />
</ErrorBoundary>
```

#### Advanced Error Handling
```svelte
<svelte:boundary onerror={(error, reset) => reportError(error)}>
  {#snippet pending()}
    <div>Loading...</div>
  {/snippet}

  {#snippet failed(error, reset)}
    <div class="error">
      <p>Something went wrong: {error.message}</p>
      <button onclick={reset}>Try Again</button>
    </div>
  {/snippet}

  <UnstableComponent />
</svelte:boundary>
```

### AI Integration Features

#### OpenAI-Powered Insights
```typescript
// AI insights remote function
export const generateInsights = command(
  v.object({ sessionId: v.string() }),
  async ({ sessionId }) => {
    const analysis = await analyzeWorkplaceData(sessionId);

    const insights = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "user",
        content: `Analyze this workplace preference data: ${JSON.stringify(analysis)}`
      }]
    });

    return { insights: insights.choices[0].message.content };
  }
);
```

#### Graceful AI Fallbacks
```typescript
// Handle AI API failures gracefully
try {
  const insights = await generateInsights({ sessionId });
  return { success: true, insights };
} catch (error) {
  console.warn('AI insights unavailable:', error);
  return {
    success: true,
    insights: 'AI insights temporarily unavailable. Using basic analytics.'
  };
}
```

## Updated File Structure

### New Components
```
src/lib/components/shared/
├── ErrorBoundary.svelte      # Runtime error handling
├── Tooltip.svelte           # Reactive tooltips with {@attach ...}
├── Modal.svelte            # Accessible modals with focus trap
├── AttachmentDemo.svelte    # {@attach ...} examples and demos
└── ErrorMessage.svelte      # Display component for reactive errors
```

### Enhanced Utilities
```
src/lib/utils/
├── attachments.ts           # {@attach ...} utilities (NEW)
├── validation.ts            # Moved from lib root
├── scoring.ts               # Workplace preference calculations
├── common.ts                # Shared utility functions
├── id.ts                    # ID generation utilities
└── analytics.ts             # Analytics helpers
```

### AI Features
```
src/routes/admin/[code]/
├── ai-insights.remote.ts    # AI-powered insights (NEW)
└── data.remote.ts           # Enhanced with AI integration
```

## Component Patterns

### Modern Component with Attachments
```svelte
<script lang="ts">
  import { autoResize, focusTrap } from '$lib/utils/attachments';
  import ErrorBoundary from '$lib/components/shared/ErrorBoundary.svelte';

  let feedback = $state('');
  let showModal = $state(false);
</script>

<ErrorBoundary title="Feedback Form Error">
  <form {@attach focusTrap()}>
    <textarea
      {@attach autoResize(60)}
      bind:value={feedback}
      placeholder="Enter your feedback..."
    />

    <button type="submit">Submit</button>
  </form>
</ErrorBoundary>
```

### Reactive Tooltip Component
```svelte
<script lang="ts">
  import { tooltip } from '$lib/utils/attachments';

  interface Props {
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    children?: any;
  }

  let { content, position = 'top', children }: Props = $props();
</script>

<div {@attach tooltip(content, position)}>
  {@render children?.()}
</div>
```

### Modal with Multiple Attachments
```svelte
<script lang="ts">
  import { clickOutside, focusTrap } from '$lib/utils/attachments';

  let modalRef: HTMLElement;
  let open = $state(false);
</script>

{#if open}
  <div
    {@attach clickOutside(() => open = false)}
    class="modal-backdrop"
  >
    <div
      bind:this={modalRef}
      {@attach focusTrap()}
      class="modal-content"
    >
      <slot />
    </div>
  </div>
{/if}
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

### Modern Svelte 5 Patterns

#### Use `{@attach ...}` for Reactive DOM Interactions
```svelte
<!-- ✅ Modern approach -->
<button {@attach tooltip('Click me!')}>Action</button>

<!-- ❌ Legacy approach -->
<button use:tooltip={{ content: 'Click me!' }}>Action</button>
```

#### Implement Error Boundaries for Runtime Errors
```svelte
<!-- ✅ Modern error handling -->
<ErrorBoundary title="Component Error">
  <RiskyComponent />
</ErrorBoundary>

<!-- ❌ Manual error handling -->
{#if error}
  <div class="error">{error}</div>
{/if}
```

#### Leverage AI Features with Graceful Fallbacks
```typescript
// ✅ AI with fallback
try {
  const insights = await generateInsights({ sessionId });
  return { success: true, insights };
} catch (error) {
  return {
    success: true,
    insights: 'AI insights unavailable. Using basic analytics.'
  };
}
```

### Core Development Principles

- **Use remote functions** for all server operations with `query` and `command`
- **Validate all inputs** with Valibot schemas for type safety
- **Handle errors gracefully** with optimistic updates and rollback
- **Use server-side data loading** for initial renders and SEO
- **Keep client state minimal** with unified state management
- **Prefer derived state** over manual updates with `$derived` and `$derived.by()`
- **Always implement proper cleanup** in `$effect` with return functions
- **Use TypeScript interfaces** for all component props and utilities
- **Leverage Svelte 5 snippets** for reusable UI patterns
- **Implement accessibility** with focus traps and proper ARIA labels

### Performance Optimization

#### Reactive State Optimization
```typescript
// ✅ Efficient derived computations
let expensiveCalculation = $derived.by(() => {
  // Only runs when dependencies change
  return heavyComputation(data);
});

// ❌ Inefficient manual updates
let expensiveCalculation = $state(null);
$effect(() => {
  expensiveCalculation = heavyComputation(data); // Runs on every change
});
```

#### Memory Management
```typescript
// ✅ Proper cleanup
$effect(() => {
  const subscription = websocket.subscribe(handleUpdate);
  const timer = setInterval(poll, 5000);

  return () => {
    subscription.unsubscribe();
    clearInterval(timer);
  };
});
```

#### Bundle Optimization
- Use dynamic imports for heavy libraries
- Implement code splitting for routes
- Tree-shake unused utilities
- Optimize images and assets

### Testing Modern Features

#### Testing {@attach ...} Utilities
```typescript
import { clickOutside } from '$lib/utils/attachments';

// Test attachment behavior
describe('clickOutside', () => {
  it('calls callback when clicking outside', () => {
    const callback = vi.fn();
    const element = document.createElement('div');

    clickOutside(callback)(element);

    // Simulate click outside
    document.body.click();
    expect(callback).toHaveBeenCalled();
  });
});
```

#### Testing Error Boundaries
```svelte
<!-- Test error boundary behavior -->
<ErrorBoundary title="Test Error">
  <ComponentThatThrows />
</ErrorBoundary>
```

#### Testing AI Features
```typescript
// Test AI with mocked responses
describe('AI Insights', () => {
  it('handles API failures gracefully', async () => {
    // Mock OpenAI API failure
    vi.mocked(openai.chat.completions.create).mockRejectedValue(
      new Error('API unavailable')
    );

    const result = await generateInsights({ sessionId: 'test' });
    expect(result.insights).toContain('unavailable');
  });
});
```

### Deployment Considerations

#### Environment Configuration
```env
# Production settings
NODE_ENV=production
DATABASE_URL=./data/production.db
PUBLIC_APP_URL=https://your-domain.com
OPENAI_API_KEY=your-production-key

# Performance monitoring
SENTRY_DSN=your-sentry-dsn
ANALYTICS_ID=your-analytics-id
```

#### Build Optimization
- Enable source maps for debugging
- Configure proper caching headers
- Implement CDN for static assets
- Set up error tracking and monitoring
- Configure log aggregation

This documentation reflects the modern Svelte 5 architecture with cutting-edge patterns for reactive DOM interactions, error boundaries, and AI-powered features.