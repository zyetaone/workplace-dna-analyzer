# Using Async Remote Functions (Based on dummdidumm's Example)

## Key Insights from the Example

The [svelte-async-remote-functions-example](https://github.com/dummdidumm/svelte-async-remote-functions-example) shows how to use **async generators** for streaming data from server to client efficiently.

## Pattern 1: Streaming Updates

### Server (Remote Function)

```typescript
// async-crud.remote.ts
export const streamParticipants = query(async function* (sessionCode: string) {
	while (true) {
		const participants = await getLatestParticipants(sessionCode);

		yield {
			participants,
			timestamp: new Date(),
			stats: calculateStats(participants)
		};

		await sleep(1000); // Poll every second
	}
});
```

### Client (Component)

```svelte
<script lang="ts">
	import { streamParticipants } from './async-crud.remote';
	import { onDestroy } from 'svelte';

	let participants = $state([]);
	let stats = $state({});
	let controller: AbortController;

	async function startStreaming() {
		controller = new AbortController();

		try {
			// Consume async generator
			for await (const update of streamParticipants(sessionCode)) {
				participants = update.participants;
				stats = update.stats;

				// Check if should stop
				if (controller.signal.aborted) break;
			}
		} catch (error) {
			console.error('Stream error:', error);
		}
	}

	onDestroy(() => {
		controller?.abort();
	});
</script>

<!-- UI auto-updates as data streams in -->
<div>
	<h2>Live Participants ({stats.total})</h2>
	{#each participants as participant}
		<div>{participant.name} - {participant.status}</div>
	{/each}
</div>
```

## Pattern 2: Progressive Loading

### Server

```typescript
export const loadSessionDataProgressive = query(async function* (code: string) {
	// Send data as soon as it's ready
	yield { type: 'session', data: await getSession(code) };
	yield { type: 'participants', data: await getParticipants(code) };
	yield { type: 'analytics', data: await computeAnalytics(code) };
	yield { type: 'insights', data: await generateInsights(code) };
});
```

### Client

```svelte
<script lang="ts">
	import { loadSessionDataProgressive } from './async-crud.remote';

	let session = $state(null);
	let participants = $state([]);
	let analytics = $state(null);
	let insights = $state([]);
	let loadingStage = $state('session');

	async function loadProgressive() {
		for await (const chunk of loadSessionDataProgressive(code)) {
			switch (chunk.type) {
				case 'session':
					session = chunk.data;
					loadingStage = 'participants';
					break;
				case 'participants':
					participants = chunk.data;
					loadingStage = 'analytics';
					break;
				case 'analytics':
					analytics = chunk.data;
					loadingStage = 'insights';
					break;
				case 'insights':
					insights = chunk.data;
					loadingStage = 'complete';
					break;
			}
		}
	}
</script>

<!-- Progressive UI rendering -->
{#if session}
	<h1>{session.name}</h1>
{:else}
	<div>Loading session...</div>
{/if}

{#if participants.length > 0}
	<ParticipantList {participants} />
{:else if loadingStage !== 'session'}
	<div>Loading participants...</div>
{/if}

{#if analytics}
	<AnalyticsDashboard {analytics} />
{:else if loadingStage === 'analytics'}
	<div>Computing analytics...</div>
{/if}
```

## Pattern 3: Real-time Collaboration

### Server

```typescript
export const watchAndSync = query(async function* (entityId: string) {
	let lastVersion = 0;

	while (true) {
		const entity = await getEntity(entityId);

		if (entity.version > lastVersion) {
			yield {
				type: 'update',
				data: entity,
				version: entity.version
			};
			lastVersion = entity.version;
		}

		await sleep(500);
	}
});
```

### Client with Optimistic Updates

```svelte
<script lang="ts">
	import { watchAndSync, optimisticUpdate } from './async-crud.remote';

	let entity = $state({});
	let localVersion = $state(0);
	let syncing = $state(false);

	// Watch for remote changes
	async function startWatching() {
		for await (const update of watchAndSync(entityId)) {
			if (update.version > localVersion) {
				// Remote change detected
				entity = update.data;
				localVersion = update.version;
			}
		}
	}

	// Optimistic local update
	async function updateEntity(changes: any) {
		// Update UI immediately
		entity = { ...entity, ...changes };
		syncing = true;

		try {
			const result = await optimisticUpdate('entity', entityId, changes, localVersion);

			if (result.conflict) {
				// Handle conflict
				entity = result.current;
				localVersion = result.current.version;
				alert('Conflict detected - changes merged');
			} else {
				localVersion = result.version;
			}
		} finally {
			syncing = false;
		}
	}
</script>
```

## Pattern 4: Cursor-based Infinite Scroll

### Server

```typescript
export const paginate = query(async function* (entity: string, pageSize = 20) {
	let cursor = null;
	let hasMore = true;

	while (hasMore) {
		const { items, nextCursor, hasMore: more } = await getPage(entity, cursor, pageSize);

		yield { items, cursor: nextCursor, hasMore: more };

		cursor = nextCursor;
		hasMore = more;

		// Wait for client to request next page
		await new Promise((resolve) => setTimeout(resolve, 0));
	}
});
```

### Client with Infinite Scroll

```svelte
<script lang="ts">
	import { paginate } from './async-crud.remote';

	let items = $state([]);
	let loading = $state(false);
	let hasMore = $state(true);
	let iterator: AsyncIterator<any>;

	async function loadMore() {
		if (loading || !hasMore) return;

		loading = true;

		if (!iterator) {
			iterator = paginate('participants', 20);
		}

		const { value, done } = await iterator.next();

		if (!done && value) {
			items = [...items, ...value.items];
			hasMore = value.hasMore;
		}

		loading = false;
	}

	// Intersection observer for infinite scroll
	function infiniteScroll(node: HTMLElement) {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					loadMore();
				}
			},
			{ threshold: 0.1 }
		);

		observer.observe(node);

		return {
			destroy() {
				observer.disconnect();
			}
		};
	}
</script>

<div class="list">
	{#each items as item}
		<ItemCard {item} />
	{/each}

	{#if hasMore}
		<div use:infiniteScroll class="loader">
			{loading ? 'Loading...' : 'Scroll for more'}
		</div>
	{/if}
</div>
```

## Key Benefits of Async Generators

1. **Streaming Data**: Send data as it becomes available
2. **Memory Efficient**: Don't load everything at once
3. **Real-time Updates**: Natural pattern for live data
4. **Progressive Enhancement**: Show UI as data arrives
5. **Cancellation**: Easy to stop streams with AbortController
6. **Type Safety**: Full TypeScript support

## Comparison with Traditional Approaches

### Traditional (All at Once)

```typescript
// Server loads everything
export const getData = query(async () => {
	const session = await getSession();
	const participants = await getParticipants();
	const analytics = await computeAnalytics();
	return { session, participants, analytics }; // User waits for all
});
```

### Async Generator (Progressive)

```typescript
// Server streams as ready
export const getData = query(async function* () {
	yield await getSession(); // User sees immediately
	yield await getParticipants(); // Then this
	yield await computeAnalytics(); // Then this
});
```

## Best Practices

1. **Use for Long Operations**: Streaming is best for operations > 100ms
2. **Implement Cleanup**: Always handle cancellation properly
3. **Buffer Wisely**: Don't overwhelm the client with updates
4. **Handle Errors**: Wrap in try-catch, generators can throw
5. **Test Disconnections**: Ensure graceful handling of network issues

## When to Use Each Pattern

- **Streaming**: Live dashboards, real-time updates
- **Progressive Loading**: Complex pages with multiple data sources
- **Watch & Sync**: Collaborative editing, shared state
- **Pagination**: Large lists, infinite scroll

This async generator pattern from the example provides a powerful way to build responsive, real-time applications with SvelteKit!
