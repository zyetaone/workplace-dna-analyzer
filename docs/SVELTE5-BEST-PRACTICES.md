# Svelte 5 Best Practices Guide

## Core Runes Usage

### State Management
```svelte
<script lang="ts">
  // ✅ Correct: Use $state for reactive values
  let count = $state(0);
  let user = $state<User | null>(null);
  let items = $state<Item[]>([]);
  
  // ❌ Wrong: Don't use let for reactive state
  // let count = 0;
</script>
```

### Derived Values
```svelte
<script lang="ts">
  let firstName = $state('');
  let lastName = $state('');
  
  // ✅ Correct: Use $derived for computed values
  let fullName = $derived(`${firstName} ${lastName}`.trim());
  let initials = $derived(
    `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()
  );
  
  // ✅ For complex computations, use $derived.by
  let expensiveComputation = $derived.by(() => {
    if (!items.length) return null;
    return items.reduce((acc, item) => acc + item.value, 0);
  });
  
  // ❌ Wrong: Don't use reactive statements
  // $: fullName = `${firstName} ${lastName}`;
</script>
```

### Effects and Side Effects
```svelte
<script lang="ts">
  let sessionId = $state('');
  
  // ✅ Correct: Use $effect for side effects
  $effect(() => {
    if (sessionId) {
      const eventSource = new EventSource(`/api/sessions/${sessionId}/stream`);
      
      eventSource.onmessage = (event) => {
        // Handle message
      };
      
      // Cleanup function
      return () => {
        eventSource.close();
      };
    }
  });
  
  // ❌ Wrong: Don't use onMount for reactive effects
  // onMount(() => { ... });
</script>
```

## Component Props Pattern

### Basic Props
```svelte
<script lang="ts">
  // ✅ Correct: Define interface first, then props
  interface Props {
    title: string;
    count?: number;
    items: Item[];
    onUpdate?: (value: string) => void;
  }
  
  let { title, count = 0, items, onUpdate }: Props = $props();
  
  // ❌ Wrong: No type safety
  // export let title;
  // export let count = 0;
</script>
```

### Bindable Props
```svelte
<script lang="ts">
  interface Props {
    value: string;
    placeholder?: string;
  }
  
  // ✅ Correct: Use $bindable for two-way binding
  let { value = $bindable(), placeholder = '' }: Props = $props();
</script>

<input bind:value {placeholder} />
```

## Real-time Updates with SSE

### Component-Level SSE
```svelte
<script lang="ts">
  let { sessionId }: { sessionId: string } = $props();
  
  let connectionStatus = $state<'connecting' | 'connected' | 'error'>('connecting');
  let liveData = $state<any[]>([]);
  
  // ✅ Correct: Effect with proper cleanup
  $effect(() => {
    const eventSource = new EventSource(`/sessions/${sessionId}/stream`);
    
    eventSource.onopen = () => {
      connectionStatus = 'connected';
    };
    
    eventSource.addEventListener('update', (event) => {
      const data = JSON.parse(event.data);
      liveData = [...liveData, data];
    });
    
    eventSource.onerror = () => {
      connectionStatus = 'error';
    };
    
    // Cleanup when sessionId changes or component unmounts
    return () => {
      eventSource.close();
    };
  });
</script>
```

## Form Handling

### Modern Form Pattern
```svelte
<script lang="ts">
  let formData = $state({
    name: '',
    email: '',
    message: ''
  });
  
  let errors = $state<Record<string, string>>({});
  let isSubmitting = $state(false);
  
  // Derived validation
  let isValid = $derived(
    formData.name.length > 0 && 
    formData.email.includes('@') && 
    formData.message.length > 10
  );
  
  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    
    if (!isValid) {
      errors = {
        name: !formData.name ? 'Name is required' : '',
        email: !formData.email.includes('@') ? 'Valid email required' : '',
        message: formData.message.length <= 10 ? 'Message too short' : ''
      };
      return;
    }
    
    isSubmitting = true;
    try {
      await submitForm(formData);
      // Reset form
      formData = { name: '', email: '', message: '' };
    } finally {
      isSubmitting = false;
    }
  }
</script>

<form onsubmit={handleSubmit}>
  <input 
    bind:value={formData.name}
    placeholder="Name"
    class:error={errors.name}
  />
  {#if errors.name}
    <span class="error">{errors.name}</span>
  {/if}
  
  <button type="submit" disabled={!isValid || isSubmitting}>
    {isSubmitting ? 'Submitting...' : 'Submit'}
  </button>
</form>
```

## State Patterns

### Loading States
```svelte
<script lang="ts">
  let data = $state<Data | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  
  // Derived UI state
  let isEmpty = $derived(data === null);
  let hasError = $derived(error !== null);
  let isReady = $derived(!loading && !hasError && data !== null);
  
  async function loadData() {
    loading = true;
    error = null;
    
    try {
      data = await fetchData();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading = false;
    }
  }
</script>

{#if loading}
  <div class="loading">Loading...</div>
{:else if hasError}
  <div class="error">Error: {error}</div>
{:else if isEmpty}
  <div class="empty">No data available</div>
{:else}
  <div class="content">
    <!-- Render data -->
  </div>
{/if}
```

### Navigation-Aware State
```svelte
<script lang="ts">
  import { navigating } from '$app/stores';
  import { page } from '$app/stores';
  
  let localLoading = $state(false);
  
  // ✅ Derived values from stores
  let isNavigating = $derived(!!$navigating);
  let currentPath = $derived($page.url.pathname);
  let showGlobalLoading = $derived(isNavigating || localLoading);
  
  // ✅ Effect that reacts to page changes
  $effect(() => {
    if (currentPath.startsWith('/admin')) {
      // Do something when in admin section
    }
  });
</script>
```

## Performance Patterns

### Expensive Computations
```svelte
<script lang="ts">
  let largeDataset = $state<Item[]>([]);
  let filters = $state({ category: '', search: '' });
  
  // ✅ Use $derived.by for expensive operations
  let filteredData = $derived.by(() => {
    if (!largeDataset.length) return [];
    
    return largeDataset.filter(item => {
      const matchesCategory = !filters.category || item.category === filters.category;
      const matchesSearch = !filters.search || 
        item.name.toLowerCase().includes(filters.search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  });
  
  // ✅ Paginated derived data
  let currentPage = $state(1);
  let pageSize = $state(10);
  
  let paginatedData = $derived(
    filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  );
</script>
```

## Common Mistakes to Avoid

### ❌ Don't Mix Legacy and Modern Patterns
```svelte
<script>
  // Wrong: Mixing legacy reactive statements with runes
  let count = $state(0);
  $: doubled = count * 2; // Don't do this!
  
  // Correct: Use runes consistently
  let count = $state(0);
  let doubled = $derived(count * 2);
</script>
```

### ❌ Don't Use onMount for Reactive Effects
```svelte
<script>
  import { onMount } from 'svelte';
  
  let sessionId = $state('');
  
  // Wrong: onMount doesn't react to sessionId changes
  onMount(() => {
    if (sessionId) {
      // This won't re-run when sessionId changes
    }
  });
  
  // Correct: $effect reacts to dependencies
  $effect(() => {
    if (sessionId) {
      // This re-runs when sessionId changes
    }
  });
</script>
```

### ❌ Don't Forget Cleanup
```svelte
<script>
  let sessionId = $state('');
  
  // Wrong: No cleanup
  $effect(() => {
    const interval = setInterval(() => {
      // Do something
    }, 1000);
    // Memory leak! Interval never cleared
  });
  
  // Correct: With cleanup
  $effect(() => {
    const interval = setInterval(() => {
      // Do something
    }, 1000);
    
    return () => {
      clearInterval(interval);
    };
  });
</script>
```

## Migration Checklist

- [ ] Replace all `export let` with `$props()`
- [ ] Replace all `$:` reactive statements with `$derived`
- [ ] Replace `onMount` with `$effect` for reactive side effects
- [ ] Add TypeScript interfaces for all component props
- [ ] Use `$bindable()` for two-way binding
- [ ] Add cleanup functions to all effects that need them
- [ ] Update component imports to use proper TypeScript types
- [ ] Test that all reactive dependencies work correctly

## Testing Svelte 5 Components

### Unit Test Example
```typescript
import { render, fireEvent } from '@testing-library/svelte';
import MyComponent from './MyComponent.svelte';

test('component state updates correctly', async () => {
  const { getByRole, getByText } = render(MyComponent, {
    props: { initialCount: 0 }
  });
  
  const button = getByRole('button');
  const counter = getByText('Count: 0');
  
  await fireEvent.click(button);
  
  expect(getByText('Count: 1')).toBeInTheDocument();
});
```

This guide ensures you're using Svelte 5 patterns correctly and getting the full benefits of the new reactivity system.