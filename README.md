# Zyeta DX - Workplace Intelligence Platform

> Transform workplace insights with real-time engagement analytics - no login required!

[![SvelteKit](https://img.shields.io/badge/SvelteKit-5.0-ff3e00.svg)](https://kit.svelte.dev)
[![Svelte](https://img.shields.io/badge/Svelte-5.0-ff3e00.svg)](https://svelte.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Access at:** http://localhost:5173

## 📱 Features

### For Presenters
- **Instant Sessions** - Generate 6-character codes (e.g., ABC123)
- **QR Code Access** - Participants join instantly via mobile
- **Live Dashboard** - Real-time analytics and insights
- **AI Insights** - Optional OpenAI-powered recommendations

### For Participants
- **No Login Required** - Join anonymously via QR/code
- **Quick Assessment** - 7 questions, 30 seconds each
- **Instant Results** - See workplace preference scores
- **Mobile Optimized** - Works on any device

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│   Browser   │────▶│  SvelteKit   │────▶│   SQLite   │
│  (Svelte 5) │◀────│   (SSR/API)  │◀────│  (Drizzle) │
└─────────────┘     └──────────────┘     └────────────┘
       │                    │                     │
       └────────────────────┴─────────────────────┘
                     Remote Functions
                    (Type-safe RPC)
```

### Tech Stack
- **Frontend**: Svelte 5 (runes), TailwindCSS
- **Backend**: SvelteKit 5, Node.js 20+
- **Database**: SQLite with Drizzle ORM
- **Charts**: D3.js, Chart.js
- **AI**: OpenAI GPT-4 (optional)

## 📂 Project Structure

```
ppt-app/
├── src/
│   ├── routes/          # Pages and API endpoints
│   │   ├── [code]/      # Participant flow
│   │   ├── admin/       # Admin dashboard
│   │   └── *.remote.ts  # Remote functions
│   ├── lib/
│   │   ├── components/  # UI components
│   │   ├── server/      # Backend logic
│   │   └── utils/       # Utilities
│   └── app.html         # HTML template
├── drizzle/             # Database migrations
├── static/              # Static assets
├── VISION.md            # Product vision
├── PRD.md              # Requirements
├── TODO.md             # Task tracking
├── CHANGELOG.md        # Version history
├── AGENTS.md           # AI assistants guide
└── CLAUDE.md           # Claude instructions
```

## 🔧 Configuration

### Environment Variables
```env
# Required
DATABASE_URL=./local.db              # SQLite database path
PUBLIC_APP_URL=http://localhost:5173 # Application URL

# Optional
OPENAI_API_KEY=sk-...                # For AI insights
```

### Key Files
- **Schema**: `src/lib/server/db/schema.ts`
- **Questions**: `src/lib/questions.ts`
- **State**: `src/lib/state/quizState.svelte.ts`
- **Scoring**: `src/lib/utils/scoring.ts`

## 🎯 Development

### Commands
```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
npm test           # Run tests
npm run db:push    # Update database schema
npm run db:studio  # Open Drizzle Studio
```

### Code Patterns

#### Svelte 5 Runes
```typescript
// Reactive state
let count = $state(0);
let doubled = $derived(count * 2);
$effect(() => {
  console.log(count);
  return () => cleanup();
});
```

#### Remote Functions
```typescript
// Server function
export const getData = query(
  v.object({ id: v.string() }),
  async ({ id }) => {
    return await db.select().from(sessions);
  }
);
```

## 📊 Metrics & Performance

- **Load Time**: < 2 seconds
- **Bundle Size**: < 500KB gzipped
- **Lighthouse Score**: 95+
- **Accessibility**: WCAG 2.1 AA

## 🔐 Security

- ✅ No authentication required (by design)
- ✅ Cookie-based anonymous tracking
- ✅ SQL injection prevention (Drizzle ORM)
- ✅ XSS protection (SvelteKit defaults)
- ✅ CSP headers configured

## 📚 Documentation

- [Vision & Strategy](./VISION.md) - Product direction
- [Product Requirements](./PRD.md) - Detailed specifications
- [Task Tracking](./TODO.md) - Current sprint items
- [Change Log](./CHANGELOG.md) - Version history
- [AI Assistants](./AGENTS.md) - Using AI tools
- [Claude Guide](./CLAUDE.md) - Claude-specific instructions

## 🤝 Contributing

1. Check [TODO.md](./TODO.md) for current tasks
2. Follow existing code patterns
3. Test on mobile devices
4. Update [CHANGELOG.md](./CHANGELOG.md)

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/zyeta-dx/issues)
- **Docs**: See `/docs` folder
- **Contact**: team@zyeta.com

---

**Built with ❤️ by Zyeta Team**

*Current Version: 2.1.0 | Last Updated: August 30, 2025*