# Workplace Preference Survey App

A real-time workplace preference analysis system that helps organizations understand their team's workplace DNA through interactive surveys. Built with SvelteKit 5 and modern web technologies.

## ✨ Features

- **Real-time Analytics**: Live updates as participants complete surveys
- **QR Code Access**: Instant participant joining via QR codes
- **Workplace DNA Analysis**: AI-powered insights and preference scoring
- **Mobile Optimized**: Works seamlessly across all devices
- **No Authentication**: Open access for easy participation

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
npm run db:push

# Start development
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to access the application.

### Environment Variables (Optional)
```env
DATABASE_URL=./local.db
PUBLIC_APP_URL=http://localhost:5173
OPENAI_API_KEY=your-api-key-here  # For AI insights
```

## 📱 Usage

### For Presenters
1. Navigate to `/` and create a new session
2. Share the QR code with participants
3. Monitor real-time analytics as responses come in

### For Participants  
1. Scan QR code or visit the session link
2. Enter your name and select generation
3. Complete the 7-question workplace preference survey
4. View your personalized workplace DNA results

## 🏗️ Tech Stack

- **SvelteKit 5** with Svelte 5 runes
- **LibSQL** (SQLite-compatible) with Drizzle ORM
- **TailwindCSS** for styling
- **Chart.js** for data visualization
- **Server-Sent Events** for real-time updates
- **Coolify** for deployment and hosting

## 🚢 Production

### Coolify Deployment (Recommended)
1. Connect your repository to Coolify
2. Set domain: `zyetaApp.rdtect.com`
3. Coolify handles SSL, reverse proxy, and deployment automatically

### Manual Docker Deployment
```bash
npm run build          # Build for production
docker build -t app .  # Build Docker image
docker run -p 3000:3000 app  # Run container
```

## 📖 Documentation

**Main Documentation**: See [/docs/README.md](../docs/README.md) for complete project documentation

**App-Specific**:
- [CLAUDE.md](./CLAUDE.md) - SvelteKit development guide and architecture
- [IMPLEMENTATION-REPORT.md](./IMPLEMENTATION-REPORT.md) - Points to main docs implementation report

**Quick Links**:
- [Technical Guide](../docs/architecture/TECHNICAL-GUIDE.md) - Complete technical documentation
- [Product Overview](../docs/getting-started/PROJECT-OVERVIEW.md) - Vision and strategy
- [Development Setup](../docs/development/README.md) - Development environment

## 📝 License

MIT License