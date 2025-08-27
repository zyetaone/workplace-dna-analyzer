# Svelte 5 Patterns (Runes Mode)

## Core Runes

### State Management
```svelte
<script>
// Reactive state
let count = $state(0);
let items = $state([]);
let user = $state({ name: '', email: '' });

// Derived values (computed)
let doubled = $derived(count * 2);
let fullName = $derived(`${user.firstName} ${user.lastName}`);
</script>
```

### Effects
```svelte
<script>
// Run side effects
$effect(() => {
  console.log('Count changed:', count);
  // Cleanup function (optional)
  return () => {
    console.log('Cleanup');
  };
});

// Root effect (for managing lifecycle)
$effect.root(() => {
  // Create isolated effect scope
});
</script>
```

### Props
```svelte
<script>
// Component props
let { name, age = 18, ...rest } = $props();

// With TypeScript
interface Props {
  name: string;
  age?: number;
}
let { name, age = 18 }: Props = $props();
</script>
```

## Migration from Legacy

### From $: reactive statements
```svelte
<!-- Legacy -->
$: doubled = count * 2;
$: console.log('Count:', count);

<!-- Svelte 5 -->
let doubled = $derived(count * 2);
$effect(() => {
  console.log('Count:', count);
});
```

### From stores
```svelte
<!-- Legacy -->
import { page } from '$app/stores';
$: slug = $page.params.slug;

<!-- Svelte 5 -->
import { page } from '$app/stores';
// In template, use directly: {$page.params.slug}
// In script for derived:
let slug = $derived($page.params.slug);
```

### Snippets (replaces slots)
```svelte
<!-- Define snippet -->
{#snippet buttonContent(text)}
  <span>{text}</span>
{/snippet}

<!-- Use snippet -->
{@render buttonContent('Click me')}

<!-- Children pattern -->
<script>
let { children } = $props();
</script>
{@render children?.()}
```

## Component Patterns

### Two-way Binding
```svelte
<script>
let value = $state('');
</script>
<input bind:value />
```

### Event Handlers
```svelte
<button onclick={() => count++}>
  Click me
</button>
```

### Class Directive
```svelte
<div class:active={isActive} class:highlight={isHighlight}>
  Content
</div>
```

## Best Practices
1. Use `$state` for reactive values
2. Use `$derived` for computed values
3. Use `$effect` sparingly (only for side effects)
4. Prefer `$derived` over `$effect` when possible
5. Use snippets instead of slots
6. Use `bind:value` for form inputs
7. Don't use `$:` in runes mode