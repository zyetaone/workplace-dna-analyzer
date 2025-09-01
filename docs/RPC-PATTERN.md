# SvelteKit as Modern RPC (Remote Procedure Call)

## Yes, It's RPC!

SvelteKit's remote functions are a **modern RPC implementation** with TypeScript, but better than traditional RPC:

## Traditional RPC vs SvelteKit RPC

### Old-School RPC (JSON-RPC, XML-RPC, gRPC)

```javascript
// Server defines procedure
server.register('getUser', async (id) => {
	return await db.query('SELECT * FROM users WHERE id = ?', [id]);
});

// Client calls with RPC protocol
const result = await rpcClient.call('getUser', [123]);
// Sends: {"jsonrpc": "2.0", "method": "getUser", "params": [123], "id": 1}
```

### SvelteKit Modern RPC

```typescript
// Server defines procedure (remote function)
export const getUser = query(async (id: number) => {
	return await db.select().from(users).where(eq(users.id, id));
});

// Client calls - looks like normal function!
const user = await getUser(123);
// SvelteKit handles the RPC protocol automatically
```

## How SvelteKit RPC Works

```
┌──────────────────────────────────────────────────────┐
│                   CLIENT (Browser)                    │
├──────────────────────────────────────────────────────┤
│  import { getUser } from './api.remote';             │
│                                                       │
│  // Looks like a normal function call                │
│  const user = await getUser(123);                    │
│                                                       │
│  // But SvelteKit transforms it to:                  │
│  // POST /__data.json                                │
│  // Body: {                                          │
│  //   "type": "query",                               │
│  //   "fn": "getUser",                               │
│  //   "args": [123]                                  │
│  // }                                                 │
└──────────────────────┬───────────────────────────────┘
                       │ HTTP/RPC
                       ▼
┌──────────────────────────────────────────────────────┐
│                   SERVER (Node.js)                    │
├──────────────────────────────────────────────────────┤
│  // SvelteKit receives RPC call                      │
│  // Executes the actual function                     │
│  const result = await getUser(123);                  │
│                                                       │
│  // Returns serialized result                        │
│  return Response.json(result);                       │
└──────────────────────────────────────────────────────┘
```

## RPC Features in SvelteKit

### 1. **Type-Safe RPC**

```typescript
// Full type inference across network boundary!
export const createUser = command(async (data: { name: string; email: string }) => {
	const user = await db.insert(users).values(data).returning();
	return user[0]; // Return type is inferred!
});

// Client gets full types
const newUser = await createUser({
	name: 'John',
	email: 'john@example.com'
}); // TypeScript knows newUser type!
```

### 2. **Bidirectional RPC** (Server ↔ Server, Client → Server)

```typescript
// Same RPC works both ways
export const rpcFunction = query(async (param: string) => {
	return { result: param.toUpperCase() };
});

// Server-to-Server (direct call, no RPC overhead)
export const load = async () => {
	const data = await rpcFunction('hello'); // Direct function call
};

// Client-to-Server (actual RPC over HTTP)
const handleClick = async () => {
	const data = await rpcFunction('hello'); // RPC call
};
```

### 3. **Smart RPC with Tagged Templates**

```typescript
// Our CRUD pattern is RPC with template literals!
export const r = query(async (strings: TemplateStringsArray, ...values: any[]) => {
	// This is an RPC procedure that accepts template literals
	const query = parseTemplate(strings, values);
	return await executeQuery(query);
});

// RPC call with template literal
const session = await r`read session where code = ${code}`;
// Becomes: RPC call with ["read session where code = ", ""] and [code]
```

## Comparison with Other RPC Systems

| Feature               | gRPC          | JSON-RPC | GraphQL     | **SvelteKit RPC** |
| --------------------- | ------------- | -------- | ----------- | ----------------- |
| Type Safety           | ✅ (Protobuf) | ❌       | ✅ (Schema) | ✅ (TypeScript)   |
| No Boilerplate        | ❌            | ❌       | ❌          | ✅                |
| Bidirectional         | ✅            | ✅       | ❌          | ✅                |
| Browser Native        | ❌            | ✅       | ✅          | ✅                |
| Auto-Generated Client | ✅            | ❌       | ✅          | ✅                |
| Works During SSR      | ❌            | ❌       | ❌          | ✅                |

## Advanced RPC Patterns

### 1. **Streaming RPC** (via SSE)

```typescript
// Server-side streaming RPC
export const streamUpdates = query(async function* (sessionId: string) {
	// Generator function for streaming
	while (true) {
		const updates = await getLatestUpdates(sessionId);
		yield updates;
		await sleep(1000);
	}
});

// Client consumes stream
for await (const update of streamUpdates(sessionId)) {
	console.log('Received:', update);
}
```

### 2. **Batch RPC**

```typescript
// Batch multiple RPC calls
export const batchOperations = command(async (operations: Operation[]) => {
	const results = await Promise.all(operations.map((op) => executeOperation(op)));
	return results;
});

// Client sends batch
const results = await batchOperations([
	{ type: 'create', entity: 'user', data: userData },
	{ type: 'update', entity: 'session', data: sessionData },
	{ type: 'delete', entity: 'temp', id: tempId }
]);
```

### 3. **RPC with Middleware**

```typescript
// Add middleware to RPC calls
export const authenticatedRPC = command(async (data: any, event) => {
	// Access request context
	const user = await validateAuth(event.cookies);
	if (!user) throw error(401, 'Unauthorized');

	// Execute RPC with user context
	return await performOperation(data, user);
});
```

## Why SvelteKit RPC is Superior

### 1. **Zero Configuration**

```typescript
// Just export a function - it's RPC ready!
export const myRPC = query(async () => {
	/* ... */
});
```

### 2. **Automatic Client Generation**

```typescript
// Import and use - client is auto-generated
import { myRPC } from './api.remote';
await myRPC(); // That's it!
```

### 3. **Smart Serialization**

```typescript
// Handles complex types automatically
export const getRichData = query(async () => {
	return {
		date: new Date(), // Serialized properly
		bigint: 123n, // Handled
		map: new Map(), // Converted
		set: new Set() // Converted
	};
});
```

### 4. **Error Propagation**

```typescript
// Server error
export const failingRPC = query(async () => {
	throw new Error('Database connection failed');
});

// Client receives typed error
try {
	await failingRPC();
} catch (error) {
	// Error message preserved across RPC boundary
	console.error(error.message);
}
```

## Real-World RPC Example

```typescript
// api.remote.ts - Define RPC procedures
export const rpc = {
	// User RPCs
	user: {
		create: command(async (data: UserInput) => {
			return await db.insert(users).values(data);
		}),

		get: query(async (id: string) => {
			return await db.select().from(users).where(eq(users.id, id));
		}),

		update: command(async (id: string, data: Partial<User>) => {
			return await db.update(users).set(data).where(eq(users.id, id));
		}),

		delete: command(async (id: string) => {
			return await db.delete(users).where(eq(users.id, id));
		})
	},

	// Session RPCs
	session: {
		create: command(async (name: string) => {
			return await createSession(name);
		}),

		join: command(async (code: string, participant: string) => {
			return await joinSession(code, participant);
		}),

		getAnalytics: query(async (code: string) => {
			return await computeAnalytics(code);
		})
	}
};

// Client usage - Clean RPC calls
const user = await rpc.user.create({ name: 'Alice' });
const session = await rpc.session.join('ABC-123', 'Bob');
const analytics = await rpc.session.getAnalytics('ABC-123');
```

## Conclusion

SvelteKit's remote functions are indeed **modern RPC** with:

1. **Type-safe** procedure calls across network boundaries
2. **Automatic** client/server code generation
3. **Transparent** serialization/deserialization
4. **Bidirectional** execution (server-to-server, client-to-server)
5. **Zero boilerplate** - just write functions!

It's RPC evolved for the modern web - combining the simplicity of function calls with the power of distributed systems!

```typescript
// It's just RPC, but better!
await r`read session where code = ${code}`; // ← This is an RPC call!
```
