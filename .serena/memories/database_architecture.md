# Database Architecture & Schema Guide

## 🎯 Current Schema: Simplified Single-Table Design

### Location: `src/lib/server/db/schema.ts`

## Core Philosophy
- **Single table** for sessions
- **JSON columns** for flexibility
- **4-character codes** for easy sharing
- **No complex relationships** - everything embedded

## Main Table Structure

```typescript
sessions {
  code: text (PRIMARY KEY)      // "ABC1", "XYZ9"
  name: text                     // Session name
  createdAt: text               // Timestamp
  isActive: boolean             // Active status
  activities: JSON              // Array of activities
  currentActivity: integer      // Current index
  responses: JSON               // All participant responses
  participants: JSON            // Array of names
  metadata: JSON                // Extensible metadata
}
```

## Key Design Decisions

### 1. Single Table vs Multi-Table
**Before**: Complex multi-table with foreign keys
```
sessions → participants → responses
         → activities → questions
```

**Now**: Single table with JSON
```
sessions (everything in JSON columns)
```

**Benefits**:
- Simpler queries (no JOINs)
- Atomic updates
- Easy to backup/restore
- Perfect for real-time updates

### 2. Session Codes
```typescript
// 4-character codes: 3 letters + 1 number
generateSessionCode(): string {
  // ABC1, XYZ9, etc.
  // No I/O/0 for clarity
}
```

### 3. JSON Structure Examples

**Activities Array**:
```json
[
  {
    "id": "activity_001",
    "type": "quiz",
    "name": "Team Preferences",
    "config": {
      "questions": [...]
    }
  },
  {
    "id": "activity_002", 
    "type": "poll",
    "name": "Lunch Choice",
    "config": {
      "options": [...]
    }
  }
]
```

**Responses Structure**:
```json
{
  "Alice": {
    "0": { "questionId": "q1", "answer": "team" },
    "1": { "optionIds": ["opt1"] }
  },
  "Bob": {
    "0": { "questionId": "q1", "answer": "solo" }
  }
}
```

## Helper Functions

```typescript
// Add participant
addParticipant(session, name)

// Add response
addResponse(session, participantName, activityIndex, response)

// Switch activity
switchActivity(session, activityIndex)

// Add new activity
addActivity(session, activity)

// Create session
createSession(name, activities)
```

## Database Operations

### Using Drizzle ORM
```typescript
// Create session
await db.insert(sessions).values(newSession);

// Get session
const [session] = await db.select()
  .from(sessions)
  .where(eq(sessions.code, code));

// Update responses
await db.update(sessions)
  .set({ responses: updatedResponses })
  .where(eq(sessions.code, code));

// Delete old sessions
await db.delete(sessions)
  .where(lt(sessions.createdAt, oneWeekAgo));
```

## Migration from Complex Schema

### Old Tables (archived):
- `user` - Authentication users
- `session` - Auth sessions  
- `participants` - Quiz participants
- `documents` - Vector storage
- `knowledge_base` - AI knowledge

### Current Focus:
- Single `sessions` table
- Everything else via JSON
- Can add tables later if needed

## Performance Considerations

### Indexes
```sql
CREATE UNIQUE INDEX idx_sessions_code ON sessions(code);
CREATE INDEX idx_sessions_created ON sessions(createdAt);
CREATE INDEX idx_sessions_active ON sessions(isActive);
```

### Query Patterns
```typescript
// Fast lookups by code (indexed)
WHERE code = 'ABC1'

// Active sessions
WHERE isActive = true

// Cleanup old sessions
WHERE createdAt < date('now', '-7 days')
```

## JSON Query Examples

### SQLite JSON functions
```sql
-- Get participant count
SELECT json_array_length(participants) FROM sessions;

-- Check if participant exists
SELECT * FROM sessions 
WHERE json_extract(participants, '$') LIKE '%Alice%';

-- Get specific response
SELECT json_extract(responses, '$.Alice.0') FROM sessions;
```

## Best Practices

### 1. Atomic Updates
```typescript
// ✅ Update entire JSON object
const updated = addResponse(session, name, index, data);
await db.update(sessions).set({ responses: updated.responses });

// ❌ Don't try partial JSON updates
```

### 2. Size Limits
- Keep responses under 1MB per session
- Archive old sessions after 7 days
- Limit activities to ~20 per session

### 3. Concurrency
```typescript
// Use transactions for multi-step updates
await db.transaction(async (tx) => {
  const [session] = await tx.select()...;
  const updated = processSession(session);
  await tx.update(sessions).set(updated);
});
```

## File Locations

- **Schema**: `src/lib/server/db/schema.ts`
- **Connection**: `src/lib/server/db/index.ts`
- **Config**: `drizzle.config.ts`
- **Migrations**: `drizzle/migrations/`
- **Remote Functions**: `src/routes/data.remote.ts`

## Environment Setup

```env
DATABASE_URL=./local.db      # SQLite file
DATABASE_AUTH_TOKEN=         # Optional for Turso
```

## Common Operations

### Create Session
```typescript
const session = createSession("Team Meeting", [
  { id: "a1", type: "quiz", name: "Preferences", config: {} }
]);
await db.insert(sessions).values(session);
```

### Join Session
```typescript
const [session] = await db.select()
  .from(sessions)
  .where(eq(sessions.code, code));

if (session) {
  const updated = addParticipant(session, participantName);
  await db.update(sessions).set(updated);
}
```

### Submit Response
```typescript
const updated = addResponse(session, name, activityIndex, response);
await db.update(sessions).set({ responses: updated.responses });
```

## Future Considerations

### If scaling needed:
1. Move responses to separate table
2. Add Redis for session cache
3. Use PostgreSQL with JSONB
4. Implement sharding by session code

### Current limits work for:
- < 100 concurrent sessions
- < 50 participants per session
- < 20 activities per session
- 7-day retention