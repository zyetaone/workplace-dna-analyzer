# Svelte 5 State Management Guide

This guide demonstrates the modernized state management patterns using Svelte 5 runes in this codebase.

## Core Concepts

### 1. State Classes with Runes

All state management is now handled through classes that use Svelte 5's reactive runes:
- `$state` - For reactive state values
- `$derived` - For computed values
- `$effect` - For side effects (used sparingly)

### 2. State Architecture

```
src/
├── routes/dashboard/
│   ├── dashboard.svelte.ts       # Dashboard state class
│   └── [slug]/
│       ├── presenter.svelte.ts   # Presenter state class
│       └── p/[id]/quiz/
│           └── quiz.svelte.ts    # Quiz state class
└── lib/state/
    └── index.ts                  # Central state utilities
```

## Usage Examples

### Dashboard State

```typescript
// In a component
<script lang="ts">
import { dashboardState } from '../dashboard.svelte.ts';

// Direct access to reactive state
let sessions = $derived(dashboardState.sessions);
let isLoading = $derived(dashboardState.isLoading);

// Derived analytics are automatically reactive
let analytics = $derived(dashboardState.analytics);

// Mutations through methods
function loadSessions() {
  dashboardState.setLoading(true);
  // ... fetch data
  dashboardState.setSessions(data);
  dashboardState.setLoading(false);
}
</script>

<!-- Template automatically reacts to state changes -->
{#if isLoading}
  <LoadingScreen />
{:else}
  <h2>Response Rate: {analytics.responseRate}%</h2>
{/if}
```

### Quiz State

```typescript
// Creating a quiz instance
<script lang="ts">
import { createQuizState } from './quiz.svelte.ts';

// Create instance
const quiz = createQuizState();

// Initialize with data
quiz.initialize(participant, sessionId, sessionSlug);

// Use derived values - automatically reactive
let progress = $derived(quiz.progress);
let canProceed = $derived(quiz.canProceed);
let currentQuestion = $derived(quiz.currentQuestion);

// Handle interactions
function selectOption(optionId: string) {
  quiz.selectOption(optionId);
}

function nextQuestion() {
  if (quiz.validateCurrentResponse()) {
    quiz.nextQuestion();
  }
}
</script>

<!-- UI automatically updates -->
<div class="progress-bar">
  <div style="width: {progress}%"></div>
</div>

{#if currentQuestion}
  <h2>{currentQuestion.text}</h2>
  {#each currentQuestion.options as option}
    <button 
      onclick={() => selectOption(option.id)}
      class:selected={quiz.isOptionSelected(option.id)}
    >
      {option.text}
    </button>
  {/each}
{/if}

<button disabled={!canProceed} onclick={nextQuestion}>
  {quiz.isLastQuestion ? 'Submit' : 'Next'}
</button>
```

### Presenter State

```typescript
<script lang="ts">
import { createPresenterState } from './presenter.svelte.ts';

const presenter = createPresenterState();

// Initialize session
presenter.initialize(session, participants);

// Reactive derived values
let activeCount = $derived(presenter.activeCount);
let responseRate = $derived(presenter.responseRate);
let statusMessage = $derived(presenter.statusMessage);
let statusColor = $derived(presenter.statusColor);

// Real-time updates
function handleRealtimeUpdate(update) {
  presenter.processUpdate(update);
}

// Cleanup on unmount
$effect(() => {
  return () => presenter.cleanup();
});
</script>

<div class="status {statusColor}">
  {statusMessage}
</div>

<div class="metrics">
  <div>Active: {activeCount}</div>
  <div>Response Rate: {responseRate}%</div>
</div>
```

## Key Patterns

### 1. Private State with Public Getters

```typescript
class StateClass {
  private _value = $state(0);
  
  get value() { return this._value; }
  
  setValue(val: number) {
    this._value = val;
  }
}
```

### 2. Derived Computations

```typescript
class StateClass {
  private _items = $state<Item[]>([]);
  
  // Simple derived
  totalCount = $derived(this._items.length);
  
  // Complex derived with .by()
  statistics = $derived.by(() => {
    // Complex computation
    return computeStats(this._items);
  });
}
```

### 3. Effect Management

```typescript
// In component, not in state class
$effect(() => {
  // Setup
  const interval = setInterval(() => {
    fetchUpdates();
  }, 5000);
  
  // Cleanup
  return () => clearInterval(interval);
});
```

### 4. State Persistence

```typescript
import { persistState, restoreState } from '$lib/state';

class StateClass {
  private _data = $state(restoreState('myData', defaultValue));
  
  constructor() {
    // Auto-persist on changes
    persistState('myData', this._data);
  }
}
```

### 5. Batch Updates

```typescript
import { batchUpdates } from '$lib/state';

function updateMultiple() {
  batchUpdates([
    () => state.setValue1(10),
    () => state.setValue2(20),
    () => state.setValue3(30)
  ]);
}
```

## Migration from Old Patterns

### Before (Svelte 4 Stores)
```typescript
import { writable, derived } from 'svelte/store';

const count = writable(0);
const doubled = derived(count, $count => $count * 2);

// In component
$: currentCount = $count;
```

### After (Svelte 5 Runes)
```typescript
class State {
  private _count = $state(0);
  
  get count() { return this._count; }
  doubled = $derived(this._count * 2);
  
  increment() {
    this._count++;
  }
}

// In component
const state = new State();
let count = $derived(state.count);
let doubled = $derived(state.doubled);
```

## Best Practices

1. **Keep state classes focused** - Each class should manage a specific domain
2. **Use private fields with getters** - Prevents external mutation
3. **Prefer $derived over $effect** - Computations are better than side effects
4. **Initialize in constructors or init methods** - Keep setup logic organized
5. **Provide cleanup methods** - For components to call on unmount
6. **Type everything** - Full TypeScript typing for safety
7. **Avoid nested reactivity** - Keep state structures flat when possible

## Testing State

```typescript
import { describe, it, expect } from 'vitest';
import { QuizState } from './quiz.svelte.ts';

describe('QuizState', () => {
  it('should calculate progress correctly', () => {
    const state = new QuizState();
    state.initialize(participant, sessionId, slug);
    
    expect(state.progress).toBe(0);
    
    state.selectOption('option1');
    state.nextQuestion();
    
    expect(state.progress).toBeGreaterThan(0);
  });
});
```

## Performance Considerations

1. **Use untrack() for non-reactive reads** in loops
2. **Batch updates** when modifying multiple values
3. **Keep derived computations simple** - Complex logic can be memoized
4. **Avoid deep object mutations** - Replace objects instead
5. **Use $effect.root()** sparingly for independent effects

## Common Pitfalls to Avoid

1. ❌ Don't use `$effect` for computations - use `$derived`
2. ❌ Don't mutate state directly from outside the class
3. ❌ Don't forget cleanup in effects
4. ❌ Don't nest state classes unnecessarily
5. ❌ Don't mix stores and runes - pick one pattern

## Summary

The modernized state management provides:
- ✅ Full reactivity with Svelte 5 runes
- ✅ Type-safe state management
- ✅ Clear separation of concerns
- ✅ Automatic cleanup and lifecycle management
- ✅ Better performance through compile-time optimizations
- ✅ Simpler mental model than stores

All state is now managed through three main classes:
- `DashboardState` - Overall dashboard and session management
- `PresenterState` - Live presentation session state
- `QuizState` - Individual quiz/survey state

Each provides reactive values through `$derived` runes and controlled mutations through methods, ensuring a predictable and maintainable state architecture.