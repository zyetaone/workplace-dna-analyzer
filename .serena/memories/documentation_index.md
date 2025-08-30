# Documentation Index & Reference Guide

## 📍 Where to Find What

### Project Structure
```
ppt-app/
├── README.md                    # Main project overview
├── CLAUDE.md                    # AI assistant instructions  
├── .memories/                   # AI context memories
└── docs/                        # All technical documentation
    ├── README.md               # Documentation index
    ├── SYSTEM_ARCHITECTURE.md  # Complete system overview
    ├── VISUAL_ARCHITECTURE.md  # ASCII diagrams
    └── IMPLEMENTATION_JOURNEY.md # Development timeline
```

## 🎯 Quick Reference Guide

### For Authentication
- **Simple Auth**: `src/lib/server/admin-auth.ts`
- **Lucia v3**: `src/lib/server/lucia-implementation.ts`
- **Auth Hooks**: `src/hooks.server.ts`
- **Login UI**: `src/routes/login/+page.svelte`
- **Docs**: `docs/LUCIA_AUTH_MIGRATION.md`

### For Database
- **Schema**: `src/lib/server/db/schema.ts` (simplified single-table)
- **Connection**: `src/lib/server/db/index.ts`
- **Migrations**: `drizzle/migrations/`
- **Docs**: `docs/MODELS_AND_SCHEMA.md`

### For State Management
- **Quiz State**: `src/lib/state/quizState.svelte.ts`
- **Session Store**: `src/lib/stores/sessions.svelte.ts`
- **Patterns**: See memory `svelte5_patterns`

### For Remote Functions
- **Auth**: `src/routes/auth.remote.ts`
- **Data**: `src/routes/data.remote.ts`
- **AI**: `src/routes/ai.remote.ts`
- **Pattern**: See memory `sveltekit_remote_functions`

### For Real-time Updates
- **SSE**: `src/routes/admin/[code]/+server.ts`
- **WebSocket**: `src/lib/server/websocket.ts`
- **Docs**: `docs/REALTIME_COMMUNICATION_GUIDE.md`

## 📚 Key Documentation Files

1. **System Overview**: `docs/SYSTEM_ARCHITECTURE.md`
   - Technology stack
   - Security layers
   - Performance metrics

2. **Visual Diagrams**: `docs/VISUAL_ARCHITECTURE.md`
   - ASCII art diagrams
   - Request flow
   - State machines

3. **Implementation Details**: `docs/IMPLEMENTATION_JOURNEY.md`
   - Decision log
   - Code evolution
   - Lessons learned

## 🔑 Important Patterns

### Svelte 5 Runes
- `$state()` - Reactive state
- `$derived()` - Computed values
- `$effect()` - Side effects with cleanup
- `{@attach}` - DOM interactions

### Remote Functions
- `query()` - Read operations
- `command()` - Write operations
- Valibot validation
- Type-safe returns

### Database
- Single-table design
- JSON columns for flexibility
- Helper functions for operations
- 4-character session codes

## 🎨 Component Patterns

### Form Components
- Location: `src/routes/(components)/`
- Examples: `JoinForm.svelte`, `QuizContainer.svelte`

### UI Components
- Location: `src/lib/components/ui/`
- Exports: `src/lib/components/index.ts`

### Charts
- Location: `src/lib/components/charts/`
- D3 and Chart.js implementations

## 🔐 Security Implementation

### Current Auth System
- **Type**: Session-based with cookies
- **Hashing**: PBKDF2 (simple) or SHA-256 (Lucia)
- **Sessions**: 7-day expiry, auto-refresh
- **Roles**: admin, presenter, viewer

### Security Headers
- CSP configured
- XSS protection
- Frame denial
- All in `hooks.server.ts`

## 📝 Notes

- All markdown docs go in `/docs` directory
- CLAUDE.md and README.md stay in root
- Memories stored in `.memories/`
- Use Serena for code exploration and editing