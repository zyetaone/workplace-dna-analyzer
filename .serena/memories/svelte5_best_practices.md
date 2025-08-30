# Svelte 5 Best Practices & Patterns

## 🎯 Core Concepts

### Runes (State Management)
```typescript
// ✅ Modern Svelte 5 Runes
let count = $state(0);
let doubled = $derived(count * 2);
let expensive = $derived.by(() => heavyComputation(data));

$effect(() => {
  const timer = setInterval(() => count++, 1000);
  return () => clearInterval(timer); // Always cleanup!
});

// ❌ Don't use stores in Svelte 5 components
import { writable } from 'svelte/store'; // Avoid this
```

### Props Pattern
```typescript
// ✅ Correct props with $props()
interface Props {
  title: string;
  value?: number;
  onChange?: (val: number) => void;
}

let { title, value = 0, onChange }: Props = $props();

// ✅ Two-way binding with $bindable
let { count = $bindable(0) }: { count: number } = $props();
```

### Snippets (Replacing Slots)
```svelte
<!-- Parent -->
<Card>
  {#snippet header()}
    <h2>Title</h2>
  {/snippet}
  
  {#snippet footer()}
    <button>Action</button>
  {/snippet}
</Card>

<!-- Child (Card.svelte) -->
<script>
  let { header, footer, children } = $props();
</script>

<div class="card">
  {#if header}
    <header>{@render header()}</header>
  {/if}
  
  {@render children?.()}
  
  {#if footer}
    <footer>{@render footer()}</footer>
  {/if}
</div>
```

## 🔌 Attachments Pattern

### Basic Attachment
```typescript
// Create attachment function
function tooltip(text: string) {
  return (element: HTMLElement) => {
    // Setup
    const tooltip = createTooltip(element, text);
    
    // Return cleanup
    return () => tooltip.destroy();
  };
}

// Use in template
<button {@attach tooltip('Click me!')}>
  Hover for tooltip
</button>
```

### Common Attachments
```typescript
// Click outside
function clickOutside(callback: () => void) {
  return (element: HTMLElement) => {
    const handleClick = (e: MouseEvent) => {
      if (!element.contains(e.target as Node)) {
        callback();
      }
    };
    
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  };
}

// Focus trap
function focusTrap() {
  return (element: HTMLElement) => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        // Trap focus logic
      }
    };
    
    element.addEventListener('keydown', handleKeydown);
    return () => element.removeEventListener('keydown', handleKeydown);
  };
}
```

## 🎨 Component Patterns

### Error Boundaries
```svelte
<svelte:boundary onerror={(error, reset) => handleError(error)}>
  {#snippet failed(error, reset)}
    <div class="error">
      <p>Error: {error.message}</p>
      <button onclick={reset}>Try Again</button>
    </div>
  {/snippet}
  
  <RiskyComponent />
</svelte:boundary>
```

### Class-Based State Management
```typescript
// State class with runes
export class SessionState {
  // Reactive state
  session = $state<Session | null>(null);
  loading = $state(false);
  error = $state<string | null>(null);
  
  // Computed values
  isActive = $derived(this.session?.isActive ?? false);
  participantCount = $derived(this.session?.participants.length ?? 0);
  
  // Methods
  async load(code: string) {
    this.loading = true;
    try {
      this.session = await fetchSession(code);
    } catch (e) {
      this.error = e.message;
    } finally {
      this.loading = false;
    }
  }
}

// Usage in component
let state = new SessionState();
$effect(() => {
  state.load(code);
});
```

## 🚀 Performance Patterns

### Expensive Computations
```typescript
// ✅ Use $derived.by for expensive operations
let filtered = $derived.by(() => {
  console.log('Filtering...'); // Only runs when deps change
  return items.filter(item => item.active);
});

// ❌ Don't do this
let filtered = $derived(items.filter(item => item.active)); // Runs every time
```

### Effect Optimization
```typescript
// ✅ Debounced effects
$effect(() => {
  const timer = setTimeout(() => {
    saveToServer(data);
  }, 500);
  
  return () => clearTimeout(timer);
});

// ✅ Conditional effects
$effect(() => {
  if (!shouldRun) return;
  
  // Effect logic
  const cleanup = doSomething();
  return cleanup;
});
```

## 📦 File Organization

### Component Structure
```
ComponentName.svelte
├── <script lang="ts">
│   ├── Imports
│   ├── Type definitions
│   ├── Props
│   ├── State
│   ├── Derived
│   ├── Effects
│   └── Functions
├── Template
└── <style> (if needed)
```

### Example Component
```svelte
<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { User } from '$lib/types';
  
  interface Props {
    user: User;
    onEdit?: (user: User) => void;
  }
  
  let { user, onEdit }: Props = $props();
  
  let editing = $state(false);
  let name = $state(user.name);
  
  let displayName = $derived(editing ? name : user.name);
  
  $effect(() => {
    // Reset on user change
    name = user.name;
    editing = false;
  });
  
  function handleSave() {
    onEdit?.({ ...user, name });
    editing = false;
  }
</script>

<div transition:fade>
  {#if editing}
    <input bind:value={name} />
    <button onclick={handleSave}>Save</button>
  {:else}
    <span>{displayName}</span>
    <button onclick={() => editing = true}>Edit</button>
  {/if}
</div>
```

## ⚠️ Common Pitfalls

### Don't Mix Patterns
```typescript
// ❌ Don't mix stores with runes
import { writable } from 'svelte/store';
let store = writable(0);
let state = $state($store); // Won't work!

// ✅ Use one pattern consistently
let count = $state(0);
```

### Cleanup in Effects
```typescript
// ❌ Memory leak
$effect(() => {
  const timer = setInterval(() => {}, 1000);
  // Missing cleanup!
});

// ✅ Always cleanup
$effect(() => {
  const timer = setInterval(() => {}, 1000);
  return () => clearInterval(timer);
});
```

### Props Reactivity
```typescript
// ❌ Props are readonly
let { value }: Props = $props();
value = 10; // Error!

// ✅ Use local state
let { value }: Props = $props();
let localValue = $state(value);

$effect(() => {
  localValue = value; // Sync with prop changes
});
```

## 📚 Resources

- Component examples: `src/routes/(components)/`
- State management: `src/lib/state/`
- UI components: `src/lib/components/ui/`
- Attachment utils: `src/lib/utils/attachments.ts`
- Documentation: `docs/SYSTEM_ARCHITECTURE.md`