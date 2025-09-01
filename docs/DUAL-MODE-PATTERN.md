# Dual-Mode Pattern: Client API + Server Direct

## The Magic of SvelteKit Remote Functions

Remote functions (`query`/`command`) are **universal** - they work differently depending on where they're called from:

```
┌─────────────────────────────────────────────┐
│            crud.remote.ts                    │
│                                              │
│  export const r = query(async () => {       │
│    // Database operation                     │
│    return data;                              │
│  });                                         │
└─────────────┬───────────────┬────────────────┘
              │               │
    Called from Client    Called from Server
              │               │
              ▼               ▼
        HTTP API Call    Direct Function Call
        (POST request)   (No network overhead)
```

## How It Works

### Client-Side Call (Browser → Server)

```svelte
<!-- +page.svelte -->
<script>
	import { r, c, u, d } from './crud.remote';

	async function updateFromClient() {
		// This triggers an HTTP POST request
		// SvelteKit automatically:
		// 1. Serializes the parameters
		// 2. Makes POST to /__data.json
		// 3. Executes function on server
		// 4. Returns serialized result

		const result = await u`update participant 
      where id = ${userId} 
      set ${{ completed: true }}`;

		// Network request completed
		console.log('Updated via API:', result);
	}
</script>
```

**What happens:**

1. SvelteKit intercepts the call
2. Creates HTTP POST request with parameters
3. Server receives request, runs function
4. Result serialized and sent back
5. Client receives typed response

### Server-Side Call (Server → Server)

```typescript
// +page.server.ts
import { r, c, u, d } from './crud.remote';

export const load = async ({ params, cookies }) => {
	// Direct function call - NO HTTP!
	// This is just JavaScript calling JavaScript

	const session = await r`read session where code = ${params.code}`;

	// No serialization needed
	// No network latency
	// Direct database connection
	// Full object references preserved

	const participants = await r`read participants 
    where sessionId = ${session.id}`;

	// Can even do complex operations efficiently
	const analytics = await computeAnalytics(participants);

	return {
		session,
		participants,
		analytics
	};
};
```

**What happens:**

1. Direct function execution
2. No HTTP overhead
3. No serialization/deserialization
4. Shared database connection pool
5. Full TypeScript types preserved

## Performance Benefits

### Traditional API Pattern

```
Client → HTTP → API Route → DB Query → Serialize → HTTP → Client
Total: ~50-100ms
```

### Dual-Mode Pattern (Server Load)

```
Server Load → Direct Call → DB Query → Return
Total: ~5-10ms (for initial SSR)

Then if needed:
Client → HTTP → Remote Function → DB Query → Return
Total: ~30-50ms (for updates)
```

## Real-World Example

```typescript
// crud.remote.ts
export const api = {
	session: {
		// This function works BOTH ways!
		getWithAnalytics: query(async (code: string) => {
			// Complex server operation
			const session = await db.select().from(sessions).where(eq(sessions.code, code));

			const participants = await db
				.select()
				.from(participants)
				.where(eq(participants.sessionId, session.id));

			const analytics = {
				total: participants.length,
				completed: participants.filter((p) => p.completed).length,
				averageScore: calculateAverage(participants)
			};

			return { session, participants, analytics };
		})
	}
};
```

### Used in Load Function (SSR)

```typescript
// +page.server.ts
export const load = async ({ params }) => {
	// Direct call - happens during SSR
	// No API request, pure server-side
	const data = await api.session.getWithAnalytics(params.code);

	// This data is:
	// 1. Fetched on server
	// 2. Serialized once
	// 3. Sent with HTML
	// 4. Hydrated on client
	return data;
};
```

### Used in Component (Client-Side)

```svelte
<script>
	import { api } from './crud.remote';

	async function refresh() {
		// HTTP API call - happens after hydration
		// Makes POST request to server
		const data = await api.session.getWithAnalytics(code);

		// Update UI with fresh data
		updateDisplay(data);
	}
</script>

<button onclick={refresh}>Refresh Data</button>
```

## Advanced Patterns

### 1. Conditional Loading

```typescript
export const load = async ({ cookies, isDataRequest }) => {
	// isDataRequest = true when called from client
	// isDataRequest = false during SSR

	if (isDataRequest) {
		// Client requesting update - return minimal data
		return { timestamp: Date.now() };
	}

	// SSR - return full data
	const session = await r`read session where code = ${code}`;
	return { session, timestamp: Date.now() };
};
```

### 2. Optimized Queries

```typescript
// crud.remote.ts
export const getSessionData = query(async (code: string, detailed = false) => {
	const session = await r`read session where code = ${code}`;

	if (!detailed) {
		// Quick query for load functions
		return { session };
	}

	// Detailed query for client refreshes
	const participants = await r`read participants where sessionId = ${session.id}`;
	const analytics = await computeAnalytics(participants);

	return { session, participants, analytics };
});

// +page.server.ts
export const load = async ({ params }) => {
	// Fast load - minimal data
	return await getSessionData(params.code, false);
};

// +page.svelte
async function getDetails() {
	// Full data when needed
	const data = await getSessionData(code, true);
}
```

### 3. Caching Strategy

```typescript
// Server-side cache for load functions
const cache = new Map();

export const getCachedSession = query(async (code: string) => {
	// Check cache first (only works server-side)
	if (cache.has(code)) {
		return cache.get(code);
	}

	const session = await r`read session where code = ${code}`;

	// Cache for 1 minute
	cache.set(code, session);
	setTimeout(() => cache.delete(code), 60000);

	return session;
});
```

## Benefits Summary

1. **Write Once, Use Everywhere** - Same function for SSR and client
2. **Optimal Performance** - Direct calls on server, API when needed
3. **Type Safety** - Full types in both contexts
4. **Progressive Enhancement** - SSR by default, client updates as needed
5. **Smart Bundling** - Server code stays on server
6. **Connection Pooling** - Shared DB connections on server
7. **Automatic API Generation** - No manual API routes needed

## Best Practices

### DO ✅

- Use load functions for initial data (SSR)
- Use remote functions for updates (client)
- Share logic between server and client
- Cache on server side when possible
- Use typed parameters

### DON'T ❌

- Make unnecessary client calls for initial data
- Duplicate logic between load and remote
- Forget about serialization limits for client
- Expose sensitive operations to client
- Mix concerns (keep CRUD separate)

## Conclusion

This dual-mode pattern gives you:

- **Fast initial loads** via SSR with direct server calls
- **Dynamic updates** via client API calls
- **Single source of truth** for data operations
- **Optimal performance** in both contexts
- **Clean, maintainable code** with no duplication

It's the best of both worlds - the performance of server-side rendering with the interactivity of client-side updates, all from a single function definition!
