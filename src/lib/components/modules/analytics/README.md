# Analytics Module

A comprehensive analytics module for SvelteKit applications featuring interactive charts, metrics dashboards, and AI-powered insights.

## Features

- **Interactive Charts**: Radar, Bar, Donut, Trend Line, and Word Cloud visualizations
- **Metrics Dashboard**: Real-time KPI tracking with change indicators
- **AI Insights Panel**: Intelligent analysis with categorized insights
- **Fully Responsive**: Mobile-first design with TailwindCSS
- **Animated Transitions**: Smooth Chart.js animations
- **TypeScript Support**: Full type safety and IntelliSense

## Installation

The module is already included in the project. Chart.js and D3 dependencies are pre-installed.

## Usage

### Basic Chart Components

```svelte
<script>
	import { RadarChart, BarChart, DonutChart, TrendLine } from '$lib/modules/analytics';

	const chartData = {
		labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
		datasets: [
			{
				label: 'Sales',
				data: [65, 72, 78, 82, 88]
			}
		]
	};
</script>

<BarChart data={chartData} height="300px" />
<TrendLine data={chartData} showArea={true} smooth={true} />
```

### Metrics Grid

```svelte
<script>
	import { MetricsGrid } from '$lib/modules/analytics';

	const metrics = [
		{
			id: '1',
			label: 'Total Users',
			value: 1248,
			change: 12,
			changeLabel: 'from last month',
			icon: 'users',
			color: 'blue'
		}
	];
</script>

<MetricsGrid {metrics} columns={4} />
```

### Insights Panel

```svelte
<script>
	import { InsightsPanel } from '$lib/modules/analytics';

	const insights = [
		{
			id: '1',
			type: 'success',
			title: 'High Engagement',
			description: 'User engagement increased by 25%',
			metric: '+25%',
			timestamp: new Date()
		}
	];
</script>

<InsightsPanel {insights} aiPowered={true} />
```

### Full Dashboard

```svelte
<script>
	import { AnalyticsDashboard } from '$lib/modules/analytics';
</script>

<AnalyticsDashboard sessionId="session-001" title="Workplace Analytics" refreshInterval={30000} />
```

## Components

### Chart Components

- **RadarChart**: Multi-axis comparison charts
- **BarChart**: Vertical/horizontal bar charts
- **DonutChart**: Donut charts with center text
- **TrendLine**: Line charts with area fills
- **WordCloud**: D3-powered word clouds

### Dashboard Components

- **AnalyticsDashboard**: Complete analytics dashboard with tabs
- **MetricsGrid**: KPI display grid with icons and trends
- **InsightsPanel**: AI-powered insights display

### Store

- **analyticsStore**: Reactive state management for analytics data

### Utilities

- **chart-configs**: Pre-configured chart options and color schemes
- **mock-data**: Sample data generators for testing

## Configuration

### Chart Options

All chart components accept custom Chart.js options:

```svelte
<BarChart
	{data}
	options={{
		plugins: {
			legend: { position: 'bottom' }
		},
		scales: {
			y: { beginAtZero: true }
		}
	}}
/>
```

### Color Schemes

The module includes predefined color palettes:

```typescript
import { chartPalette, defaultColors } from '$lib/modules/analytics';
```

### Responsive Design

All components are responsive by default. Control sizing with height prop and Tailwind classes:

```svelte
<RadarChart {data} height="400px" class="w-full lg:w-1/2" />
```

## Demo Pages

- `/demo/analytics` - Full dashboard demo
- `/demo/analytics-components` - Individual component showcase

## TypeScript Types

```typescript
interface Metric {
	id: string;
	label: string;
	value: string | number;
	change?: number;
	changeLabel?: string;
	icon?: 'trending-up' | 'trending-down' | 'activity' | 'users' | 'clock' | 'check';
	color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
	loading?: boolean;
}

interface Insight {
	id: string;
	type: 'success' | 'warning' | 'error' | 'info' | 'trend';
	title: string;
	description: string;
	metric?: string;
	action?: {
		label: string;
		onClick: () => void;
	};
	timestamp?: Date;
}
```

## Performance

- Charts use Canvas rendering for optimal performance
- Lazy loading with dynamic imports supported
- Automatic cleanup on component unmount
- Efficient re-rendering with Svelte 5 reactivity

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT
