# Modern Svelte 5 Best Practices Guide

## 🎯 Overview

This guide showcases the most modern and efficient patterns for Svelte 5 development, focusing on runes, remote functions, and web standards. The refactored codebase demonstrates these patterns in action.

## 🔥 Core Svelte 5 Runes Patterns

### 1. **Reactive State with `$state`**

```typescript
// Modern reactive state management
export class ModernSessionStore {
  // Core reactive state
  session = $state<Session | null>(null);
  participants = $state<Participant[]>([]);
  loading = $state(false);
  error = $state<string | null>(null);

  // Advanced loading states
  loadingStates = $state({
    initial: false,
    updating: false,
    deleting: false
  });
}
```

**Best Practices:**
- ✅ Use `$state` for all reactive data
- ✅ Group related state into objects
- ✅ Use descriptive property names
- ✅ Initialize with sensible defaults

### 2. **Computed Values with `$derived`**

```typescript
// Advanced reactive computations
analytics = $derived.by(() => {
  const completed = this.participants.filter(p => p.completed);
  const active = this.participants.filter(p => !p.completed);

  return {
    totalParticipants: this.participants.length,
    completedCount: completed.length,
    activeCount: active.length,
    completionRate: this.participants.length > 0
      ? Math.round((completed.length / this.participants.length) * 100)
      : 0,
    averageScores: completed.length > 0 ? {
      collaboration: Math.round(completed.reduce((sum, p) => sum + (p.preferenceScores?.collaboration || 0), 0) / completed.length),
      formality: Math.round(completed.reduce((sum, p) => sum + (p.preferenceScores?.formality || 0), 0) / completed.length),
      tech: Math.round(completed.reduce((sum, p) => sum + (p.preferenceScores?.tech || 0), 0) / completed.length),
      wellness: Math.round(completed.reduce((sum, p) => sum + (p.preferenceScores?.wellness || 0), 0) / completed.length)
    } : { collaboration: 0, formality: 0, tech: 0, wellness: 0 }
  };
});

// Simple derived values
isActive = $derived(() => this.session?.isActive ?? false);
hasParticipants = $derived(() => this.participants.length > 0);
completionPercentage = $derived(() => this.analytics.completionRate);
```

**Best Practices:**
- ✅ Use `$derived.by()` for complex computations
- ✅ Use `$derived()` for simple property access
- ✅ Cache expensive calculations
- ✅ Return immutable objects

### 3. **Side Effects with `$effect`**

```typescript
// Modern polling hook with Svelte 5 effects
export function useModernPolling(
  store: ModernSessionStore,
  intervalMs = 8000
) {
  let pollInterval = $state<ReturnType<typeof setInterval> | null>(null);

  $effect(() => {
    // Start polling
    pollInterval = setInterval(() => {
      if (!store.loadingStates.initial && !store.loadingStates.updating) {
        store.refresh();
      }
    }, intervalMs);

    // Cleanup on effect re-run or unmount
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };
  });

  return {
    stop: () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    },
    restart: () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      pollInterval = setInterval(() => {
        if (!store.loadingStates.initial && !store.loadingStates.updating) {
          store.refresh();
        }
      }, intervalMs);
    }
  };
}
```

**Best Practices:**
- ✅ Always return cleanup functions
- ✅ Handle component unmounting
- ✅ Use proper TypeScript types
- ✅ Avoid memory leaks

## 🚀 Remote Functions Pattern

### 1. **Server-Side Operations**

```typescript
// Consolidated server operations
export const getSessionWithParticipants = query(
  v.object({ code: sessionCodeSchema }),
  async ({ code }) => {
    const session = await getSession({ code });
    const sessionParticipants = await db
      .select()
      .from(participants)
      .where(eq(participants.sessionId, session.id))
      .orderBy(desc(participants.joinedAt));

    return { session, participants: sessionParticipants };
  }
);
```

### 2. **Client-Side Wrappers**

```typescript
// Client-side remote function wrappers
export const getSessionData = query(
  v.object({ code: sessionCodeSchema }),
  async ({ code }) => {
    return await getSessionWithParticipants({ code });
  }
);
```

### 3. **Component Usage**

```svelte
<script lang="ts">
  import { getSessionData } from '$lib/server/session-operations';

  let session = $state(null);
  let participants = $state([]);

  async function loadSession(code: string) {
    const result = await getSessionData({ code });
    session = result.session;
    participants = result.participants;
  }
</script>
```

**Best Practices:**
- ✅ Separate server and client concerns
- ✅ Use Valibot for validation
- ✅ Handle errors gracefully
- ✅ Use proper TypeScript types

## 🌐 Modern Web Standards

### 1. **Progressive Enhancement**

```typescript
// Graceful degradation with feature detection
async function copyToClipboard(text: string): Promise<boolean> {
  // Check for modern clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  }

  // Fallback for older browsers
  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();

  try {
    document.execCommand('copy');
    return true;
  } catch (err) {
    console.error('Fallback copy failed:', err);
    return false;
  } finally {
    document.body.removeChild(textArea);
  }
}
```

### 2. **Performance Optimization**

```typescript
// Debounced operations
private refreshTimeout = $state<ReturnType<typeof setTimeout> | null>(null);

refresh = () => {
  if (!this.session) return;

  // Debounce rapid refresh calls
  if (this.refreshTimeout) {
    clearTimeout(this.refreshTimeout);
  }

  this.refreshTimeout = setTimeout(() => {
    this.load(this.session!.code);
  }, 300);
};
```

### 3. **Memory Management**

```typescript
// Automatic cleanup with timeouts
const stores = new Map<string, ModernSessionStore>();
const storeTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

export function getModernSessionStore(code: string): ModernSessionStore {
  // Clear existing timeout for this code
  const existingTimeout = storeTimeouts.get(code);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  // Set new cleanup timeout (30 minutes of inactivity)
  const timeout = setTimeout(() => {
    const store = stores.get(code);
    if (store) {
      store.destroy();
      stores.delete(code);
    }
    storeTimeouts.delete(code);
  }, 30 * 60 * 1000);

  storeTimeouts.set(code, timeout);

  return stores.get(code) ?? (stores.set(code, new ModernSessionStore()), stores.get(code)!);
}
```

## 🎨 Component Patterns

### 1. **Modern Component Props**

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface ModernCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    loading?: boolean;
    icon?: Snippet;
    variant?: 'default' | 'success' | 'warning' | 'error';
  }

  let {
    title,
    value,
    subtitle,
    loading = false,
    icon,
    variant = 'default'
  }: ModernCardProps = $props();
</script>

<div class="modern-card" class:loading class:variant-{variant}>
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

### 2. **Event Handling**

```svelte
<script lang="ts">
  function handleAction(event: Event & { currentTarget: HTMLButtonElement }) {
    // Modern event handling with proper typing
    const button = event.currentTarget;
    const action = button.dataset.action;

    if (action === 'refresh') {
      refresh();
    } else if (action === 'toggle') {
      toggleActive();
    }
  }
</script>

<button
  onclick={handleAction}
  data-action="refresh"
  disabled={loading}
  aria-label="Refresh data"
>
  Refresh
</button>
```

## 📱 Responsive Design

### 1. **Modern CSS with Container Queries**

```css
.modern-card {
  container-type: inline-size;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

@container (min-width: 300px) {
  .modern-card {
    padding: 1.5rem;
  }
}

@container (min-width: 500px) {
  .modern-card {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
}
```

### 2. **Dark Mode Support**

```svelte
<script lang="ts">
  // Reactive color scheme detection
  let colorScheme = $state<'light' | 'dark'>('light');

  $effect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    colorScheme = mediaQuery.matches ? 'dark' : 'light';

    const handler = (e: MediaQueryListEvent) => {
      colorScheme = e.matches ? 'dark' : 'light';
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  });
</script>

<div class="app" class:dark={colorScheme === 'dark'}>
  <!-- Content -->
</div>
```

## 🔧 Development Best Practices

### 1. **TypeScript Integration**

```typescript
// Comprehensive type definitions
interface SessionAnalytics {
  totalParticipants: number;
  completedCount: number;
  activeCount: number;
  completionRate: number;
  averageScores: {
    collaboration: number;
    formality: number;
    tech: number;
    wellness: number;
  };
}

// Generic error handling
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

async function safeAsyncOperation<T>(op: () => Promise<T>): Promise<Result<T>> {
  try {
    const data = await op();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

### 2. **Testing Patterns**

```typescript
// Modern testing with Svelte 5
import { describe, it, expect, vi } from 'vitest';
import { tick } from 'svelte';
import ModernSessionStore from './modern-session-store.svelte';

describe('ModernSessionStore', () => {
  it('should handle optimistic updates with rollback', async () => {
    const store = new ModernSessionStore();
    const mockUpdate = vi.fn().mockResolvedValue({ success: false });

    // Test optimistic update
    store.session = { id: '1', code: 'TEST', isActive: true } as Session;
    await store.toggleActive();

    // Verify rollback occurred
    expect(store.session.isActive).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
  });
});
```

## 🚀 Performance Patterns

### 1. **Virtual Scrolling**

```svelte
<script lang="ts">
  let container: HTMLElement;
  let visibleRange = $state({ start: 0, end: 10 });

  $effect(() => {
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Update visible range based on intersection
            const index = parseInt(entry.target.dataset.index || '0');
            visibleRange = {
              start: Math.max(0, index - 5),
              end: Math.min(participants.length, index + 15)
            };
          }
        });
      },
      { root: container, threshold: 0.1 }
    );

    return () => observer.disconnect();
  });
</script>

<div bind:this={container} class="virtual-list">
  {#each participants.slice(visibleRange.start, visibleRange.end) as participant, index (participant.id)}
    <div data-index={visibleRange.start + index}>
      <!-- Participant item -->
    </div>
  {/each}
</div>
```

### 2. **Web Workers for Heavy Computations**

```typescript
// worker.ts
self.onmessage = (e) => {
  const { participants } = e.data;

  // Heavy computation in worker
  const analytics = calculateComplexAnalytics(participants);

  self.postMessage({ analytics });
};

// Main thread
const worker = new Worker('./worker.ts');

function calculateAnalytics(participants: Participant[]) {
  return new Promise((resolve) => {
    worker.onmessage = (e) => resolve(e.data.analytics);
    worker.postMessage({ participants });
  });
}
```

## 🎯 Summary

The modern Svelte 5 patterns demonstrated in this refactored codebase provide:

- **🚀 Better Performance** - Optimized reactive state and computations
- **🛡️ Type Safety** - Comprehensive TypeScript integration
- **♻️ Maintainability** - Clean, modern code patterns
- **🌐 Web Standards** - Progressive enhancement and accessibility
- **📱 Responsive Design** - Modern CSS and component patterns
- **🔧 Developer Experience** - Better debugging and testing

These patterns represent the cutting edge of Svelte 5 development, combining the power of runes with modern web standards for robust, scalable applications.