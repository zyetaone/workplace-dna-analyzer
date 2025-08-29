# Agent Guidelines for PPT App

## Commands
- **Dev**: `npm run dev` (port 5173 with --host)
- **Build**: `npm run build`
- **Preview**: `npm run preview` (with --host)
- **Start**: `npm start`
- **DB**: `npm run db:generate`, `npm run db:migrate`, `npm run db:push`, `npm run db:studio`
- **Type check**: `npx svelte-check --tsconfig ./tsconfig.json`

## Code Style
- **Svelte 5**: Use `$state`, `$derived`, `$effect` runes
- **Imports**: `$lib/` for internal, relative paths for local
- **Types**: Strict TypeScript (interfaces/types in dedicated files)
- **Naming**: camelCase variables/functions, PascalCase components/types
- **Components**: Use `$props()`, snippets for children, Tailwind CSS
- **Validation**: Valibot schemas for all remote function inputs
- **Error handling**: `<svelte:boundary>` for runtime errors, `{#if error}` for reactive state
- **Attachments**: `{@attach ...}` for reactive DOM interactions and effects
- **State**: Class-based reactive state with proper cleanup
- **Remote functions**: `query` for reads, `command` for writes
- **Database**: Drizzle ORM with SQLite, UUID primary keys
- **Formatting**: 2-space indentation, single quotes, semicolons

## Modern Svelte 5 Features

### {@attach ...} Patterns
Use `{@attach ...}` for reactive DOM interactions:

```svelte
<!-- Tooltip with reactive content -->
<Tooltip content={dynamicContent}>
  <button>Hover me</button>
</Tooltip>

<!-- Click outside detection -->
<div {@attach clickOutside(() => closeModal())}>
  Modal content
</div>

<!-- Focus trap for accessibility -->
<div {@attach focusTrap()}>
  Modal content
</div>

<!-- Auto-resize textarea -->
<textarea {@attach autoResize(40)} bind:value={text} />

<!-- Intersection observer -->
<div {@attach intersectionObserver(handleVisible)}>
  Lazy loaded content
</div>
```

### Error Boundaries
Use `<svelte:boundary>` for runtime error handling:

```svelte
<ErrorBoundary title="Component Error">
  <UnstableComponent />
</ErrorBoundary>

<!-- With custom error handling -->
<svelte:boundary onerror={(error, reset) => reportError(error)}>
  <RiskyComponent />
</svelte:boundary>
```

### Attachment Utilities
Available in `$lib/utils/attachments.ts`:
- `intersectionObserver()` - Lazy loading, scroll animations
- `clickOutside()` - Dropdowns, modals
- `focusTrap()` - Accessibility, keyboard navigation
- `resizeObserver()` - Responsive components
- `autoResize()` - Dynamic text areas
- `scrollListener()` - Scroll-based interactions
- `copyToClipboard()` - User interactions
- `longPress()` - Mobile interactions

## AI Features

### AI Insights Integration
- **OpenAI API**: Configurable via `OPENAI_API_KEY`
- **Smart Analysis**: Workplace preference insights and recommendations
- **Real-time Processing**: AI-powered analytics in admin dashboard
- **Error Handling**: Graceful fallbacks when AI unavailable

### AI Remote Functions
```typescript
// AI insights for session analysis
export const generateInsights = command(
  v.object({ sessionId: v.string() }),
  async ({ sessionId }) => {
    const insights = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: analysisPrompt }]
    });
    return { insights: insights.choices[0].message.content };
  }
);
```

## Component Architecture

### Shared Components
```
src/lib/components/shared/
├── ErrorBoundary.svelte      # Runtime error handling
├── Tooltip.svelte           # Reactive tooltips
├── Modal.svelte            # Accessible modals with focus trap
├── AttachmentDemo.svelte    # {@attach ...} examples
└── ErrorMessage.svelte      # Display component for errors
```

### UI Components
```
src/lib/components/ui/
├── Button.svelte           # Enhanced with {@attach ...} support
├── Card.svelte            # Reusable card layouts
├── Progress.svelte        # Quiz progress indicators
├── Select.svelte         # Form select components
├── StatsCard.svelte      # Analytics display cards
└── ConfirmationDialog.svelte # User confirmations
```

### Chart Components
```
src/lib/components/charts/
├── Chart.svelte          # Chart.js wrapper
├── D3BarChart.svelte     # D3 bar charts
├── D3DonutChart.svelte   # D3 donut charts
├── D3RadarChart.svelte   # D3 radar charts
└── WordCloud.svelte      # Text visualization
```

## File Organization

### Updated Structure
```
src/
├── lib/
│   ├── components/
│   │   ├── shared/           # Reusable components
│   │   │   ├── ErrorBoundary.svelte
│   │   │   ├── Tooltip.svelte
│   │   │   ├── Modal.svelte
│   │   │   └── AttachmentDemo.svelte
│   │   ├── ui/               # UI primitives
│   │   └── charts/           # Data visualization
│   ├── utils/
│   │   ├── attachments.ts    # {@attach ...} utilities
│   │   ├── validation.ts     # Moved from lib root
│   │   ├── scoring.ts        # Preference calculations
│   │   ├── common.ts         # Shared utilities
│   │   └── id.ts            # ID generation
│   ├── server/
│   │   ├── db/              # Database operations
│   │   └── shared/          # Server utilities
│   └── state/               # Reactive state management
├── routes/
│   ├── admin/
│   │   ├── [code]/
│   │   │   └── ai-insights.remote.ts  # AI features
│   │   └── data.remote.ts    # Admin operations
│   └── [code]/
│       ├── data.remote.ts    # Participant operations
│       └── presenter.remote.ts # Quiz state
└── app.css                  # Global styles
```

## Development Workflow

### Modern Patterns
1. **Use `{@attach ...}`** instead of `use:` actions for reactive DOM interactions
2. **Implement `<svelte:boundary>`** for runtime error handling
3. **Leverage AI features** for enhanced analytics and insights
4. **Follow component composition** with proper prop interfaces
5. **Use reactive state** with proper cleanup in `$effect`

### Best Practices
- **Error Boundaries**: Wrap risky components with `<svelte:boundary>`
- **Attachments**: Use attachment factories for reusable patterns
- **AI Integration**: Handle API failures gracefully with fallbacks
- **Performance**: Use `$derived.by()` for expensive computations
- **Accessibility**: Implement focus traps and proper ARIA labels
- **TypeScript**: Use strict typing for all component props and utilities

### Testing Modern Features
```typescript
// Test {@attach ...} utilities
import { clickOutside } from '$lib/utils/attachments';

// Test error boundaries
import ErrorBoundary from '$lib/components/shared/ErrorBoundary';

// Test AI features
import { generateInsights } from '$lib/server/ai-insights';
```

## Deployment & Production

### Environment Setup
```env
# Required
DATABASE_URL=./local.db
PUBLIC_APP_URL=https://your-domain.com

# AI Features (Optional)
OPENAI_API_KEY=your-openai-api-key

# Production Optimizations
NODE_ENV=production
```

### Build Optimization
- **Error Boundaries**: Automatic error reporting in production
- **Attachments**: Optimized cleanup and memory management
- **AI Features**: Caching and rate limiting for API calls
- **Bundle Size**: Tree-shaking of unused utilities

This documentation reflects the modern Svelte 5 architecture with advanced patterns for error handling, reactive DOM interactions, and AI-powered features.</content>
</xai:function_call