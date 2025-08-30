# SvelteKit Remote Functions

## Overview

Remote functions are an experimental SvelteKit feature (since v2.27) that enable type-safe client-server communication.

## Setup

```javascript
// svelte.config.js
const config = {
	kit: {
		experimental: {
			remoteFunctions: true
		}
	},
	compilerOptions: {
		experimental: {
			async: true
		}
	}
};
```

## Import Pattern

```javascript
import { query, command, form } from '$app/server';
```

## Usage Patterns

### Query (for reading data)

```javascript
import { query } from '$app/server';
import * as v from 'valibot';

export const getData = query(v.object({ id: v.string() }), async ({ id }) => {
	// Server-side logic
	const data = await db.select().from(table).where(eq(table.id, id));
	return data;
});
```

### Command (for mutations)

```javascript
import { command } from '$app/server';
import * as v from 'valibot';

export const updateData = command(
	v.object({ id: v.string(), value: v.string() }),
	async ({ id, value }) => {
		// Server-side mutation
		await db.update(table).set({ value }).where(eq(table.id, id));
		return { success: true };
	}
);
```

### Form (for progressive enhancement)

```javascript
import { form } from '$app/server';

export const submitForm = form(async (data) => {
	const title = data.get('title');
	const content = data.get('content');

	await db.insert(posts).values({ title, content });
	return { success: true };
});
```

## Best Practices

1. Always validate inputs with schemas (Valibot/Zod)
2. Handle errors properly
3. Return type-safe responses
4. Use `query` for reads, `command` for writes, `form` for forms
5. Remote functions always run on server
