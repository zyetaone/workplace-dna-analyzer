# Component Documentation

## Overview

This document provides comprehensive documentation for all unified components in the PPT Quiz App. All components follow consistent patterns, use Svelte 5 features, and are designed for maximum reusability.

## Unified Components

### QuizOption

A unified quiz option component that consolidates multiple quiz option implementations into a single, variant-based component.

#### Features

- **3 Variants**: `simple`, `enhanced`, `card`
- **Accessibility**: Full keyboard navigation and ARIA support
- **Animations**: Progressive reveal, selection feedback, ripple effects
- **Icons**: Workplace preference icons with fallbacks
- **Touch Support**: Mobile-optimized interactions

#### Usage

```svelte
<script>
	import QuizOption from '$lib/components/quiz/QuizOption.svelte';

	let selectedAnswer = $state('');
	const options = [
		{ id: 'option1', label: 'Option 1', description: 'Description' },
		{ id: 'option2', label: 'Option 2', description: 'Description' }
	];
</script>

{#each options as option, index (option.id)}
	<QuizOption
		variant="enhanced"
		id={option.id}
		label={option.label}
		description={option.description}
		selected={selectedAnswer === option.id}
		{index}
		onSelect={(id) => (selectedAnswer = id)}
	/>
{/each}
```

#### Props

| Prop             | Type                               | Default                  | Description                                            |
| ---------------- | ---------------------------------- | ------------------------ | ------------------------------------------------------ |
| `id`             | `string`                           | -                        | Unique identifier for the option                       |
| `label`          | `string`                           | -                        | Display label for the option                           |
| `description`    | `string?`                          | -                        | Optional description text                              |
| `icon`           | `string?`                          | -                        | Custom icon (falls back to workplace preference icons) |
| `selected`       | `boolean`                          | `false`                  | Whether this option is selected                        |
| `disabled`       | `boolean`                          | `false`                  | Whether this option is disabled                        |
| `onSelect`       | `(id: string) => void`             | -                        | Callback when option is selected                       |
| `index`          | `number`                           | `0`                      | Animation index for staggered reveals                  |
| `variant`        | `'simple' \| 'enhanced' \| 'card'` | `'enhanced'`             | Visual variant                                         |
| `showInstantly`  | `boolean`                          | `false`                  | Skip reveal animation                                  |
| `enableAdvanced` | `boolean`                          | `variant === 'enhanced'` | Enable advanced interactions                           |

#### Variants

##### Simple

- Basic styling with minimal animations
- Best for: Simple forms, quick selections

##### Enhanced

- Full animations, ripple effects, touch support
- Best for: Interactive quizzes, engaging experiences

##### Card

- Hover effects, gradient borders, mouse tracking
- Best for: Desktop experiences, detailed options

---

### DonutChart

A unified D3 donut chart component that supports multiple data formats and interaction modes.

#### Features

- **Multiple Data Formats**: ChartData array or ChartJS format
- **3 Variants**: `simple`, `interactive`, `generation`
- **Responsive**: Automatic sizing and mobile optimization
- **Accessibility**: Proper ARIA labels and keyboard support
- **Performance**: Efficient re-rendering and cleanup

#### Usage

```svelte
<script>
	import DonutChart from '$lib/components/charts/DonutChart.svelte';

	// ChartData format
	const chartData = [
		{ label: 'Category A', value: 30, color: '#a855f7' },
		{ label: 'Category B', value: 25, color: '#ec4899' },
		{ label: 'Category C', value: 45, color: '#3b82f6' }
	];

	// ChartJS format
	const chartJSData = {
		data: {
			labels: ['A', 'B', 'C'],
			datasets: [
				{
					data: [30, 25, 45],
					backgroundColor: ['#a855f7', '#ec4899', '#3b82f6']
				}
			]
		}
	};
</script>

<!-- Simple variant -->
<DonutChart data={chartData} />

<!-- Interactive with tooltips -->
<DonutChart data={chartData} variant="interactive" showTooltips={true} />

<!-- Generation style with center text -->
<DonutChart
	data={chartData}
	variant="generation"
	centerText="Workplace Distribution"
	showPercentages={true}
/>
```

#### Props

| Prop                    | Type                                        | Default                     | Description                        |
| ----------------------- | ------------------------------------------- | --------------------------- | ---------------------------------- |
| `data`                  | `ChartData[] \| ChartJSData`                | -                           | Chart data in either format        |
| `width`                 | `number`                                    | `300`                       | Chart width in pixels              |
| `height`                | `number`                                    | `300`                       | Chart height in pixels             |
| `variant`               | `'simple' \| 'interactive' \| 'generation'` | `'simple'`                  | Visual variant                     |
| `centerText`            | `string?`                                   | -                           | Center text for generation variant |
| `showTooltips`          | `boolean`                                   | `variant === 'interactive'` | Enable hover tooltips              |
| `innerRadius`           | `number`                                    | `0.6`                       | Inner radius ratio (0-1)           |
| `showPercentages`       | `boolean`                                   | `variant === 'generation'`  | Show percentage labels             |
| `minPercentageForLabel` | `number`                                    | `5`                         | Minimum percentage to show label   |
| `class`                 | `string?`                                   | -                           | Additional CSS classes             |

#### Data Formats

##### ChartData Format

```typescript
interface ChartData {
	label: string;
	value: number;
	color: string;
}
```

##### ChartJS Format

```typescript
interface ChartJSData {
	data: {
		labels: string[];
		datasets: Array<{
			data: number[];
			backgroundColor: string[];
		}>;
	};
}
```

#### Variants

##### Simple

- Basic donut chart with labels
- Best for: Static data display, simple dashboards

##### Interactive

- Hover effects, tooltips, click handling
- Best for: Data exploration, interactive reports

##### Generation

- Center text, percentage labels, professional styling
- Best for: Reports, presentations, executive dashboards

---

### Loading

A unified loading component that consolidates multiple loading patterns into a single, variant-based component.

#### Features

- **4 Variants**: `spinner`, `screen`, `skeleton`, `quiz`
- **Flexible Configuration**: Customizable sizes, colors, messages
- **Animations**: Smooth transitions and progress indicators
- **Accessibility**: Proper ARIA labels and screen reader support
- **Performance**: Efficient rendering and cleanup

#### Usage

```svelte
<script>
	import Loading from '$lib/components/shared/Loading.svelte';
</script>

<!-- Simple spinner -->
<Loading variant="spinner" />

<!-- Spinner with custom size and color -->
<Loading variant="spinner" size="lg" color="blue" message="Processing..." />

<!-- Full screen loading -->
<Loading
	variant="screen"
	message="Loading your dashboard..."
	subMessage="This may take a few seconds"
/>

<!-- Skeleton loading -->
<Loading
	variant="skeleton"
	lines={4}
	showAvatar={true}
	lineWidths={['w-full', 'w-3/4', 'w-1/2', 'w-2/3']}
/>

<!-- Quiz-specific loading -->
<Loading variant="quiz" showProgress={true} message="Preparing your quiz..." />
```

#### Props

| Prop           | Type                                            | Default                        | Description                      |
| -------------- | ----------------------------------------------- | ------------------------------ | -------------------------------- |
| `variant`      | `'spinner' \| 'screen' \| 'skeleton' \| 'quiz'` | `'spinner'`                    | Loading variant                  |
| `size`         | `'sm' \| 'md' \| 'lg'`                          | `'md'`                         | Size for spinner variant         |
| `color`        | `'white' \| 'gray' \| 'blue'`                   | `'gray'`                       | Color for spinner variant        |
| `message`      | `string?`                                       | Variant-specific               | Main loading message             |
| `subMessage`   | `string?`                                       | Variant-specific               | Secondary message                |
| `showProgress` | `boolean`                                       | `false`                        | Show progress bar (quiz variant) |
| `lines`        | `number`                                        | `3`                            | Number of skeleton lines         |
| `lineHeight`   | `string`                                        | `'h-4'`                        | Skeleton line height             |
| `lineWidths`   | `string \| string[]`                            | `['w-full', 'w-3/4', 'w-1/2']` | Skeleton line widths             |
| `showAvatar`   | `boolean`                                       | `false`                        | Show avatar in skeleton          |
| `class`        | `string?`                                       | -                              | Additional CSS classes           |
| `children`     | `Snippet?`                                      | -                              | Custom loading content           |

#### Variants

##### Spinner

- Simple rotating spinner with optional message
- Best for: Inline loading, button states, small areas

##### Screen

- Full-screen overlay with backdrop blur
- Best for: Page transitions, initial app loading

##### Skeleton

- Content placeholder with configurable lines
- Best for: List loading, card placeholders, content areas

##### Quiz

- Quiz-specific loading with progress and tips
- Best for: Quiz initialization, question transitions

---

### Button

An enhanced button component built on Bits UI with advanced interaction patterns and comprehensive variant system.

#### Features

- **11 Variants**: Multiple visual styles including glass effects
- **4 Sizes**: From small to large with icon support
- **Advanced Interactions**: Ripple effects, press states, loading states
- **Accessibility**: Full keyboard support and ARIA attributes
- **Performance**: Optimized rendering and event handling

#### Usage

```svelte
<script>
	import Button from '$lib/components/ui/Button.svelte';

	let isLoading = $state(false);

	function handleClick() {
		console.log('Button clicked!');
	}
</script>

<!-- Basic button -->
<Button onclick={handleClick}>Click me</Button>

<!-- Button with loading state -->
<Button onclick={handleClick} loading={isLoading} variant="glass" size="lg">
	{#if isLoading}
		Processing...
	{:else}
		Submit Form
	{/if}
</Button>

<!-- Icon button -->
<Button variant="ghost" size="icon" aria-label="Close" onclick={() => console.log('Close')}>
	<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"
		></path>
	</svg>
</Button>
```

#### Props

| Prop       | Type                              | Default     | Description            |
| ---------- | --------------------------------- | ----------- | ---------------------- |
| `variant`  | Button variants                   | `'default'` | Visual style variant   |
| `size`     | `'sm' \| 'md' \| 'lg' \| 'icon'`  | `'md'`      | Button size            |
| `loading`  | `boolean`                         | `false`     | Show loading spinner   |
| `disabled` | `boolean`                         | `false`     | Disable button         |
| `type`     | `'button' \| 'submit' \| 'reset'` | `'button'`  | Button type            |
| `onclick`  | Function                          | -           | Click handler          |
| `class`    | `string?`                         | -           | Additional CSS classes |
| `children` | `Snippet`                         | -           | Button content         |

#### Variants

| Variant       | Description           | Use Case                               |
| ------------- | --------------------- | -------------------------------------- |
| `default`     | Primary action button | Main CTAs, form submissions            |
| `secondary`   | Secondary actions     | Cancel buttons, alternative actions    |
| `destructive` | Dangerous actions     | Delete, remove, destructive operations |
| `outline`     | Outlined style        | Secondary actions, filters             |
| `ghost`       | Minimal style         | Icon buttons, subtle actions           |
| `glass`       | Glass morphism        | Modern UI, overlays                    |
| `glassLight`  | Light glass           | Light-themed interfaces                |
| `light*`      | Light variants        | Light-themed applications              |

---

## Component Architecture Patterns

### Variant-Based Design

All unified components follow a consistent variant pattern:

```svelte
<Component variant="primary|secondary|tertiary" {...otherProps}>Content</Component>
```

### Props Interface Consistency

Components use consistent prop naming and TypeScript interfaces:

```typescript
interface ComponentProps {
	variant?: 'primary' | 'secondary' | 'tertiary';
	size?: 'sm' | 'md' | 'lg';
	disabled?: boolean;
	class?: string;
	children?: Snippet;
}
```

### Event Handling Patterns

Consistent event handling with proper TypeScript:

```svelte
<script>
	interface Props {
		onSelect?: (value: string) => void;
		onChange?: (event: Event) => void;
	}

	let { onSelect, onChange }: Props = $props();
</script>
```

### Accessibility Standards

All components include:

- Proper ARIA attributes
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Reduced motion support

### Performance Optimizations

Components include:

- Efficient re-rendering with `$derived`
- Proper cleanup in `$effect`
- Lazy loading where appropriate
- Bundle size optimization

---

## Migration Guide

### From Old Components

#### QuizOptionCard → QuizOption

```svelte
<!-- Old -->
<QuizOptionCard id="option1" label="Option 1" {selected} onSelect={handleSelect} />

<!-- New -->
<QuizOption variant="card" id="option1" label="Option 1" {selected} onSelect={handleSelect} />
```

#### EnhancedQuizOption → QuizOption

```svelte
<!-- Old -->
<EnhancedQuizOption id="option1" label="Option 1" {selected} onSelect={handleSelect} />

<!-- New -->
<QuizOption variant="enhanced" id="option1" label="Option 1" {selected} onSelect={handleSelect} />
```

#### D3DonutChart + GenerationDonutChart → DonutChart

```svelte
<!-- Old -->
<D3DonutChart data={chartData} />

<!-- New -->
<DonutChart data={chartData} variant="simple" />
```

#### Loading Components → Loading

```svelte
<!-- Old -->
<LoadingSpinner size="lg" />
<QuizLoadingState showProgress={true} />

<!-- New -->
<Loading variant="spinner" size="lg" />
<Loading variant="quiz" showProgress={true} />
```

---

## Testing

All components include comprehensive test suites covering:

- **Unit Tests**: Component rendering, props, events
- **Integration Tests**: Component interactions, state management
- **Accessibility Tests**: ARIA attributes, keyboard navigation
- **Performance Tests**: Render time, memory usage
- **Visual Regression**: Appearance consistency

Run tests with:

```bash
npm run test          # Run all tests
npm run test:ui       # Interactive test UI
npm run test:coverage # Coverage report
```

---

## Contributing

When adding new components:

1. **Follow the variant pattern** for multiple visual styles
2. **Include comprehensive TypeScript interfaces**
3. **Add accessibility features** from the start
4. **Write tests** for all functionality
5. **Update this documentation** with usage examples
6. **Follow the established naming conventions**

### Component Checklist

- [ ] TypeScript interfaces defined
- [ ] Variants implemented (if applicable)
- [ ] Accessibility features included
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Performance optimized
- [ ] Mobile responsive
- [ ] Dark theme support
