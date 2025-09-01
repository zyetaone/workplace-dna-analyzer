# Product Requirements Document (PRD)

## 📋 Product Overview

**Zyeta DX** is a workplace intelligence platform for real-time preference analysis during presentations.

## 🎯 Core Features

### 1. Session Management

- **Create Session**: Generate 6-character code (format: XXX123)
- **QR Code Access**: Instant mobile join via QR scan
- **Live Dashboard**: Real-time participant tracking
- **Session Control**: Start, pause, end capabilities

### 2. Quiz System

- **7 Questions**: Workplace preference assessment
- **4 Categories**: Collaboration, Formality, Tech, Wellness
- **Timed Responses**: 30-second auto-advance
- **Progress Tracking**: Visual progress bar

### 3. Analytics Dashboard

- **Real-Time Updates**: Live participant count and completion rate
- **Generation Breakdown**: Baby Boomer, Gen X, Millennial, Gen Z
- **Preference Scoring**: 4-dimensional workplace DNA
- **Visual Charts**: D3.js interactive visualizations

### 4. AI Insights (Optional)

- **Pattern Recognition**: Identify workplace trends
- **Recommendations**: Actionable workplace improvements
- **Concept Clouds**: Visual representation of themes

## 🔧 Technical Specifications

### Frontend

```typescript
// Stack
- Framework: SvelteKit 5.0+
- UI: Svelte 5 with runes ($state, $derived, $effect)
- Styling: TailwindCSS 3.4+
- Charts: D3.js + Chart.js
- Build: Vite 5.0+
```

### Backend

```typescript
// Architecture
- Runtime: Node.js 20+
- Database: SQLite with WAL2 mode
- ORM: Drizzle ORM
- Validation: Valibot
- API: SvelteKit Remote Functions
```

### Database Schema

```sql
-- Sessions Table
sessions {
  id: text (nanoid)
  code: text (6-char, unique)
  name: text
  isActive: boolean
  createdAt: timestamp
  endedAt: timestamp?
}

-- Participants Table
participants {
  id: text (nanoid)
  sessionId: text (FK)
  cookieId: text (unique)
  name: text?
  generation: text?
  responses: json
  preferenceScores: json
  completed: boolean
  joinedAt: timestamp
  completedAt: timestamp?
}
```

## 📐 Architecture Decisions (ADRs)

### ADR-001: No Authentication

**Decision**: Use cookie-based anonymous tracking
**Rationale**: Reduce friction, increase participation
**Trade-offs**: No persistent user profiles

### ADR-002: Remote Functions

**Decision**: Use SvelteKit experimental remote functions
**Rationale**: Type-safe RPC, automatic validation
**Trade-offs**: Experimental API may change

### ADR-003: SQLite Database

**Decision**: Use SQLite with WAL2 mode
**Rationale**: Simple deployment, sufficient performance
**Trade-offs**: Single-server limitation

### ADR-004: Real-time Updates

**Decision**: Polling over WebSockets
**Rationale**: Simpler implementation, sufficient for MVP
**Trade-offs**: Higher server load at scale

## 🚦 Non-Functional Requirements

### Performance

- Page load < 2 seconds
- Time to interactive < 3 seconds
- API response < 200ms
- 60 FPS animations

### Scalability

- Support 100 concurrent sessions
- 50 participants per session
- 5,000 total participants/day

### Security

- HTTPS only
- CSP headers configured
- XSS protection
- SQL injection prevention

### Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation
- Screen reader support
- Mobile responsive

## 📱 Device Support

- **Desktop**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Mobile**: iOS 15+, Android 10+
- **Tablet**: iPad, Android tablets
- **Minimum**: 375px width

## 🎨 Design System

- **Colors**: Zyeta brand (blues, purples)
- **Typography**: Inter (UI), JetBrains Mono (data)
- **Spacing**: 4px base unit
- **Components**: Consistent rounded corners, shadows

---

_Version 2.0 - August 2025_
