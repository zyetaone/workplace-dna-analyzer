# Workplace DNA Analyzer

An interactive real-time workplace preference analysis platform that helps organizations understand their team's workplace DNA through engaging quizzes and AI-powered insights.

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

- **Frontend**: SvelteKit 5 with Svelte's latest runes API
- **Database**: SQLite with libSQL/Turso support
- **Real-time**: Server-Sent Events (SSE) for live updates
- **Styling**: TailwindCSS
- **Visualizations**: D3.js, Chart.js, d3-cloud
- **AI Integration**: OpenAI GPT-4 and DALL-E 3
- **Runtime**: Bun
- **Validation**: Valibot
- **ORM**: Drizzle

## 📋 Prerequisites

- [Bun](https://bun.sh) v1.0 or higher
- OpenAI API key (optional, for AI features)

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/zyetaone/workplace-dna-analyzer.git
cd workplace-dna-analyzer
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Edit `.env.local` and add your configuration:
```env
# Database configuration
DATABASE_URL=local.db

# Server configuration
HOST=0.0.0.0
PORT=3000
NODE_ENV=development

# Optional: OpenAI API key for AI features
OPENAI_API_KEY=your-api-key-here
```

5. Initialize the database:
```bash
bun run db:generate
bun run db:migrate
```

## 🏃 Running the Application

### Development Mode
```bash
bun run dev
```

The application will be available at `http://localhost:3000`

### Production Mode
```bash
bun run build
bun run preview
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

## 🗄️ Database Schema

The application uses SQLite with two main tables:
- `sessions`: Stores session information and metadata
- `attendees`: Stores participant data and quiz responses

## 🚢 Deployment

### Local VPS with libSQL

1. Update `DATABASE_URL` in `.env` to use libSQL:
```env
DATABASE_URL=libsql://your-database.turso.io
DATABASE_AUTH_TOKEN=your-auth-token
```

2. Build and run:
```bash
bun run build
bun run start
```

### Using PM2

```bash
pm2 start "bun run start" --name workplace-dna
pm2 save
pm2 startup
```

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

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>