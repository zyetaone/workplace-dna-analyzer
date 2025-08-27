# UI Patterns & Shared Components

## Overview

This document outlines the reusable UI patterns and components created for the ppt-app codebase, following Svelte 5 patterns and DRY principles.

## Architecture

### Component Hierarchy

```
components/
├── SharedSnippets.svelte    # Reusable UI snippets
├── QuestionCard.svelte      # Quiz question display
├── StatCard.svelte          # Statistics display
├── ParticipantList.svelte   # Participant management
├── LoadingScreen.svelte     # Loading states
├── ErrorScreen.svelte       # Error states
├── QRCode.svelte           # QR code generation
└── charts/
    ├── Chart.svelte        # Chart.js wrapper
    └── WordCloud.svelte    # D3 word cloud
```

## Shared Snippets

### sessionCard
Displays session information with actions.

```svelte
{@render sessionCard({
  session: { name, slug, code, isActive, activeCount, completedCount, createdAt },
  onOpen: (slug) => void,
  onCopyLink: (slug) => void,
  onDelete: (slug) => void,
  isDeleting: boolean
})}
```

### chartContainer
Wrapper for chart displays with consistent styling.

```svelte
{@render chartContainer({
  title: string,
  config: ChartConfiguration,
  height?: string,
  className?: string,
  loading?: boolean,
  error?: string
})}
```

### scoreCard
Displays metric scores with colors.

```svelte
{@render scoreCard({
  score: number,
  label: string,
  colorClass: string,
  showPercentage?: boolean,
  size?: 'sm' | 'md' | 'lg'
})}
```

### participantRow
Table row for participant data.

```svelte
{@render participantRow({
  participant: Participant,
  showId?: boolean,
  showGeneration?: boolean,
  showProgress?: boolean,
  showStatus?: boolean,
  showScores?: boolean,
  showLink?: boolean,
  showActions?: boolean,
  onDelete?: (id, name) => void,
  onCopyLink?: (id) => void
})}
```

### metricCard
Displays metrics with optional trends.

```svelte
{@render metricCard({
  label: string,
  value: number | string,
  colorClass?: string,
  icon?: string,
  trend?: 'up' | 'down' | 'neutral',
  animate?: boolean
})}
```

### emptyState
Empty state display with optional action.

```svelte
{@render emptyState({
  icon?: string,
  title: string,
  message: string,
  action?: { label: string, onclick: () => void }
})}
```

### statusBadge
Status indicator with animation.

```svelte
{@render statusBadge({
  status: 'active' | 'inactive' | 'completed' | 'in-progress',
  animate?: boolean,
  size?: 'xs' | 'sm' | 'md'
})}
```

### progressBar
Progress indicator with percentage.

```svelte
{@render progressBar({
  current: number,
  total: number,
  showLabel?: boolean,
  colorClass?: string,
  height?: string,
  animate?: boolean
})}
```

### connectionStatus
Real-time connection indicator.

```svelte
{@render connectionStatus('connected' | 'connecting' | 'disconnected')}
```

### loadingIndicator
Loading spinner with message.

```svelte
{@render loadingIndicator(message?: string, size?: 'sm' | 'md' | 'lg')}
```

### actionButton
Consistent button styling.

```svelte
{@render actionButton({
  label: string,
  onclick: () => void,
  variant?: 'primary' | 'secondary' | 'danger',
  size?: 'sm' | 'md' | 'lg',
  disabled?: boolean,
  loading?: boolean,
  icon?: string
})}
```

## Component Usage

### QuestionCard

Full-featured quiz question display:

```svelte
<QuestionCard
  title="Question title"
  subtitle="Optional subtitle"
  options={[{ id, label, description, icon, values }]}
  selectedId={currentSelection}
  onSelect={(optionId) => handleSelect(optionId)}
  disabled={isProcessing}
  questionNumber={1}
  totalQuestions={7}
  progress={14.3}
  variant="default"
  colorScheme="gray"
/>
```

### StatCard

Statistics display card:

```svelte
<StatCard
  title="Active Users"
  value={42}
  subtitle="Last 24 hours"
  icon="👥"
  trend={{ value: 12, direction: 'up' }}
  colorClass="text-green-600"
  bgClass="bg-green-50"
  animate={true}
/>
```

### ParticipantList

Comprehensive participant management:

```svelte
<ParticipantList
  participants={[...]}
  onDelete={(id, name) => handleDelete(id, name)}
  onCopyLink={(id) => copyLink(id)}
  showActions={true}
  showProgress={true}
  showStatus={true}
  showGeneration={true}
  showScores={true}
  showId={true}
  showLink={true}
  emptyMessage="No participants yet"
/>
```

## Design Patterns

### 1. Snippet Pattern
- Use for repeated UI patterns within the same component
- Keep snippets focused and single-purpose
- Pass typed props for safety

### 2. Component Pattern
- Use for complex, reusable functionality
- Include proper TypeScript interfaces
- Export from central index

### 3. Composition Pattern
- Combine snippets and components
- Use slots for flexibility
- Maintain consistent styling

### 4. State Management
- Use `$state` for reactive values
- Use `$derived` for computed values
- Use `$effect` sparingly for side effects

## Color Schemes

### Status Colors
- Active: `green-500` with pulse animation
- Inactive: `gray-400`
- Completed: `green-600`
- In Progress: `yellow-600`

### Preference Categories
- Collaboration: `blue-600`
- Formality: `amber-600`
- Technology: `green-600`
- Wellness: `red-600`

### Background Gradients
```css
.animated-gradient {
  background: linear-gradient(-45deg, #f3f4f6, #e5e7eb, #d1d5db, #9ca3af);
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
}
```

## Accessibility

- All interactive elements have proper ARIA labels
- Color contrast meets WCAG AA standards
- Keyboard navigation fully supported
- Screen reader friendly descriptions

## Performance

- Snippets reduce bundle size vs components
- Lazy loading for heavy components (charts)
- Animation using CSS transforms
- Minimal re-renders with reactive state

## Migration Path

### From Local Snippets to Shared
1. Identify repeated patterns
2. Extract to SharedSnippets.svelte
3. Import and use with `{@render}`
4. Remove local duplicates

### From Inline HTML to Components
1. Identify complex UI sections
2. Create dedicated component
3. Add TypeScript interfaces
4. Export from index.ts

## Best Practices

1. **Keep snippets simple** - Complex logic belongs in components
2. **Type everything** - Use interfaces for all props
3. **Document usage** - Include examples in comments
4. **Test thoroughly** - Verify all states and variants
5. **Maintain consistency** - Follow established patterns

## Future Enhancements

- [ ] Toast notification system
- [ ]. Modal/dialog components
- [ ] Advanced form components
- [ ] Data table with sorting/filtering
- [ ] Animated transitions library
- [ ] Theme customization system