// Organized component exports by category

// Form Components - Input controls and form elements
export * from './forms';

// Layout Components - Container and layout elements
export * from './layout';

// Feedback Components - Dialogs, notifications, and user feedback
export * from './feedback';

// Data Display Components - Progress bars, meters, status indicators, and data visualization
export * from './data';

// Navigation Components - Tabs and navigation elements
export * from './navigation';

// Specialized Components - Unique functionality components
export * from './specialized';

// Chart Components (from parent charts folder)
export * from '../charts';

// Legacy aliases for backward compatibility
// Note: TextInput and StatusIndicator are now aliases to Input and Status respectively
export { default as TextInput } from './forms/Input.svelte';
export { default as StatusIndicator } from './data/Status.svelte';

// Unified feedback components (use Feedback for Loading/Error states)
export { default as Loading } from './feedback/Feedback.svelte';
export { default as ErrorMessage } from './feedback/Feedback.svelte';
