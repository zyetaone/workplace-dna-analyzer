# AI Agents Documentation

## 🤖 Overview
This document describes AI assistant configurations for the Zyeta DX project.

## 📋 Agent Types

### Claude (Primary Assistant)
**Purpose**: General development, architecture, debugging
**Capabilities**: 
- Full codebase understanding
- Svelte 5 expertise
- SvelteKit remote functions
- Database operations

**Instructions**: See [CLAUDE.md](./CLAUDE.md)

### Serena (Code Specialist)
**Purpose**: Semantic code operations
**Capabilities**:
- Symbol-based editing
- Find references
- Regex replacements
- Memory management

**Best For**:
- Large refactoring
- Finding unused code
- Symbol renaming
- Code cleanup

### GitHub Copilot
**Purpose**: Inline code completion
**Best For**:
- Boilerplate generation
- Pattern completion
- Test writing
- Documentation

## 🎯 Task Routing

### Use Claude/Claude Code For:
- Architecture decisions
- Complex problem solving
- Multi-file changes
- Documentation writing
- Build/deployment issues

### Use Serena For:
- Precise symbol editing
- Finding all references
- Large-scale refactoring
- Code exploration
- Memory management

### Use Copilot For:
- Quick completions
- Repetitive patterns
- Test scaffolding
- Comment generation

## 💡 Effective Prompting

### Claude/Claude Code
```markdown
"Update the quiz state management to use Svelte 5 runes 
and ensure proper cleanup in $effect"
```

### Serena
```markdown
"Find all references to SessionAnalyticsState class 
and update the constructor signature"
```

### Copilot
```javascript
// Generate a function that validates session codes
// Session codes are 6 characters: 3 letters + 3 numbers
```

## 🔧 Configuration

### Claude Code Settings
```json
{
  "model": "claude-opus-4.1",
  "context": "full-codebase",
  "tools": ["read", "write", "bash", "search"],
  "memory": true
}
```

### Serena Project Config
```yaml
project_name: ppt-app
language: typescript
framework: sveltekit
memories:
  - svelte5_patterns
  - database_architecture
  - sveltekit_remote_functions
```

### Copilot Settings
```json
{
  "enable": true,
  "languages": {
    "typescript": true,
    "svelte": true,
    "markdown": true
  }
}
```

## 📚 Knowledge Base

### Key Patterns to Share
1. **Svelte 5 Runes**: `$state`, `$derived`, `$effect`
2. **Remote Functions**: `query` and `command` wrappers
3. **Database**: 2-table structure with cookie tracking
4. **No Auth**: Anonymous participation design
5. **Real-time**: Polling-based updates

### Project Context
- **Framework**: SvelteKit 5 + Svelte 5
- **Database**: SQLite with Drizzle ORM
- **Validation**: Valibot schemas
- **Styling**: TailwindCSS
- **Charts**: D3.js and Chart.js

### Common Tasks
1. **Add new question**: Update `src/lib/questions.ts`
2. **Modify scoring**: Edit `src/lib/utils/scoring.ts`
3. **Change UI**: Components in `src/lib/components/ui/`
4. **Update schema**: Edit `src/lib/server/db/schema.ts`
5. **Add remote function**: Create in `src/routes/*.remote.ts`

## 🚀 Workflow Examples

### Feature Development
1. Use Claude to plan architecture
2. Use Serena for initial implementation
3. Use Copilot for detail work
4. Use Claude for testing strategy

### Bug Fixing
1. Use Claude to understand the issue
2. Use Serena to find all occurrences
3. Use Copilot for the fix
4. Use Claude to verify solution

### Refactoring
1. Use Serena to find all symbols
2. Use Claude to plan approach
3. Use Serena for bulk changes
4. Use Claude for verification

## ⚠️ Limitations

### Claude
- May suggest outdated patterns
- Context window limits
- Can't run code directly

### Serena
- Language server dependent
- May need restarts
- Symbol resolution issues

### Copilot
- Generic suggestions
- May not follow project patterns
- Security concerns with suggestions

## 🔐 Security Notes

1. **Never commit API keys** - Use environment variables
2. **Review AI suggestions** - Check for vulnerabilities
3. **Validate inputs** - AI may skip validation
4. **Test thoroughly** - AI code needs verification

---

*For project-specific instructions, see [CLAUDE.md](./CLAUDE.md)*
*For development workflow, see [TODO.md](./TODO.md)*