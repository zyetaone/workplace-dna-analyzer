# Smart State Tracking & CRUD Pattern

## Overview

A powerful pattern combining:

1. **Tagged template literal CRUD** - Natural language database operations
2. **Smart state tracking** - Automatic table routing based on user state
3. **Organized API calls** - Domain-driven API structure
4. **Type-safe operations** - Full TypeScript support

## Usage in Components

### Basic CRUD Operations

```svelte
<script lang="ts">
	import { c, r, u, d, api } from './crud.remote';

	// CREATE - Natural language syntax
	async function createUser() {
		const result = await c`create participant if not exists ${{
			id: cookieId,
			name: userName,
			sessionId
		}}`;
	}

	// READ - Simple queries
	async function loadSession() {
		const session = await r`read session where code = ${code}`;
		const participants = await r`read participants where sessionId = ${session.id}`;
	}

	// UPDATE - Smart updates
	async function saveProgress() {
		await u`update participant where id = ${userId} set ${{
			responses: currentResponses,
			updatedAt: new Date()
		}}`;
	}

	// DELETE - With cascade support
	async function removeSession() {
		await d`delete session where code = ${code} cascade`;
	}
</script>
```

### Using Organized API

```svelte
<script lang="ts">
	import { api } from './crud.remote';

	// Clean, organized API calls
	async function handleJoin() {
		const participant = await api.participant.join(sessionId, name, generation);
	}

	async function trackProgress() {
		await api.activity.update(participantId, 'workplace-quiz', responses);
	}

	async function completeQuiz() {
		const scores = calculateScores(responses);
		await api.participant.complete(participantId, scores);
	}
</script>
```

## Smart State Tracking in Load Functions

### +page.server.ts Pattern

```typescript
import { r, api } from './crud.remote';

export const load = async ({ params, cookies }) => {
	// 1. Track user identity
	const participantId = cookies.get(`participant_${params.code}`);
	const participant = participantId ? await r`read participant where id = ${participantId}` : null;

	// 2. Load session state
	const session = await api.session.get(params.code);

	// 3. Track activity progress
	const progress = participant
		? await r`read progress where participantId = ${participant.id}`
		: null;

	// 4. Determine user state
	const userState = determineState(participant, progress);

	// 5. Return smart state object
	return {
		participant,
		session,
		progress,
		userState,
		// Tells component which tables to update
		updateTargets: getUpdateTargets(userState),
		// Available actions based on state
		actions: getAvailableActions(userState)
	};
};
```

### User States & Table Routing

```typescript
type UserState =
	| 'anonymous' // No participant → CREATE participant
	| 'joined' // Has participant → CREATE progress
	| 'in_progress' // Started activity → UPDATE progress
	| 'completed' // Finished → UPDATE participant & progress
	| 'returning'; // Viewing again → READ only

function getUpdateTargets(state: UserState) {
	switch (state) {
		case 'anonymous':
			return ['participants']; // Need to create

		case 'joined':
			return ['participantProgress']; // Start tracking

		case 'in_progress':
			return ['participantProgress', 'participants']; // Update both

		case 'completed':
			return ['participants']; // Final scores

		default:
			return [];
	}
}
```

## Component Usage with State Awareness

```svelte
<script lang="ts">
	import { c, u, api } from './crud.remote';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Component knows what to do based on state
	async function handleAction() {
		switch (data.userState) {
			case 'anonymous':
				// Create participant
				await c`create participant ${{
					sessionId: data.session.id,
					name: userName
				}}`;
				break;

			case 'in_progress':
				// Update progress
				await u`update progress where participantId = ${data.participantId} set ${{
					responses: currentResponses
				}}`;
				break;

			case 'completed':
				// Just show results, no updates
				showResults();
				break;
		}
	}
</script>

<!-- UI adapts to state -->
{#if data.userState === 'anonymous'}
	<JoinForm />
{:else if data.userState === 'in_progress'}
	<QuizForm responses={data.progress.responses} />
{:else if data.userState === 'completed'}
	<Results scores={data.progress.scores} />
{/if}
```

## Advanced Patterns

### Conditional Operations

```typescript
// Create only if doesn't exist
await c`create session if not exists ${{ code, name }}`;

// Update or create (upsert)
await upsert`participant where id = ${id} data ${{ name, responses }}`;

// Toggle boolean fields
await u`update session where code = ${code} toggle isActive`;

// Cascade deletions
await d`delete session where code = ${code} cascade`;
```

### Batch Operations

```typescript
// Process multiple participants
const participants = await r`read participants where sessionId = ${id}`;

await Promise.all(
	participants.map((p) => u`update participant where id = ${p.id} set ${{ notified: true }}`)
);
```

### Transaction-like Operations

```typescript
async function completeActivity(participantId: string, responses: any) {
	const scores = calculateScores(responses);

	// Update multiple tables in sequence
	await u`update progress where participantId = ${participantId} set ${{
		completed: true,
		completedAt: new Date(),
		scores
	}}`;

	await u`update participant where id = ${participantId} set ${{
		preferenceScores: scores,
		completed: true
	}}`;

	await c`create event ${{
		type: 'activity_completed',
		participantId,
		timestamp: new Date()
	}}`;
}
```

## Benefits

1. **Natural Language Queries** - Read like English
2. **Type Safety** - Full TypeScript support
3. **State Awareness** - Automatic table routing
4. **Progressive Enhancement** - Works with/without JS
5. **Reusable** - Import and use anywhere
6. **Organized** - Clean API structure
7. **Smart** - Handles edge cases automatically

## Migration Path

### Phase 1 - Current

```typescript
// Simple CRUD with basic state
await c`create participant ${{ name }}`;
await r`read session where code = ${code}`;
```

### Phase 2 - Add Intelligence

```typescript
// Smart operations with conditions
await c`create participant if not exists ${{ id }}`;
await u`update session toggle isActive where code = ${code}`;
```

### Phase 3 - Full DSL

```typescript
// Complex queries with natural syntax
await sql`
  select participants
  where session = ${sessionId}
  and completed = true
  order by completedAt desc
  limit 10
`;
```

## Best Practices

1. **Use load functions** for initial state
2. **Track user state** to route updates
3. **Organize by domain** (session, participant, activity)
4. **Handle errors gracefully** with try/catch
5. **Cache when possible** using SvelteKit patterns
6. **Type everything** for safety
7. **Keep it simple** - don't over-engineer

This pattern provides a powerful, elegant way to handle database operations while maintaining clean, readable code.
