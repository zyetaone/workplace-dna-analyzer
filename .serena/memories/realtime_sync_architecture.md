# Real-time Quiz Synchronization Architecture

## Overview
Implementing real-time data synchronization between participant quiz-taking (`/[code]`) and admin monitoring (`/admin/[code]`) using Server-Sent Events (SSE).

## Key Components

### 1. Shared Quiz State (`quizState.svelte.ts`)
- Central state management for quiz sessions
- SSE connection handling with reconnection logic
- Update queue for race condition prevention
- Optimistic updates with rollback capability

### 2. SSE Streaming Endpoint
- Server endpoint at `/api/sse/[code]`
- Broadcasts events: participant_joined, answer_submitted, quiz_completed
- Handles connection lifecycle and cleanup

### 3. Event Flow
```
Participant Action → Database Update → SSE Broadcast → Admin View Update
```

### 4. Race Condition Prevention
- Update queue with retry logic
- Database transactions for atomic operations
- Optimistic updates with rollback on failure
- Exponential backoff for reconnection

## Implementation Notes
- Use existing `admin.svelte.ts` for admin-specific state
- Create new `quizState.svelte.ts` for shared quiz state
- Leverage Svelte 5 runes for reactive state
- Maintain backward compatibility with existing code