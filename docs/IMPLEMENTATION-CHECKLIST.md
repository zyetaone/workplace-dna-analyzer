# Implementation Checklist - Quick Start Guide

## 🚨 Critical Fixes (Day 1)

### 1. Fix Presenter Dashboard
```svelte
<!-- src/routes/session/[sessionId]/presenter/+page.svelte -->
<!-- Add after line 99 -->

// Fix: Complete the QR code display
<div class="bg-white p-6 rounded-lg shadow-lg">
  <h3 class="text-lg font-bold mb-4">Join Session</h3>
  <QRCode value={sessionUrl} size={200} />
  <p class="text-sm mt-2">Code: {sessionCode}</p>
  <p class="text-xs text-gray-600">{sessionUrl}</p>
</div>
```

### 2. Fix Dockerfile Server Reference
```dockerfile
# Line 46 - Already fixed, but verify:
CMD ["node", "build/index.js"]
```

### 3. Add Missing nanoid Import
```typescript
// src/routes/api/sessions/+server.ts
// Add import at top
import { nanoid } from 'nanoid';
```

---

## 📦 Missing Dependencies to Install

```bash
# Required packages not currently installed
npm install --save \
  nanoid \
  express-rate-limit \
  dompurify \
  jsonwebtoken \
  pdfkit \
  d3-cloud \
  redis \
  ioredis \
  winston \
  @sentry/sveltekit

# Dev dependencies
npm install --save-dev \
  @types/jsonwebtoken \
  @types/dompurify \
  @vitest/ui \
  @testing-library/svelte \
  @playwright/test
```

---

## 🔧 Configuration Files to Add

### 1. Environment Variables (.env.example)
```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/presentation

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-here-change-in-production

# Sentry
SENTRY_DSN=

# App
NODE_ENV=development
PORT=3000
ORIGIN=http://localhost:3000
```

### 2. Vitest Configuration (vitest.config.ts)
```typescript
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts']
  }
});
```

### 3. Playwright Configuration (playwright.config.ts)
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 🏗️ Database Migrations to Run

```bash
# Generate migration for indexes
npm run db:generate

# Add these indexes to the migration file:
CREATE INDEX idx_sessions_code ON sessions(code);
CREATE INDEX idx_attendees_session_id ON attendees(session_id);
CREATE INDEX idx_responses_interaction_id ON responses(interaction_id);
CREATE INDEX idx_interactions_session_id ON interactions(session_id);

# Run migration
npm run db:migrate
```

---

## 🔐 Security Implementation

### 1. Rate Limiting (src/hooks.server.ts)
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

// Apply to API routes
```

### 2. Input Validation Schema (src/lib/server/validation.ts)
```typescript
import * as v from 'valibot';

export const CreateSessionSchema = v.object({
  title: v.pipe(
    v.string(),
    v.minLength(3, 'Title must be at least 3 characters'),
    v.maxLength(100, 'Title must be less than 100 characters')
  ),
  presenterId: v.string()
});

export const SubmitResponseSchema = v.object({
  sessionCode: v.pipe(v.string(), v.length(6)),
  interactionId: v.string(),
  attendeeId: v.string(),
  answer: v.any()
});
```

### 3. JWT Implementation (src/lib/server/auth.ts)
```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export function generateToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
```

---

## 📊 Missing Chart Components

### Real-time Chart Update (src/lib/components/RealtimeChart.svelte)
```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Chart from 'chart.js/auto';
  
  export let data: any;
  export let type: 'bar' | 'pie' | 'doughnut' = 'bar';
  
  let canvas: HTMLCanvasElement;
  let chart: Chart;
  
  $effect(() => {
    if (chart && data) {
      chart.data = data;
      chart.update('none'); // Skip animation for real-time
    }
  });
  
  onMount(() => {
    chart = new Chart(canvas, {
      type,
      data,
      options: {
        responsive: true,
        animation: { duration: 0 }
      }
    });
  });
  
  onDestroy(() => {
    chart?.destroy();
  });
</script>

<canvas bind:this={canvas}></canvas>
```

---

## 🧪 Test Examples to Implement

### Unit Test (src/routes/api/sessions/+server.test.ts)
```typescript
import { describe, it, expect } from 'vitest';
import { POST } from './+server';

describe('Sessions API', () => {
  it('should create a new session', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Session',
        presenterId: 'test-presenter'
      })
    });
    
    const response = await POST({ request });
    const data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data.code).toHaveLength(6);
  });
});
```

### E2E Test (tests/e2e/session.spec.ts)
```typescript
import { test, expect } from '@playwright/test';

test('create and join session', async ({ page }) => {
  // Create session
  await page.goto('/');
  await page.fill('input[placeholder*="session title"]', 'Test Session');
  await page.click('button:has-text("Create Session")');
  
  // Should redirect to presenter view
  await expect(page).toHaveURL(/\/session\/.*\/presenter/);
  
  // QR code should be visible
  await expect(page.locator('canvas')).toBeVisible();
});
```

---

## 🚀 Performance Optimizations

### 1. Add Redis Caching (src/lib/server/redis.ts)
```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export async function cacheSession(sessionId: string, data: any) {
  await redis.setex(`session:${sessionId}`, 300, JSON.stringify(data));
}

export async function getCachedSession(sessionId: string) {
  const data = await redis.get(`session:${sessionId}`);
  return data ? JSON.parse(data) : null;
}
```

### 2. Database Connection Pool (src/lib/server/db.ts)
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, {
  max: 20, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10
});

export const db = drizzle(sql);
```

---

## 📝 API Documentation Template

### Create `API.md` in project root:
```markdown
# API Documentation

## Authentication
All presenter endpoints require JWT token in Authorization header:
`Authorization: Bearer <token>`

## Endpoints

### Create Session
`POST /api/sessions`

Request:
{
  "title": "Q3 Town Hall",
  "presenterId": "presenter-123"
}

Response:
{
  "id": "uuid",
  "code": "ABC123",
  "name": "Q3 Town Hall"
}

### Join Session
`POST /api/sessions/join`

Request:
{
  "code": "ABC123",
  "attendeeName": "John Doe"
}

### Submit Response
`POST /api/responses`

Request:
{
  "sessionCode": "ABC123",
  "interactionId": "uuid",
  "attendeeId": "uuid",
  "answer": {...}
}

## WebSocket Events

### Client -> Server
- `session:join` - Join a session room
- `response:submit` - Submit survey response
- `interaction:start` - Start a question

### Server -> Client
- `attendee:joined` - New attendee joined
- `response:received` - New response received
- `interaction:started` - Question activated
```

---

## 🎯 Quick Wins (Implement Today)

1. **Fix QR Code Display** - 30 minutes
2. **Add Missing Imports** - 10 minutes
3. **Install Dependencies** - 15 minutes
4. **Add Environment Variables** - 10 minutes
5. **Create Basic Tests** - 1 hour
6. **Add Rate Limiting** - 30 minutes
7. **Fix WebSocket Events** - 1 hour
8. **Add Export Buttons** - 1 hour

Total: ~4.5 hours for basic improvements

---

## 📞 Support & Questions

For implementation questions, refer to:
1. **Technical Guide**: `/docs/TECHNICAL-GUIDE.md`
2. **PRD**: `/docs/FINAL-PRD.md`
3. **Sprint Plan**: `SPRINT-PLAN.md`
4. **Review Report**: `TECHNICAL-REVIEW-REPORT.md`

---

**Start Date**: Immediately  
**First Milestone**: Core fixes complete by EOD  
**Sprint 1 Complete**: 2 weeks