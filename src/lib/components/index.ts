/**
 * Central export hub for all reusable UI components and snippets
 * 
 * This module provides a single import point for all shared UI components,
 * snippets, and utilities following DRY principles and Svelte 5 patterns.
 */

// Core Components
export { default as LoadingScreen } from './LoadingScreen.svelte';
export { default as ErrorScreen } from './ErrorScreen.svelte';
export { default as QRCode } from './QRCode.svelte';
export { default as ParticipantList } from './ParticipantList.svelte';
export { default as ZyetaAssistant } from './ZyetaAssistant.svelte';

// Chart Components
export { default as Chart } from './charts/Chart.svelte';
export { default as WordCloud } from './charts/WordCloud.svelte';

// UI Components
export { default as StatCard } from './StatCard.svelte';
export { default as QuestionCard } from './QuestionCard.svelte';

// Shared Snippets - Import individual snippets as needed
export {
	sessionCard,
	chartContainer,
	scoreCard,
	participantRow,
	metricCard,
	emptyState,
	statusBadge,
	progressBar,
	connectionStatus,
	loadingIndicator,
	actionButton
} from './SharedSnippets.svelte';

// Type exports for snippet props
export type {
	SessionCardProps,
	ChartContainerProps,
	ScoreCardProps,
	ParticipantRowProps,
	MetricCardProps,
	EmptyStateProps,
	StatusBadgeProps,
	ProgressBarProps
} from './SharedSnippets.svelte';

/**
 * Usage Examples:
 * 
 * // Import individual components
 * import { LoadingScreen, ErrorScreen } from '$lib/components';
 * 
 * // Import specific snippets
 * import { sessionCard, emptyState } from '$lib/components';
 * 
 * // Use in template
 * {@render sessionCard({ session, onOpen, onDelete })}
 * {@render emptyState({ title: 'No Data', message: 'Start by adding data' })}
 */