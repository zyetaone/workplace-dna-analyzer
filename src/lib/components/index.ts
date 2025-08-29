// Unified component exports - Phase 2 optimization
// Single source of truth for all component imports

// Core UI Components
export { default as Button } from './ui/Button.svelte';
export { default as Card } from './ui/Card.svelte';

// Form Components with Bits UI
export { default as TextInput } from './ui/TextInput.svelte';
export { default as Select } from './ui/Select.svelte';
export { default as Checkbox } from './ui/Checkbox.svelte';
export { default as RadioGroup } from './ui/RadioGroup.svelte';

// Bits UI Components
export { default as Progress } from './ui/Progress.svelte';
export { default as Tooltip } from './ui/Tooltip.svelte';

// Display Components
export { default as LoadingScreen } from './shared/LoadingScreen.svelte';
export { default as LoadingSpinner } from './shared/LoadingSpinner.svelte';
export { default as ErrorMessage } from './shared/ErrorMessage.svelte';
export { default as ErrorScreen } from './shared/ErrorScreen.svelte';

// Interactive Components
export { default as ConfirmationDialog } from './ui/ConfirmationDialog.svelte';

// Specialized Components
export { default as ScoreDisplay } from './ui/ScoreDisplay.svelte';
export { default as StatsCard } from './ui/StatsCard.svelte';
export { default as StatsCardPremium } from './ui/StatsCardPremium.svelte';
export { default as ParticipantCard } from './ui/ParticipantCard.svelte';

// Chart Components
export { default as Chart } from './charts/Chart.svelte';
export { default as D3BarChart } from './charts/D3BarChart.svelte';
export { default as D3DonutChart } from './charts/D3DonutChart.svelte';
export { default as D3RadarChart } from './charts/D3RadarChart.svelte';
export { default as WordCloud } from './charts/WordCloud.svelte';

// Route-specific components (moved to respective (components) directories)
// - JoinForm: moved to src/routes/(components)/JoinForm.svelte
// - ParticipantList: moved to src/routes/(components)/ParticipantList.svelte
// - QRCode: moved to src/routes/(components)/QRCode.svelte
// - QuizContainer: moved to src/routes/(components)/QuizContainer.svelte
// - LiveStatsSection: moved to src/routes/(components)/LiveStatsSection.svelte
// - PresenterLayout: moved to src/routes/(components)/PresenterLayout.svelte
// - QuestionCard: moved to src/routes/(components)/QuestionCard.svelte
// - AnalysisCharts: moved to src/routes/admin/(components)/AnalysisCharts.svelte
// - InsightsPanel: moved to src/routes/admin/(components)/InsightsPanel.svelte
// - ParticipantManager: moved to src/routes/admin/(components)/ParticipantManager.svelte
// - SessionHeader: moved to src/routes/admin/(components)/SessionHeader.svelte
// - StatsGrid: moved to src/routes/admin/(components)/StatsGrid.svelte
// - SessionAnalytics: moved to src/routes/admin/[code]/(components)/SessionAnalytics.svelte
// - Toast: moved to src/routes/admin/(components)/Toast.svelte
// - ActivityIndicator: moved to src/routes/admin/(components)/ActivityIndicator.svelte
// - CreativeGenerator: moved to src/routes/admin/(components)/CreativeGenerator.svelte
// - MagicalEffects: moved to src/routes/admin/(components)/MagicalEffects.svelte
// - MilestoneToast: moved to src/routes/admin/(components)/MilestoneToast.svelte
// - OfficeLayoutPlanner: moved to src/routes/admin/(components)/OfficeLayoutPlanner.svelte
// - SoundNotifications: moved to src/routes/admin/(components)/SoundNotifications.svelte