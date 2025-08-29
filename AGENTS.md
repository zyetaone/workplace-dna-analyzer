# AGENTS.md - Development Guidelines for PPT Quiz App

## Build/Lint/Test Commands

**Development:**

- `npm run dev` - Start dev server (port 5173 with --host)
- `npm run build` - Build for production
- `npm run preview` - Preview production build with --host
- `npm start` - Start production server

**Code Quality:**

- `npm run lint` - Run Prettier + ESLint
- `npm run format` - Format code with Prettier
- `npx svelte-check --tsconfig ./tsconfig.json` - TypeScript type checking

**Database:**

- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Apply database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio GUI

**Testing:**

- `npm run test` - Run all tests with Vitest
- `npm run test:ui` - Interactive test UI
- `npm run test:coverage` - Generate coverage report
- `npm run test:watch` - Run tests in watch mode

**Performance:**

- `npm run perf:report` - Generate performance report
- `npm run perf:clear` - Clear performance metrics

## Code Style Guidelines

### Svelte 5 Patterns

- Use `$state`, `$derived`, `$effect` runes for reactive state
- Use `$props()` for component props with proper TypeScript interfaces
- Use `{@render children?.()}` for component children and composition
- Use `<svelte:boundary>` for error boundaries
- Use `{@attach ...}` for reactive DOM interactions
- Prefer `$derived.by()` for expensive computations with proper dependencies
- Use snippets for reusable component patterns

### Unified Component Architecture

#### Component Variants Pattern

All major components now follow a consistent variant pattern:

```svelte
<!-- Simple variant - basic functionality -->
<Component variant="simple" />

<!-- Enhanced variant - full features -->
<Component variant="enhanced" enableAdvanced={true} />

<!-- Specialized variants -->
<QuizOption variant="card" showInstantly={false} />
<DonutChart variant="interactive" showTooltips={true} />
<Loading variant="skeleton" showAvatar={true} />
```

#### Unified Components

**QuizOption** - Consolidates quiz option selection

- `simple`: Basic radio button functionality
- `enhanced`: Advanced animations, touch support, keyboard navigation
- `card`: Hover effects, gradient borders, mouse tracking

**DonutChart** - Unified D3 chart component

- `simple`: Basic chart with labels
- `interactive`: Hover effects, tooltips, click handling
- `generation`: Center text, percentage labels, professional styling

**Loading** - Comprehensive loading states

- `spinner`: Simple rotating spinner
- `screen`: Full-screen overlay with backdrop blur
- `skeleton`: Content placeholder with configurable lines
- `quiz`: Quiz-specific loading with progress and tips

**Button** - Enhanced button with 11 variants

- Glass morphism effects, ripple animations
- Loading states, press feedback
- Full accessibility support

### Imports & File Structure

- Internal imports: `$lib/` (e.g., `$lib/components/ui/Button.svelte`)
- Relative imports: `./` or `../` for local files
- Group imports: external libs, then internal libs, then types
- Use index.ts files for clean component exports

### Naming Conventions

- **Variables/Functions**: camelCase (`generateId`, `formatDate`)
- **Components/Types**: PascalCase (`Button`, `SessionAnalytics`)
- **Files**: kebab-case for routes, camelCase for utilities
- **Constants**: UPPER_SNAKE_CASE for config values

### TypeScript

- Strict TypeScript enabled with comprehensive type checking
- Define interfaces/types in dedicated files or inline with components
- Use Valibot schemas for runtime validation where needed
- Export types alongside implementations for better IDE support
- Prefer explicit typing over implicit type inference for complex objects

### Testing Infrastructure

#### Test Setup

- **Framework**: Vitest with jsdom environment
- **Testing Library**: @testing-library/svelte for component testing
- **Coverage**: 80% target with detailed reporting
- **CI/CD**: Automated testing on all pushes and PRs

#### Test Categories

- **Unit Tests**: Component rendering, props, events, state management
- **Integration Tests**: Component interactions, data flow
- **Accessibility Tests**: ARIA attributes, keyboard navigation, screen reader support
- **Performance Tests**: Render time, memory usage, re-render efficiency

#### Test Utilities

```typescript
import { customRender, screen, fireEvent, mockChartData } from '$lib/test-utils';

// Custom render with providers
const { container } = customRender(Component, props);

// Mock data for consistent testing
expect(screen.getByText('Expected Text')).toBeInTheDocument();

// Performance testing
const { renderTime } = await measureRenderTime(Component, props);
expect(renderTime).toBeLessThan(16); // 60fps target
```

#### Writing Tests

```typescript
// Component test example
describe('QuizOption Component', () => {
	it('renders with required props', () => {
		customRender(QuizOption, {
			id: 'option1',
			label: 'Test Option',
			selected: false,
			onSelect: vi.fn()
		});

		expect(screen.getByText('Test Option')).toBeInTheDocument();
	});

	it('calls onSelect when clicked', async () => {
		const onSelect = vi.fn();
		customRender(QuizOption, {
			id: 'option1',
			label: 'Test Option',
			selected: false,
			onSelect
		});

		await fireEvent.click(screen.getByRole('button'));
		expect(onSelect).toHaveBeenCalledWith('option1');
	});
});
```

### Performance Monitoring

#### Built-in Performance Tracking

- **Component Render Times**: Automatic tracking of slow renders (>16ms)
- **API Call Monitoring**: Duration, status codes, and performance metrics
- **Memory Usage**: Heap size monitoring with leak detection
- **Web Vitals**: LCP, FID, CLS tracking with recommendations

#### Performance Utilities

```typescript
import { trackComponentRender, generatePerformanceReport } from '$lib/utils/performance';

// Track component performance
trackComponentRender('QuizOption', renderTime, propsCount);

// Generate comprehensive report
const report = generatePerformanceReport();
console.log(report.recommendations); // Performance optimization suggestions
```

#### Performance Guidelines

- **Render Budget**: Target <16ms for 60fps
- **Memory Limit**: <50MB heap usage
- **API Timeout**: <1000ms for user-facing requests
- **Bundle Size**: <200KB JavaScript for optimal loading

#### Performance Commands

```bash
# Generate performance report
npm run perf:report

# Clear performance metrics
npm run perf:clear

# Run performance tests
npm run test:perf
```

### Error Handling

- Use `<svelte:boundary>` for runtime errors
- Reactive error states with `{#if error}`
- Graceful fallbacks for failed operations
- Proper cleanup in `$effect` with return functions

### Styling

- TailwindCSS for styling
- Custom CSS variables for theming
- Responsive design patterns
- Dark theme as default

### Formatting (Prettier)

- Use tabs (not spaces)
- Single quotes for strings
- No trailing commas
- 100 character line width
- Svelte plugin enabled

### Remote Functions

- Use `query` for read operations
- Use `command` for write operations
- Validate inputs with Valibot schemas
- Handle errors gracefully with fallbacks

### Database

- Drizzle ORM with SQLite
- Use transactions for multi-step operations
- Proper foreign key relationships
- JSON columns for complex data

### Performance

- Use `$derived.by()` for expensive computations
- Implement proper cleanup in effects
- Lazy load heavy components
- Optimize bundle size

## Development Workflow

### Daily Development

1. **Start Development**: `npm run dev` (starts dev server on port 5173)
2. **Run Tests**: `npm run test` (continuous testing during development)
3. **Check Performance**: Monitor console for performance warnings
4. **Code Quality**: `npm run lint` before commits

### Pre-Commit Checklist

- [ ] All tests passing (`npm run test`)
- [ ] No linting errors (`npm run lint`)
- [ ] TypeScript check passes (`npx svelte-check`)
- [ ] Performance metrics within targets
- [ ] Accessibility tests passing

### Component Development Guidelines

#### Creating New Components

1. **Choose Appropriate Variant Pattern**:

   ```svelte
   <!-- For simple UI elements -->
   <Component variant="simple" />

   <!-- For feature-rich components -->
   <Component variant="enhanced" enableAdvanced={true} />
   ```

2. **Include Comprehensive TypeScript**:

   ```typescript
   interface Props {
   	variant?: 'simple' | 'enhanced';
   	disabled?: boolean;
   	onAction?: (data: any) => void;
   }

   let { variant = 'simple', disabled = false, onAction }: Props = $props();
   ```

3. **Add Performance Tracking**:

   ```svelte
   <script>
   	import { trackComponentRender } from '$lib/utils/performance';

   	// Track render performance
   	$effect(() => {
   		const startTime = performance.now();
   		// Component logic
   		const renderTime = performance.now() - startTime;
   		trackComponentRender('ComponentName', renderTime, Object.keys(props).length);
   	});
   </script>
   ```

4. **Write Comprehensive Tests**:
   ```typescript
   describe('NewComponent', () => {
   	it('renders all variants correctly', () => {
   		// Test simple variant
   		// Test enhanced variant
   		// Test accessibility
   		// Test performance
   	});
   });
   ```

### Code Review Guidelines

#### For Component Reviews

- [ ] Variant pattern implemented correctly
- [ ] TypeScript interfaces comprehensive
- [ ] Accessibility features included
- [ ] Performance optimizations applied
- [ ] Tests cover all functionality
- [ ] Documentation updated

#### For Feature Reviews

- [ ] Unified components used appropriately
- [ ] State management follows established patterns
- [ ] Error handling implemented
- [ ] Performance metrics monitored
- [ ] Tests added for new functionality

### Deployment Workflow

1. **Development**: Feature development with tests
2. **Staging**: Integration testing and performance validation
3. **Production**: Automated deployment with monitoring

### Performance Monitoring

#### Key Metrics to Monitor

- **Core Web Vitals**: LCP <2.5s, FID <100ms, CLS <0.1
- **Component Performance**: Average render time <16ms
- **Memory Usage**: Heap size <50MB
- **API Performance**: Response time <1000ms
- **Bundle Size**: JavaScript <200KB

#### Automated Monitoring

- Performance reports generated on each deployment
- Alerts for performance regressions
- Real user monitoring for production issues
- A/B testing capabilities for optimization experiments

## Architecture Notes

- SvelteKit 5 with modern runes
- SQLite database with Drizzle ORM
- No authentication required
- Cookie-based participant tracking
- Real-time analytics with reactive state
- AI integration ready (OpenAI API)</content>
  </xai:function_call
