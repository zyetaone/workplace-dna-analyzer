# CLAUDE.md - AI Assistant Instructions

## 🎯 Quick Context
You're working on **Zyeta DX** - a workplace intelligence platform built with SvelteKit 5 + Svelte 5. No authentication required, QR-based access, real-time analytics.

## 🛠️ Essential Commands
```bash
npm run dev        # Start development (port 5173)
npm run build      # Build for production
npm run db:push    # Update database schema
npm test           # Run tests
```

## 🏗️ Architecture Overview
- **Frontend**: Svelte 5 runes (`$state`, `$derived`, `$effect`)
- **Backend**: SvelteKit remote functions (`query`, `command`)
- **Database**: SQLite + Drizzle ORM (2 tables: sessions, participants)
- **Validation**: Valibot schemas
- **Real-time**: Polling-based updates (5-second intervals)
- **Tracking**: Cookie-based anonymous participants

## 📁 Key Files
```
src/
├── routes/
│   ├── [code]/quiz/+page.svelte    # Quiz interface
│   ├── admin/[code]/+page.svelte   # Analytics dashboard
│   └── data.remote.ts               # Database operations
├── lib/
│   ├── server/db/schema.ts         # Database schema
│   ├── state/quizState.svelte.ts   # State management
│   ├── questions.ts                # Quiz questions
│   └── utils/scoring.ts            # Preference scoring
```

## 💡 Code Patterns

### Svelte 5 Component
```svelte
<script lang="ts">
  let count = $state(0);
  let doubled = $derived(count * 2);
  
  $effect(() => {
    const timer = setInterval(() => count++, 1000);
    return () => clearInterval(timer); // Cleanup!
  });
</script>
```

### Remote Function
```typescript
export const createSession = command(
  v.object({ name: v.string() }),
  async ({ name }) => {
    const code = generateSessionCode(); // XXX123 format
    const session = await db.insert(sessions).values({ name, code });
    return { success: true, code };
  }
);
```

## ⚠️ Important Rules
1. **No authentication** - Use cookies for tracking
2. **Always validate** - Use Valibot schemas
3. **Clean up effects** - Return cleanup functions in `$effect`
4. **Use remote functions** - Never direct database access from components
5. **Test mobile** - Must work on all devices

## 🔍 When Debugging
1. Check browser console for errors
2. Verify database with `npm run db:studio`
3. Check network tab for remote function calls
4. Ensure cookies are enabled
5. Test in incognito mode

## 📚 Documentation
- [Vision](./VISION.md) - Product strategy
- [PRD](./PRD.md) - Requirements
- [TODO](./TODO.md) - Current tasks
- [CHANGELOG](./CHANGELOG.md) - Version history
- [AGENTS](./AGENTS.md) - AI tools guide

---
*For detailed patterns, check the codebase. For Serena operations, see AGENTS.md*