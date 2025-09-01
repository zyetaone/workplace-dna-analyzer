# Hybrid SvelteKit Patterns - Best Practices

## Pattern Overview

We use a **hybrid approach** combining:

1. **Remote Functions** (`query`/`command`) - For API-like operations
2. **+page.server.ts** - For SSR and form actions
3. **$page.state** - For ephemeral UI state
4. **SSE** - For real-time updates

## When to Use What

### 1. Remote Functions (`query`/`command`)

**Use for:**

- Client-side data fetching after initial load
- Real-time updates without page refresh
- Background saves and mutations
- Complex operations that need validation

```typescript
// app.remote.ts
export const saveAnswer = command(async ({ answer }) => {
	// Validate and save
	return RemoteResponse.success({ saved: true });
});
```

### 2. +page.server.ts Load Functions

**Use for:**

- Initial page data (SSR)
- SEO-critical content
- Authentication checks
- Setting/reading cookies

```typescript
// +page.server.ts
import { query } from '$app/server';

export const load = query(async ({ params, cookies }) => {
	// Fetch initial data
	const session = await getSession(params.code);
	return { session };
});
```

### 3. Form Actions (Progressive Enhancement)

**Use for:**

- Forms that should work without JavaScript
- File uploads
- Critical user flows (login, signup, checkout)

```typescript
// +page.server.ts
export const actions = {
	join: async ({ request }) => {
		const data = await request.formData();
		// Process form
		return { success: true };
	}
};
```

### 4. $page.state (Ephemeral State)

**Use for:**

- Modal open/close
- Dropdown menus
- Temporary UI state
- Form validation state

```svelte
<script>
	import { page } from '$app/state';

	// Ephemeral state that doesn't need persistence
	page.state.modalOpen = false;
</script>
```

## Real Example: Admin Dashboard

### +page.server.ts (Initial Load)

```typescript
import { query } from '$app/server';

export const load = query(async ({ params }) => {
	// Load initial session data
	const session = await db.select().from(sessions).where(eq(sessions.code, params.code));

	const participants = await db
		.select()
		.from(participants)
		.where(eq(participants.sessionId, session.id));

	return {
		session,
		participants,
		sseEndpoint: `/sse/${params.code}` // For real-time
	};
});
```

### admin.remote.ts (Client Operations)

```typescript
// For dynamic updates after page load
export const removeParticipant = command(async ({ id }) => {
	await db.delete(participants).where(eq(participants.id, id));
	return RemoteResponse.success({ removed: true });
});

export const exportData = command(async ({ sessionCode }) => {
	const data = await generateCSV(sessionCode);
	return RemoteResponse.success({ csv: data });
});
```

### +page.svelte (UI)

```svelte
<script>
	import { removeParticipant } from './admin.remote';

	let { data } = $props(); // From load function

	async function handleRemove(id: string) {
		const result = await removeParticipant({ id });
		if (result.success) {
			// Update UI optimistically or refetch
			data.participants = data.participants.filter((p) => p.id !== id);
		}
	}
</script>
```

## Benefits of Hybrid Approach

1. **Best Performance**: SSR for initial load, client-side for interactions
2. **Progressive Enhancement**: Forms work without JS
3. **Type Safety**: Full type inference across the stack
4. **Simplicity**: Use the right tool for each job
5. **Real-time**: SSE for live updates without complexity

## Migration Path

### Phase 1 (Current)

- Keep remote functions for complex operations
- Use `query` wrapper for load functions
- Simple SSE for real-time

### Phase 2 (Optimize)

- Move initial loads to pure `PageServerLoad`
- Add form actions for critical paths
- Use `$page.state` for UI state

### Phase 3 (Scale)

- Add caching strategies
- Implement optimistic updates
- Add WebSocket for collaboration

## Common Patterns

### 1. Load + Remote

```typescript
// Load initial data
export const load = query(async () => ({ items }));

// Update via remote
export const updateItem = command(async ({ id, data }) => {
	// Update and return
});
```

### 2. Form + Validation

```typescript
// Progressive form with validation
export const actions = {
	submit: async ({ request }) => {
		const data = await request.formData();
		const validated = schema.parse(data);
		// Process
	}
};
```

### 3. Real-time Updates

```typescript
// SSE endpoint
export const GET = () => {
	const stream = new ReadableStream({
		start(controller) {
			// Send updates
		}
	});
	return new Response(stream);
};
```

## Best Practices

1. **Start with SSR**: Load initial data server-side
2. **Enhance Progressively**: Add client features on top
3. **Validate Everywhere**: Server and client validation
4. **Cache Wisely**: Use SvelteKit's built-in caching
5. **Type Everything**: Leverage TypeScript throughout

## Anti-Patterns to Avoid

❌ Loading everything client-side
❌ Duplicating logic between load and remote
❌ Over-engineering state management
❌ Ignoring progressive enhancement
❌ Complex client-side routing

## Conclusion

The hybrid approach gives us:

- **Flexibility** to choose the right tool
- **Performance** with SSR + client updates
- **Simplicity** by avoiding over-engineering
- **Scalability** to grow as needed

This is the recommended pattern for Phase 1 and beyond.
