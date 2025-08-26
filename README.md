# Workplace Preference Survey App

A real-time survey application for analyzing workplace preferences across different generations, built with SvelteKit 5 and modern web technologies.

## 🌟 Features

### For Presenters
- **Real-time Analytics Dashboard**: Live updates as attendees complete the quiz
- **Generation Distribution Charts**: Visual breakdown of participants by generation
- **Workplace DNA Analysis**: Comprehensive team preference profiling
- **Word Cloud Visualization**: Dynamic concept mapping of workplace themes
- **AI-Powered Chatbot**: Three modes for workspace insights
  - Workspace Design Assistant
  - Brainstorming Assistant
  - 3D Rendering Visualization
- **Session Management**: Create, manage, and end sessions with ease
- **Participant Management**: View progress and delete attendees if needed

### For Attendees
- **Quick Join**: Join via QR code or session list
- **7 Scenario-Based Questions**: Engaging workplace preference scenarios
- **Instant Results**: Personal workplace preference scores
- **Generation-Specific Insights**: Tailored feedback based on generation

## 🚀 Tech Stack

- **Framework**: SvelteKit 5 with Svelte 5 runes
- **Database**: SQLite with Drizzle ORM
- **Validation**: Valibot with SvelteKit remote functions
- **Real-time**: Server-Sent Events (SSE)
- **Styling**: TailwindCSS
- **Charts**: Chart.js with reusable utilities
- **Build**: Vite
- **AI Integration**: OpenAI GPT-4 (optional)

## 📋 Prerequisites

- Node.js 20+ or Bun 1.0+
- OpenAI API key (optional, for AI features)

## 🔧 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ppt-app
```

2. Install dependencies:
```bash
npm install
# or
bun install
```

3. Set up environment variables (optional):
```bash
cp .env.example .env
```

4. Edit `.env` and add your configuration:
```env
# Optional: OpenAI API key for AI features
OPENAI_API_KEY=your-api-key-here
```

5. Initialize the database:
```bash
npm run db:generate
npm run db:push
```

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Mode
```bash
npm run build
npm run preview
```

## 📱 Usage

### Creating a Session (Presenter)

1. Navigate to the homepage
2. Enter a session name
3. Click "Create Session"
4. Share the QR code or session link with attendees
5. Monitor real-time analytics as attendees participate

### Joining a Session (Attendee)

1. Either:
   - Scan the QR code displayed by the presenter
   - Navigate to `/join` to see all active sessions
   - Use the direct link provided by the presenter
2. Enter your name
3. Select your generation
4. Complete the 7-question quiz
5. View your personalized results

## 🎨 AI Chatbot Features

The unified AI chatbot offers three specialized modes:

1. **Workspace Design Assistant**: Get expert recommendations based on your team's DNA
2. **Brainstorming Assistant**: Generate creative workspace concepts
3. **3D Rendering Assistant**: Visualize workspace concepts with AI-generated images

Access the chatbot via the floating button in the presenter dashboard.

## 📊 Analytics Features

- **Real-time Updates**: Live data streaming via SSE
- **Generation Distribution**: Pie chart showing participant demographics
- **Preference Scores**: Radar chart for collaboration, formality, technology, and wellness
- **Workplace DNA**: Automatic generation of team profile
- **Word Cloud**: Visual representation of key workplace themes
- **AI Insights**: Smart recommendations based on team composition

## 📁 Project Structure

```
src/
├── routes/                 # SvelteKit routes
│   ├── +page.svelte       # Home/create session
│   └── session/[sessionId]/
│       ├── presenter/     # Presenter dashboard
│       ├── join/          # Attendee join page
│       └── attendee/      # Survey interface
├── lib/
│   ├── server/            # Server-side code
│   │   ├── db/           # Database (Drizzle + SQLite)
│   │   └── sse-manager.ts # SSE management
│   ├── stores/           # Svelte stores
│   ├── components/       # Reusable components
│   └── utils/            # Utility functions
└── hooks/                # SvelteKit hooks
```

## 🗄️ Database Management

```bash
# Generate migrations
npm run db:generate

# Apply migrations
npm run db:push

# Open database studio
npm run db:studio
```

The application uses SQLite with two main tables:
- `sessions`: Stores session information and metadata
- `attendees`: Stores participant data and quiz responses

## 🐳 Docker Deployment

```bash
# Build and run with Docker
docker build -t survey-app .
docker run -p 3000:3000 -v ./data:/app/data survey-app
```

See [DOCKER.md](./DOCKER.md) for detailed deployment instructions.

## 📖 Documentation

- [Architecture Overview](./ARCHITECTURE.md) - System design and data flow
- [Docker Deployment](./DOCKER.md) - Container deployment guide
- [Implementation Guide](./docs/IMPLEMENTATION-CHECKLIST.md) - Development checklist
- [Migration Guide](./docs/MIGRATION_GUIDE.md) - Svelte 5 migration notes

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - feel free to use this project for your own workplace analysis needs!

## 🙏 Acknowledgments

- Built with [SvelteKit](https://kit.svelte.dev)
- Powered by [ZYETA's](https://zyeta.com) workplace design philosophy
- AI capabilities via [OpenAI](https://openai.com)

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

Built with SvelteKit 5 and modern web technologies.