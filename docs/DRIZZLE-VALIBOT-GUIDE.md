# Drizzle & Valibot Best Practices Guide

## Overview
This application effectively uses Drizzle ORM with libSQL and Valibot for type-safe database operations and runtime validation.

## 🎯 Key Patterns Used

### 1. Database Configuration (libSQL)
```typescript
// src/lib/server/db/index.ts
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

const client = createClient({
  url: DATABASE_URL,
  authToken: DATABASE_AUTH_TOKEN
});

// Performance optimizations with PRAGMA
await client.execute('PRAGMA journal_mode = WAL');
await client.execute('PRAGMA busy_timeout = 5000');

export const db = drizzle(client, { schema });
```

### 2. Schema Definition with Drizzle
```typescript
// src/lib/server/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm';

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const attendees = sqliteTable('attendees', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  sessionId: text('session_id').notNull().references(() => sessions.id),
  // JSON columns for flexible data
  responses: text('responses', { mode: 'json' }).$type<Record<number, any>>().default({}),
  preferenceScores: text('preference_scores', { mode: 'json' }).$type<{
    collaboration: number;
    formality: number;
    technology: number;
    wellness: number;
  }>()
});
```

### 3. Valibot Validation Schemas
```typescript
import * as v from 'valibot';

// Comprehensive validation with nested objects
const SaveResponseSchema = v.object({
  sessionId: v.pipe(v.string(), v.uuid()),
  attendeeId: v.pipe(v.string(), v.uuid()),
  questionIndex: v.pipe(v.number(), v.minValue(0), v.maxValue(6)),
  response: v.pipe(v.string(), v.minLength(1)),
  generation: v.optional(v.picklist(['Baby Boomer', 'Gen X', 'Millennial', 'Gen Z']))
});

// Reusable validation patterns
const ScoreSchema = v.pipe(v.number(), v.minValue(0), v.maxValue(10));

const PreferenceScoresSchema = v.object({
  collaboration: ScoreSchema,
  formality: ScoreSchema,
  technology: ScoreSchema,
  wellness: ScoreSchema
});
```

### 4. Remote Functions with Type Safety
```typescript
import { query, command } from '$app/server';

// Query for reading data
export const getSessionAnalytics = query(
  v.object({ sessionId: v.string() }), 
  async ({ sessionId }) => {
    // Type-safe database queries
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId));
    
    // Aggregations with Drizzle
    const attendeeCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(attendees)
      .where(eq(attendees.sessionId, sessionId));
    
    return { session, attendeeCount };
  }
);

// Command for mutations
export const updateAttendeeScore = command(
  v.object({
    attendeeId: v.string(),
    scores: PreferenceScoresSchema
  }),
  async ({ attendeeId, scores }) => {
    // Transaction support
    const result = await db.transaction(async (tx) => {
      // Update attendee
      await tx
        .update(attendees)
        .set({ 
          preferenceScores: scores,
          completed: true,
          completedAt: new Date().toISOString()
        })
        .where(eq(attendees.id, attendeeId));
      
      // Return updated data
      return tx.select().from(attendees).where(eq(attendees.id, attendeeId));
    });
    
    return result[0];
  }
);
```

### 5. Advanced Drizzle Queries
```typescript
// Joins and aggregations
const sessionWithStats = await db
  .select({
    session: sessions,
    totalAttendees: sql<number>`count(${attendees.id})`,
    completedCount: sql<number>`sum(case when ${attendees.completed} then 1 else 0 end)`,
    avgCollaboration: sql<number>`avg(json_extract(${attendees.preferenceScores}, '$.collaboration'))`
  })
  .from(sessions)
  .leftJoin(attendees, eq(sessions.id, attendees.sessionId))
  .where(eq(sessions.id, sessionId))
  .groupBy(sessions.id);

// Dynamic queries
const filters = [];
if (generation) filters.push(eq(attendees.generation, generation));
if (completed) filters.push(eq(attendees.completed, true));

const filteredAttendees = await db
  .select()
  .from(attendees)
  .where(and(...filters));
```

### 6. Error Handling Pattern
```typescript
export const safeQuery = query(Schema, async (input) => {
  try {
    // Validation is automatic via Valibot
    const result = await db.select()...;
    
    if (!result.length) {
      error(404, 'Resource not found');
    }
    
    return result;
  } catch (err) {
    console.error('Database error:', err);
    error(500, 'Database operation failed');
  }
});
```

### 7. Real-time Updates with SSE
```typescript
// Broadcast updates after database changes
export const updateSession = command(UpdateSchema, async (input) => {
  // Update database
  const updated = await db.update(sessions)...;
  
  // Broadcast real-time event
  broadcastEvents.sessionUpdated(input.sessionId, updated);
  
  return updated;
});
```

## 🚀 Deployment Configurations

### Local Development
```env
DATABASE_URL=./data/ppt-app.db
```

### VPS with Local SQLite
```env
DATABASE_URL=/var/lib/ppt-app/database.db
```

### Production with Turso
```env
DATABASE_URL=libsql://your-db.turso.io
DATABASE_AUTH_TOKEN=your-auth-token
```

## 📊 Performance Tips

1. **Use Transactions** for multiple related operations
2. **Index frequently queried columns** (already done for `sessions.code`)
3. **Use JSON columns** for flexible data structures
4. **Leverage SQLite pragmas** for performance
5. **Implement connection pooling** (handled by libSQL)

## 🔒 Security Best Practices

1. **Always validate input** with Valibot schemas
2. **Use parameterized queries** (Drizzle handles this)
3. **Implement rate limiting** on mutations
4. **Sanitize JSON data** before storing
5. **Use environment variables** for sensitive config

## 📝 Migration Commands

```bash
# Generate migration
bun run db:generate

# Push schema changes
bun run db:push

# Open Drizzle Studio
bun run db:studio

# Reset database (dev only)
rm -f ./data/ppt-app.db && bun run db:push
```