# Workplace Preference Survey App

A real-time workplace preference analysis system that helps organizations understand their team's workplace DNA through interactive quizzes and AI-powered insights. Built with SvelteKit 5 and modern web technologies.

## ✨ Features

### For Presenters
- **Real-time Analytics Dashboard**: Live updates as participants complete surveys
- **Interactive Charts**: Generation distribution, preference scores, and workplace DNA analysis
- **Session Management**: Create, manage, and monitor sessions with QR codes
- **AI Insights**: Optional OpenAI integration for workspace recommendations

### For Participants  
- **Quick Join**: Scan QR code or join via session link
- **7-Question Survey**: Scenario-based workplace preference questions
- **Instant Results**: Personal preference scores and generation insights

## 🚀 Tech Stack

- **Framework**: SvelteKit 5 with Svelte 5 runes (`$state`, `$derived`, `$effect`)
- **Database**: SQLite with Drizzle ORM (WAL2 mode)
- **State Management**: Client-side state classes with reactive runes
- **Real-time**: Server-side streaming for live updates
- **Validation**: Valibot schemas with type-safe remote functions
- **Styling**: TailwindCSS
- **Charts**: Chart.js with reusable configuration utilities

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- OpenAI API key (optional, for AI features)

### Installation
```bash
# Clone and install
git clone <repository-url>
cd ppt-app
npm install

# Set up database
npm run db:generate
npm run db:push

# Start development
npm run dev
```

### Environment Variables (Optional)
```env
# Required
DATABASE_URL=./local.db
PUBLIC_APP_URL=http://localhost:5173

# Optional
OPENAI_API_KEY=your-api-key-here
```

## 📱 Usage

### Creating a Session (Presenter)
1. Navigate to the dashboard (`/dashboard`)
2. Click "Create Session" and enter a session name
3. Share the generated QR code with participants
4. Monitor real-time analytics as participants complete the survey

### Joining a Session (Participant)
1. Scan the QR code or visit the session link
2. Enter your name and select your generation
3. Complete the 7-question workplace preference survey
4. View your personalized results and workplace DNA

## 🏗️ Architecture

### Modern Svelte 5 Patterns
- **State Classes**: Client-side state management with `.svelte.ts` files
- **Remote Functions**: Server CRUD operations in `.remote.ts` files
- **Reactive Runes**: `$state`, `$derived`, `$effect` for reactivity
- **Server Streaming**: Real-time updates via load functions

### Key Files
```
src/
├── routes/dashboard/
│   ├── dashboard.svelte.ts        # Dashboard state management
│   ├── dashboard.remote.ts        # Server CRUD operations
│   └── [slug]/
│       ├── presenter.svelte.ts    # Live session state
│       └── p/[id]/quiz/
│           ├── quiz.svelte.ts     # Quiz state management
│           └── participant.remote.ts # Participant CRUD
├── lib/
│   ├── server/db/                 # Database layer (Drizzle + SQLite)
│   ├── components/                # Reusable UI components
│   └── utils/chart-config.ts      # Chart utilities
```

## 🗄️ Database Commands

```bash
npm run db:generate     # Generate Drizzle migrations
npm run db:push         # Push schema changes
npm run db:studio       # Open Drizzle Studio UI
```

## 🚢 Production

```bash
npm run build          # Build for production
npm run preview        # Preview production build
npm start              # Run production server
```

## 📖 Documentation

- [CLAUDE.md](./CLAUDE.md) - Complete development guide and architecture
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed system design

## 📝 License

MIT License

---

Built with SvelteKit 5, Svelte 5 runes, and modern web technologies.